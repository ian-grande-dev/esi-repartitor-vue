import { supabase } from '../supabase.js'

// All functions in this file talk to Supabase.
// When Supabase returns an error, we throw it.
// The view catches the error and shows a message to the user.

// A text can have more than one translation or edition (for example after a change
// of person). We sort them by date, newest first, so [0] is always the current one.
const TEXT_WITH_WORK = `
  *,
  translation(*),
  edition(*)
`

function newestFirst(query) {
  return query
    .order('attributed', { referencedTable: 'translation', ascending: false })
    .order('attributed', { referencedTable: 'edition', ascending: false })
}

// Get all texts with their translation and edition.
// Used by the repartitor to see the full list.
export async function getTexts() {
  const { data, error } = await newestFirst(
    supabase.from('text').select(TEXT_WITH_WORK).order('deadline'),
  )
  if (error) throw error
  return data ?? []
}

// Get one text by id, with its translation and edition.
// Returns null if the text does not exist.
export async function getTextById(id) {
  const { data, error } = await newestFirst(
    supabase.from('text').select(TEXT_WITH_WORK).eq('id', id),
  ).maybeSingle()
  if (error) throw error
  return data
}

// Get the translations given to one translator, with the text details.
export async function getTranslationsOf(translatorId) {
  const { data, error } = await supabase
    .from('translation')
    .select('*, text(*)')
    .eq('translator', translatorId)
    .order('deadline')
  if (error) throw error
  return data ?? []
}

// Get the editions given to one editor.
// We also need the translations of each text, to know if the editor can start.
export async function getEditionsOf(editorId) {
  const { data, error } = await supabase
    .from('edition')
    .select('*, text(*, translation(*))')
    .eq('editor', editorId)
    .order('attributed')
  if (error) throw error
  return data ?? []
}

// Give a text to a translator, with a personal deadline.
// upsert = insert a new row, or update it if it already exists.
export async function assignTranslator(textId, translatorId, deadline) {
  const { error } = await supabase
    .from('translation')
    .upsert({ text: textId, translator: translatorId, deadline: new Date(deadline).toISOString() })
  if (error) throw error
}

// Give a text to an editor.
// translatorId links the edition to the right translation (column translated_by).
export async function assignEditor(textId, editorId, translatorId) {
  const { error } = await supabase
    .from('edition')
    .upsert({ text: textId, editor: editorId, translated_by: translatorId })
  if (error) throw error
}

// Mark a translation as finished (or not finished).
// finished = true  -> save the current date
// finished = false -> remove the date (to undo a mistake)
export async function setTranslationFinished(textId, translatorId, finished) {
  const { error } = await supabase
    .from('translation')
    .update({ finished: finished ? new Date().toISOString() : null })
    .eq('text', textId)
    .eq('translator', translatorId)
  if (error) throw error
}

// Mark an edition as finished (or not finished). Same idea as above.
export async function setEditionFinished(textId, editorId, finished) {
  const { error } = await supabase
    .from('edition')
    .update({ finished: finished ? new Date().toISOString() : null })
    .eq('text', textId)
    .eq('editor', editorId)
  if (error) throw error
}

// Get the workload of every translator.
// It uses the SQL view translator_workload (see resource/repartitor-views.sql).
// Returns: [{ translator, words, busydays, texts }]
export async function getTranslatorWorkload() {
  const { data, error } = await supabase
    .from('translator_workload')
    .select('*')
  if (error) throw error
  return data ?? []
}

// Get the workload of every editor.
// Returns an object: { editorId: { ready, waiting } }
//   ready   = the translation is done, so the editor can work on it now
//   waiting = all editions that are not finished
export async function getEditorWorkload() {
  // 1. All editions that are not finished
  const { data: editions, error } = await supabase
    .from('edition')
    .select('editor, text, translated_by')
    .is('finished', null)
  if (error) throw error
  if (!editions?.length) return {}

  // 2. Which of these texts have a finished translation?
  const textIds = [...new Set(editions.map(e => e.text))] // Set removes duplicates
  const { data: finished, error: error2 } = await supabase
    .from('translation')
    .select('text, translator')
    .in('text', textIds)
    .not('finished', 'is', null)
  if (error2) throw error2

  // 3. Put the finished translations in a Set, so the check below is fast
  const done = new Set((finished ?? []).map(t => `${t.text}-${t.translator}`))

  // 4. Count for each editor
  const result = {}
  for (const e of editions) {
    result[e.editor] ??= { ready: 0, waiting: 0 }
    result[e.editor].waiting++
    if (e.translated_by && done.has(`${e.text}-${e.translated_by}`)) {
      result[e.editor].ready++
    }
  }
  return result
}
