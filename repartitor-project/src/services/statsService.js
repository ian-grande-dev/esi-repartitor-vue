import { supabase } from '../supabase.js'
import { sumWords } from '../utils/format.js'

// All the queries for the statistics pages.
// Each stat is an object { texts, words }.

// Makes a { texts, words } object from a list.
function stat(items, getText) {
  return { texts: items.length, words: sumWords(items, getText) }
}

// The date inputs give local time without a time zone ("2026-03-01T14:30").
// We convert it to a full ISO date, so Supabase compares with the right hour.
function toIso(localDate) {
  return new Date(localDate).toISOString()
}

// Current state of all texts (no period needed).
export async function getCurrentGlobalStats() {
  const { data, error } = await supabase
    .from('text')
    .select('wordcount, translation(finished, attributed), edition(finished, attributed)')
    .order('attributed', { referencedTable: 'translation', ascending: false })
    .order('attributed', { referencedTable: 'edition', ascending: false })
  if (error) throw error

  const texts = data ?? []
  const getText = t => t // here each item IS the text
  const translation = t => t.translation?.[0] // newest translation
  const edition = t => t.edition?.[0]         // newest edition

  return {
    inProgress:            stat(texts.filter(t => !edition(t)?.finished), getText),
    translationUnassigned: stat(texts.filter(t => !translation(t)), getText),
    translationInProgress: stat(texts.filter(t => translation(t) && !translation(t).finished), getText),
    editionUnassigned:     stat(texts.filter(t => translation(t)?.finished && !edition(t)), getText),
    editionInProgress:     stat(texts.filter(t => edition(t) && !edition(t).finished), getText),
  }
}

// Work finished during a period, for the whole team.
export async function getPastGlobalStats(from, to) {
  // The two queries run at the same time
  const [trad, ed] = await Promise.all([
    supabase.from('translation').select('finished, deadline, text(wordcount)')
      .not('finished', 'is', null)
      .gte('finished', toIso(from))
      .lte('finished', toIso(to)),
    supabase.from('edition').select('finished, text(wordcount, deadline)')
      .not('finished', 'is', null)
      .gte('finished', toIso(from))
      .lte('finished', toIso(to)),
  ])
  if (trad.error) throw trad.error
  if (ed.error) throw ed.error

  const translations = trad.data ?? []
  const editions = ed.data ?? []

  // A translation is late if it ends after the translator's deadline.
  // An edition is late if it ends after the text's final deadline.
  const lateTranslations = translations.filter(t => new Date(t.finished) > new Date(t.deadline))
  const lateEditions = editions.filter(e => new Date(e.finished) > new Date(e.text?.deadline))

  return {
    translationsDone: stat(translations),
    translationsLate: stat(lateTranslations),
    editionsDone:     stat(editions),
    editionsLate:     stat(lateEditions),
  }
}

// Current work of one person.
// table = 'translation' or 'edition', column = 'translator' or 'editor'
async function getCurrentPersonStats(table, column, personId) {
  const { data, error } = await supabase
    .from(table)
    .select('text(wordcount)')
    .eq(column, personId)
    .is('finished', null) // only the work that is not finished
  if (error) throw error
  return stat(data ?? [])
}

// Work given to one person during a period.
async function getPastPersonStats(table, column, personId, from, to, isLate) {
  const select = table === 'translation'
    ? 'finished, deadline, text(wordcount)'
    : 'finished, text(wordcount, deadline)'

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(column, personId)
    .gte('attributed', toIso(from))
    .lte('attributed', toIso(to))
  if (error) throw error

  const rows = data ?? []
  const done = rows.filter(r => r.finished)
  return {
    assigned: stat(rows),
    done:     stat(done),
    late:     stat(done.filter(isLate)),
  }
}

// ---- Translator ----
export function getCurrentTranslatorStats(id) {
  return getCurrentPersonStats('translation', 'translator', id)
}
export function getPastTranslatorStats(id, from, to) {
  // Late = finished after the translator's own deadline
  return getPastPersonStats('translation', 'translator', id, from, to,
    r => new Date(r.finished) > new Date(r.deadline))
}

// ---- Editor ----
export function getCurrentEditorStats(id) {
  return getCurrentPersonStats('edition', 'editor', id)
}
export function getPastEditorStats(id, from, to) {
  // Late = finished after the final deadline of the text
  return getPastPersonStats('edition', 'editor', id, from, to,
    r => new Date(r.finished) > new Date(r.text?.deadline))
}
