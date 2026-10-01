export const CHAPTER_TIMEZONE = 'America/Los_Angeles'

type DateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function parseDatetimeLocalParts(value: string): DateTimeParts | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  }
}

function chapterPartsFromUtcDate(date: Date): DateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CHAPTER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  }
}

function diffPartsMinutes(target: DateTimeParts, actual: DateTimeParts): number {
  const targetDate = new Date(target.year, target.month - 1, target.day, target.hour, target.minute)
  const actualDate = new Date(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute)
  return Math.round((targetDate.getTime() - actualDate.getTime()) / 60_000)
}

export function chapterLocalToUtcIso(value: string): string | null {
  const target = parseDatetimeLocalParts(value)
  if (!target) return null

  let utcMs = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute)
  for (let i = 0; i < 4; i += 1) {
    const actual = chapterPartsFromUtcDate(new Date(utcMs))
    const diffMinutes = diffPartsMinutes(target, actual)
    if (diffMinutes === 0) return new Date(utcMs).toISOString()
    utcMs += diffMinutes * 60_000
  }

  return null
}

export function utcIsoToChapterLocalValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = chapterPartsFromUtcDate(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

/** Reinterpret legacy UTC wall-clock values as Pacific local and re-encode. */
export function fixMisstoredChapterDatetime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  const localValue = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  return chapterLocalToUtcIso(localValue) ?? iso
}

export function parseDatetimeLocal(value: string): string | null {
  return chapterLocalToUtcIso(value)
}

export function toDatetimeLocalValue(iso: string): string {
  return utcIsoToChapterLocalValue(iso)
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-CA', { timeZone: CHAPTER_TIMEZONE })
}
