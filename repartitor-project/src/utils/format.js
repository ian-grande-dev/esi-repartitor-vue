// Small helpers to format dates and durations.
// They are used in many views, so we keep them in one place.

const MS_PER_MINUTE = 60 * 1000
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE

// Long French date with the hour.
// Example: "lundi 3 mars 2026 à 14:30"
export function formatLongDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Short French date with the hour.
// Example: "03/03/2026 14:30"
export function formatShortDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('fr-BE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Makes a value for an <input type="datetime-local">.
// We use the LOCAL time of the user.
// Note: toISOString() gives UTC time, so it is 1 or 2 hours wrong in Belgium.
export function toDateTimeInput(date) {
  const d = new Date(date)
  const offset = d.getTimezoneOffset() * MS_PER_MINUTE
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

// Default period for the stats pages: from one month ago until now.
export function defaultPeriod() {
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(now.getMonth() - 1)
  return { from: toDateTimeInput(oneMonthAgo), to: toDateTimeInput(now) }
}

// Number of full days between two dates.
export function daysBetween(from, to) {
  return Math.round((new Date(to) - new Date(from)) / MS_PER_DAY)
}

// Turns a duration in milliseconds into a short text.
// Example: 3 days and 2 hours -> "3 j 2 h"
// If the duration is negative, the deadline is already passed.
export function formatDuration(ms) {
  if (ms <= 0) return 'dépassé'
  const totalMin = Math.floor(ms / MS_PER_MINUTE)
  const days = Math.floor(totalMin / 1440) // 1440 minutes in one day
  const hours = Math.floor((totalMin % 1440) / 60)
  const mins = totalMin % 60

  const parts = []
  if (days > 0) parts.push(`${days} j`)
  if (hours > 0) parts.push(`${hours} h`)
  if (mins > 0 && days === 0) parts.push(`${mins} min`) // minutes only when less than one day
  return parts.join(' ') || '< 1 min'
}

// Turns a number of work days (with decimals) into a short text.
// Example: 4.5 -> "4 j 12 h"
export function formatDays(days) {
  const d = Math.floor(days)
  const h = Math.round((days - d) * 24)
  const parts = []
  if (d > 0) parts.push(`${d} j`)
  if (h > 0) parts.push(`${h} h`)
  return parts.join(' ') || '0 h'
}

// Adds thin spaces in big numbers. Example: 12500 -> "12 500"
export function formatNumber(n) {
  return new Intl.NumberFormat('fr-BE').format(n ?? 0)
}

// Sum of the word counts of a list.
// getText tells the function where to find the text object in each item.
export function sumWords(items, getText = item => item.text) {
  return (items ?? []).reduce((total, item) => total + (getText(item)?.wordcount ?? 0), 0)
}
