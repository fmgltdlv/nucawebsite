import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const D1_DATABASE = 'nuca-lv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const isRemote = process.argv.includes('--remote')
const dryRun = process.argv.includes('--dry-run')
const inputArg = process.argv.find((arg) => arg.startsWith('--in='))
const inputPath = inputArg
  ? path.resolve(ROOT, inputArg.slice('--in='.length))
  : path.resolve(__dirname, 'backups', 'events-pre-pacific-fix-2026-10-01.json')

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function d1Execute(sql) {
  const scope = isRemote ? '--remote' : '--local'
  const command = `npx wrangler d1 execute ${D1_DATABASE} ${scope} --command ${JSON.stringify(sql)} --json`
  const out = execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  return JSON.parse(out)
}

if (!fs.existsSync(inputPath)) {
  console.error(`Backup not found: ${inputPath}`)
  process.exit(1)
}

const backup = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
const events = backup.events ?? []
let restored = 0

for (const event of events) {
  restored += 1
  console.log(`${event.title}`)
  console.log(`  starts: ${event.starts_at}`)
  console.log(`  ends:   ${event.ends_at ?? 'NULL'}`)

  if (!dryRun) {
    const endsSql = event.ends_at ? sqlString(event.ends_at) : 'NULL'
    d1Execute(
      `UPDATE events SET starts_at = ${sqlString(event.starts_at)}, ends_at = ${endsSql} WHERE id = ${sqlString(event.id)}`,
    )
  }
}

console.log(
  dryRun
    ? `Would restore ${restored} event(s) from ${inputPath}. Re-run without --dry-run to apply.`
    : `Restored ${restored} event(s) from ${inputPath}.`,
)
