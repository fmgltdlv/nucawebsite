import type { EventRecord } from './events'

export type EventRepeatRule = 'weekly' | 'monthly' | 'yearly'

export type ExpandedEventRecord = EventRecord & {
  series_id: string
}

const REPEAT_RULES = new Set<EventRepeatRule>(['weekly', 'monthly', 'yearly'])

export function parseRepeatRule(value: unknown): EventRepeatRule | null {
  if (typeof value === 'string' && REPEAT_RULES.has(value as EventRepeatRule)) {
    return value as EventRepeatRule
  }
  return null
}

export function parseRepeatUntil(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  return trimmed
}

export function repeatRuleLabel(rule: string | null | undefined): string {
  switch (rule) {
    case 'weekly':
      return 'Weekly'
    case 'monthly':
      return 'Monthly'
    case 'yearly':
      return 'Yearly'
    default:
      return 'Does not repeat'
  }
}

function endOfDayFromDateParam(dateParam: string): Date {
  const [y, m, d] = dateParam.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate()
  const next = new Date(date)
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, lastDay))
  next.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
  return next
}

function addYearsClamped(date: Date, years: number): Date {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function nextOccurrence(current: Date, rule: EventRepeatRule): Date {
  switch (rule) {
    case 'weekly':
      return addDays(current, 7)
    case 'monthly':
      return addMonthsClamped(current, 1)
    case 'yearly':
      return addYearsClamped(current, 1)
  }
}

function eventDurationMs(event: EventRecord): number {
  if (!event.ends_at) return 0
  const start = new Date(event.starts_at).getTime()
  const end = new Date(event.ends_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
  return end - start
}

function repeatHorizonEnd(event: EventRecord, fallback: Date): Date {
  if (event.repeat_until) return endOfDayFromDateParam(event.repeat_until)
  return fallback
}

function makeOccurrence(event: EventRecord, occurrenceStart: Date, durationMs: number): ExpandedEventRecord {
  const starts_at = occurrenceStart.toISOString()
  const ends_at =
    durationMs > 0 ? new Date(occurrenceStart.getTime() + durationMs).toISOString() : event.ends_at

  return {
    ...event,
    id: `${event.id}:${starts_at}`,
    series_id: event.id,
    starts_at,
    ends_at,
  }
}

export function expandEventOccurrences(
  events: EventRecord[],
  options: {
    from?: Date
    to?: Date
    upcomingOnly?: boolean
  } = {},
): ExpandedEventRecord[] {
  const now = new Date()
  const from = options.from ?? addMonthsClamped(now, -12)
  const to = options.to ?? addMonthsClamped(now, 24)
  const upcomingOnly = options.upcomingOnly ?? false
  const occurrences: ExpandedEventRecord[] = []

  for (const event of events) {
    const rule = parseRepeatRule(event.repeat_rule)
    const durationMs = eventDurationMs(event)
    const seriesStart = new Date(event.starts_at)
    if (Number.isNaN(seriesStart.getTime())) continue

    if (!rule) {
      const occurrenceEnd =
        durationMs > 0 ? new Date(seriesStart.getTime() + durationMs) : new Date(seriesStart)
      if (upcomingOnly && occurrenceEnd < now) continue
      if (seriesStart > to || occurrenceEnd < from) continue
      occurrences.push(makeOccurrence(event, seriesStart, durationMs))
      continue
    }

    const repeatEnd = repeatHorizonEnd(event, to)
    let current = new Date(seriesStart)
    let guard = 0

    while (current <= repeatEnd && current <= to && guard < 500) {
      guard += 1
      const occurrenceEnd =
        durationMs > 0 ? new Date(current.getTime() + durationMs) : new Date(current)
      const inRange = current <= to && occurrenceEnd >= from
      const isUpcoming = occurrenceEnd >= now

      if (inRange && (!upcomingOnly || isUpcoming)) {
        occurrences.push(makeOccurrence(event, current, durationMs))
      }

      const next = nextOccurrence(current, rule)
      if (next.getTime() <= current.getTime()) break
      current = next
    }
  }

  occurrences.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  return occurrences
}
