import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CHAPTER_TIMEZONE = 'America/Los_Angeles'
const D1_DATABASE = 'nuca-lv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const isRemote = process.argv.includes('--remote')
const dryRun = process.argv.includes('--dry-run')

function parseDatetimeLocalParts(value) {
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

function chapterPartsFromUtcDate(date) {
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

function diffPartsMinutes(target, actual) {
  const targetDate = new Date(target.year, target.month - 1, target.day, target.hour, target.minute)
  const actualDate = new Date(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute)
  return Math.round((targetDate.getTime() - actualDate.getTime()) / 60_000)
}

function chapterLocalToUtcIso(value) {
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

function fixMisstoredChapterDatetime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  const localValue = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  return chapterLocalToUtcIso(localValue) ?? iso
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function d1Execute(sql) {
  const scope = isRemote ? '--remote' : '--local'
  const command = `npx wrangler d1 execute ${D1_DATABASE} ${scope} --command ${JSON.stringify(sql)} --json`
  const out = execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const parsed = JSON.parse(out)
  const result = parsed[0]?.results ?? []
  return result
}

const events = d1Execute('SELECT id, title, starts_at, ends_at FROM events')
let updated = 0

for (const event of events) {
  const nextStarts = fixMisstoredChapterDatetime(event.starts_at)
  const nextEnds = event.ends_at ? fixMisstoredChapterDatetime(event.ends_at) : null
  if (nextStarts === event.starts_at && nextEnds === event.ends_at) continue

  updated += 1
  console.log(`${event.title}`)
  console.log(`  starts: ${event.starts_at} -> ${nextStarts}`)
  if (event.ends_at) console.log(`  ends:   ${event.ends_at} -> ${nextEnds}`)

  if (!dryRun) {
    const endsSql = nextEnds ? sqlString(nextEnds) : 'NULL'
    d1Execute(
      `UPDATE events SET starts_at = ${sqlString(nextStarts)}, ends_at = ${endsSql} WHERE id = ${sqlString(event.id)}`,
    )
  }
}

console.log(
  dryRun
    ? `Would update ${updated} event(s). Re-run without --dry-run to apply.`
    : `Updated ${updated} event(s) using ${CHAPTER_TIMEZONE}.`,
)
