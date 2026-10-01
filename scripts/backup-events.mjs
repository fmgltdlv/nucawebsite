import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const D1_DATABASE = 'nuca-lv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const isRemote = process.argv.includes('--remote')
const outputArg = process.argv.find((arg) => arg.startsWith('--out='))
const defaultName = `events-pre-pacific-fix-${new Date().toISOString().slice(0, 10)}.json`
const outputPath = outputArg
  ? path.resolve(ROOT, outputArg.slice('--out='.length))
  : path.resolve(__dirname, 'backups', defaultName)

function d1Execute(sql) {
  const scope = isRemote ? '--remote' : '--local'
  const command = `npx wrangler d1 execute ${D1_DATABASE} ${scope} --command ${JSON.stringify(sql)} --json`
  const out = execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const parsed = JSON.parse(out)
  return parsed[0]?.results ?? []
}

const events = d1Execute('SELECT * FROM events ORDER BY starts_at')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      database: D1_DATABASE,
      scope: isRemote ? 'remote' : 'local',
      event_count: events.length,
      events,
    },
    null,
    2,
  ),
)

console.log(`Saved ${events.length} event(s) to ${outputPath}`)
