import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import https from 'node:https'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const LEADERSHIP_URL = 'https://nucalasvegas.com/leadership/'
const R2_BUCKET = 'nuca-lv-assets'
const D1_DATABASE = 'nuca-lv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function get(url, binary = false) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location, binary).then(resolve, reject)
          return
        }
        const chunks = []
        res.on('data', (chunk) => {
          chunks.push(chunk)
        })
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`GET ${url} failed: ${res.statusCode}`))
            return
          }
          const body = Buffer.concat(chunks)
          resolve(binary ? body : body.toString('utf8'))
        })
      })
      .on('error', reject)
  })
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0*38;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function buildRoleTitle(designation) {
  return stripHtml(designation)
}

function parseDescription(descHtml) {
  if (!descHtml) return { chair_title: null, company: null }
  const lines = descHtml
    .split(/<br\s*\/?>/gi)
    .map((line) => stripHtml(line))
    .filter(Boolean)
  if (lines.length === 0) return { chair_title: null, company: null }
  if (lines.length === 1) return { chair_title: null, company: lines[0] }
  return {
    chair_title: lines.slice(0, -1).join(' · '),
    company: lines[lines.length - 1],
  }
}

function normalizeUrl(url) {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('mailto:')) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function parseWebsite(block) {
  const match = block.match(/class="uabb-team-name-text"[^>]*>\s*<a[^>]*href="([^"]+)"/i)
  return normalizeUrl(match?.[1])
}

function parseLinkedIn(block) {
  const social = block.match(/class="uabb-team-social[\s\S]*?<\/div>/i)?.[0]
  if (!social) return null
  const match = social.match(/href="([^"]*linkedin\.com[^"]*)"/i)
  return normalizeUrl(match?.[1])
}

function leadershipPhotoKey(id, ext) {
  return `leadership/${id}.${ext}`
}

function extFromUrl(url) {
  const match = /\.(png|jpe?g|webp|gif)(?:\?|$)/i.exec(url)
  if (!match) return 'jpg'
  const ext = match[1].toLowerCase()
  return ext === 'jpeg' ? 'jpg' : ext
}

function contentTypeForExt(ext) {
  return (
    {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
    }[ext] ?? 'application/octet-stream'
  )
}

function sqlEscape(value) {
  return value.replace(/'/g, "''")
}

function run(command, options = {}) {
  execSync(command, {
    cwd: ROOT,
    stdio: 'inherit',
    ...options,
  })
}

function runWithRetry(command, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      run(command)
      return
    } catch (error) {
      if (attempt === retries) throw error
      process.stdout.write(`Retrying command (${attempt}/${retries})\n`)
    }
  }
}

async function downloadFile(url, dest, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await get(url, true)
      fs.writeFileSync(dest, data)
      return
    } catch (error) {
      if (attempt === retries) throw error
      process.stdout.write(`Retrying download (${attempt}/${retries}): ${url}\n`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

function parseLeadership(html) {
  const mainStart = html.indexOf('id="fl-main-content"')
  const mainEnd = html.indexOf('NUCA of Las Vegas Committee Chairs', mainStart)
  const main =
    mainStart === -1
      ? html
      : mainEnd === -1
        ? html.slice(mainStart)
        : html.slice(mainStart, mainEnd)

  const blocks = main.split('uabb-team-member-wrap').slice(1)
  const leaders = []

  for (const block of blocks) {
    const photoMatch = block.match(/class="uabb-photo-img[^"]*"[^>]*src="([^"]+)"/i)
    const nameMatch = block.match(/class="uabb-team-name-text"[^>]*>(?:<a[^>]*>)?([^<]+)/i)
    const roleMatch = block.match(/class="uabb-team-desgn-text">([\s\S]*?)<\/span>/i)
    const descMatch = block.match(/class="uabb-team-desc-text">([\s\S]*?)<\/span>/i)

    if (!nameMatch || !roleMatch) continue

    const name = stripHtml(nameMatch[1])
    const role_title = buildRoleTitle(roleMatch[1])
    const { chair_title, company } = parseDescription(descMatch?.[1] ?? '')
    const website = parseWebsite(block)
    const linkedin_url = parseLinkedIn(block)
    const photoUrl = photoMatch?.[1]?.replace(/\\\//g, '/') ?? null
    const id = crypto.randomUUID()
    const photoExt = photoUrl ? extFromUrl(photoUrl) : null
    const photo_r2_key = photoUrl ? leadershipPhotoKey(id, photoExt) : null

    leaders.push({
      id,
      name,
      role_title,
      chair_title,
      company,
      website,
      linkedin_url,
      sort_order: leaders.length,
      photoUrl,
      photo_r2_key,
      photoExt,
    })
  }

  return leaders
}

async function scrapeLeadership() {
  const html = await get(LEADERSHIP_URL)
  const leaders = parseLeadership(html)
  if (leaders.length === 0) {
    throw new Error('No leadership entries found — page structure may have changed.')
  }
  for (const person of leaders) {
    process.stdout.write(
      `Scraped: ${person.name} (${person.role_title}${person.company ? ` @ ${person.company}` : ''})\n`,
    )
  }
  return leaders
}

function buildSql(leaders) {
  const lines = ['DELETE FROM leadership;']

  for (const person of leaders) {
    const values = [
      `'${sqlEscape(person.id)}'`,
      `'${sqlEscape(person.name)}'`,
      `'${sqlEscape(person.role_title)}'`,
      person.chair_title ? `'${sqlEscape(person.chair_title)}'` : 'NULL',
      person.company ? `'${sqlEscape(person.company)}'` : 'NULL',
      person.website ? `'${sqlEscape(person.website)}'` : 'NULL',
      person.linkedin_url ? `'${sqlEscape(person.linkedin_url)}'` : 'NULL',
      'NULL',
      String(person.sort_order),
      person.photo_r2_key ? `'${sqlEscape(person.photo_r2_key)}'` : 'NULL',
      '1',
    ]
    lines.push(
      `INSERT INTO leadership (id, name, role_title, chair_title, company, website, linkedin_url, bio, sort_order, photo_r2_key, published) VALUES (${values.join(', ')});`,
    )
  }

  return `${lines.join('\n')}\n`
}

async function uploadPhotos(leaders, target) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuca-leadership-photos-'))
  const remoteFlag = target === 'remote' ? '--remote' : '--local'

  try {
    for (const person of leaders) {
      if (!person.photoUrl || !person.photo_r2_key) continue
      const filePath = path.join(tempDir, `${person.id}.${person.photoExt}`)
      await downloadFile(person.photoUrl, filePath)
      const contentType = contentTypeForExt(person.photoExt)
      runWithRetry(
        `npx wrangler r2 object put ${R2_BUCKET}/${person.photo_r2_key} --file="${filePath}" --content-type="${contentType}" ${remoteFlag}`,
      )
      process.stdout.write(`Uploaded photo (${target}): ${person.name}\n`)
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function importSql(target, sqlPath) {
  const remoteFlag = target === 'remote' ? '--remote' : '--local'
  run(`npx wrangler d1 execute ${D1_DATABASE} ${remoteFlag} --file="${sqlPath}"`)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const targets = process.argv.includes('--remote-only')
    ? ['remote']
    : process.argv.includes('--local-only')
      ? ['local']
      : ['local', 'remote']

  if (!dryRun) {
    console.log('Applying migrations...')
    for (const target of targets) {
      const remoteFlag = target === 'remote' ? '--remote' : '--local'
      run(`npx wrangler d1 migrations apply ${D1_DATABASE} ${remoteFlag}`)
    }
  }

  console.log(`Scraping leadership from ${LEADERSHIP_URL}...`)
  const leaders = await scrapeLeadership()
  if (dryRun) {
    console.log(`Dry run: found ${leaders.length} leaders.`)
    return
  }
  const sql = buildSql(leaders)
  const sqlPath = path.join(ROOT, 'scripts', '.import-leadership.sql')
  fs.writeFileSync(sqlPath, sql, 'utf8')

  for (const target of targets) {
    console.log(`Importing ${leaders.length} leaders into ${target} D1...`)
    importSql(target, sqlPath)
    console.log(`Uploading photos to ${target} R2...`)
    await uploadPhotos(leaders, target)
  }

  fs.unlinkSync(sqlPath)
  console.log(`Done. Imported ${leaders.length} leaders to ${targets.join(' and ')}.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
