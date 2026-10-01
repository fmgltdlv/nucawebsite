import { CHAPTER_TIMEZONE } from './datetime'

const EVENT_DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: CHAPTER_TIMEZONE,
}

const EVENT_DATETIME_SHORT_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: CHAPTER_TIMEZONE,
}

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', EVENT_DATETIME_FORMAT)
}

export function formatEventDateShort(iso: string) {
  return new Date(iso).toLocaleString('en-US', EVENT_DATETIME_SHORT_FORMAT)
}

export function formatArchiveDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: CHAPTER_TIMEZONE,
  })
}

export function formatAdminDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    dateStyle: 'medium',
    timeZone: CHAPTER_TIMEZONE,
  })
}
