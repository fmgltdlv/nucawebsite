import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import https from 'node:https'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WP_API = 'https://nucalasvegas.com/wp-json/wp/v2/member?per_page=100'
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

function decodeHtmlEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripHtml(html) {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function parseMemberType(html) {
  const match = html.match(/uabb-infobox-title-prefix[^>]*>([^<]+)</i)
  const label = match?.[1]?.toUpperCase() ?? ''
  if (label.includes('ASSOCIATE')) return 'associate'
  if (label.includes('INSTITUTIONAL')) return 'institutional'
  return 'contractor'
}

function parseDescription(html) {
  const blockMatch = html.match(
    /class="uabb-infobox-text[\s\S]*?(?=<a[^>]*uabb-infobox-cta-link|<\/div>\s*<\/div>\s*<\/div>)/i,
  )
  if (!blockMatch) return ''
  const phoneIdx = blockMatch[0].indexOf('Phone:')
  if (phoneIdx === -1) return ''
  const beforePhone = blockMatch[0].replace(/^[\s\S]*?uabb-infobox-text[^>]*>/i, '')
  return stripHtml(beforePhone.slice(0, phoneIdx))
}

function parsePhone(html) {
  const match = html.match(/Phone:\s*([^<]+)/i)
  return match ? match[1].trim() : ''
}

function parseWebsite(html) {
  const match = html.match(/uabb-infobox-cta-link[\s\S]*?href="(https?:\/\/[^"]+)"/i)
  if (!match) return ''
  const url = match[1].trim()
  return url.includes('nucalasvegas.com') ? '' : url
}

function parseLogoUrl(html) {
  const imageMatch = html.match(/class="uabb-photo-img[^"]*"[^>]*src="([^"]+)"/i)
  if (imageMatch) return imageMatch[1].replace(/\\\//g, '/')
  const schemaMatch = html.match(/"thumbnailUrl":"(https:[^"]+)"/i)
  return schemaMatch ? schemaMatch[1].replace(/\\\//g, '/') : ''
}

function extFromUrl(url) {
  const match = /\.(png|jpe?g|webp|svg)(?:\?|$)/i.exec(url)
  if (!match) return 'png'
  const ext = match[1].toLowerCase()
  return ext === 'jpeg' ? 'jpg' : ext
}

function contentTypeForExt(ext) {
  return (
    {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
      svg: 'image/svg+xml',
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

async function downloadFile(url, dest, attempt = 1) {
  try {
    const data = await get(url, true)
    fs.writeFileSync(dest, data)
  } catch (error) {
    if (attempt >= 4) throw error
    await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    return downloadFile(url, dest, attempt + 1)
  }
}

const CACHE_PATH = path.join(ROOT, 'scripts', '.wp-members-cache.json')

async function scrapeMembers() {
  if (process.argv.includes('--use-cache') && fs.existsSync(CACHE_PATH)) {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
  }

  const list = JSON.parse(await get(WP_API))
  const members = []

  for (const item of list) {
    const html = await get(item.link)
    const id = crypto.randomUUID()
    const company = stripHtml(item.title.rendered)
    const description = parseDescription(html)
    const phone = parsePhone(html)
    const website = parseWebsite(html)
    const member_type = parseMemberType(html)
    const logoUrl = parseLogoUrl(html)
    const logoExt = logoUrl ? extFromUrl(logoUrl) : null
    const logo_r2_key = logoUrl ? `members/${id}/logo.${logoExt}` : null

    members.push({
      id,
      company_name: company,
      member_type,
      description,
      website,
      phone,
      logoUrl,
      logo_r2_key,
      logoExt,
    })

    process.stdout.write(`Scraped ${members.length}/${list.length}: ${company}\n`)
    await new Promise((resolve) => setTimeout(resolve, 60))
  }

  members.sort((a, b) => a.company_name.localeCompare(b.company_name, undefined, { sensitivity: 'base' }))
  fs.writeFileSync(CACHE_PATH, JSON.stringify(members, null, 2))
  return members
}

function buildSql(members) {
  const lines = [
    'PRAGMA foreign_keys = OFF;',
    'UPDATE users SET member_id = NULL, pending_member_id = NULL, member_link_status = CASE WHEN member_link_status = \'approved\' THEN \'none\' ELSE member_link_status END WHERE member_id IS NOT NULL OR pending_member_id IS NOT NULL;',
    'DELETE FROM members;',
  ]

  for (const member of members) {
    const values = [
      `'${sqlEscape(member.id)}'`,
      `'${sqlEscape(member.company_name)}'`,
      `'${sqlEscape(member.member_type)}'`,
      member.description ? `'${sqlEscape(member.description)}'` : 'NULL',
      member.website ? `'${sqlEscape(member.website)}'` : 'NULL',
      member.phone ? `'${sqlEscape(member.phone)}'` : 'NULL',
      'NULL',
      '1',
      member.logo_r2_key ? `'${sqlEscape(member.logo_r2_key)}'` : 'NULL',
    ]
    lines.push(
      `INSERT INTO members (id, company_name, member_type, description, website, phone, email, active, logo_r2_key) VALUES (${values.join(', ')});`,
    )
  }

  lines.push('PRAGMA foreign_keys = ON;')
  return `${lines.join('\n')}\n`
}

async function uploadLogos(members, target) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nuca-member-logos-'))
  const remoteFlag = target === 'remote' ? '--remote' : '--local'

  try {
    for (const member of members) {
      if (!member.logoUrl || !member.logo_r2_key) continue
      const filePath = path.join(tempDir, `${member.id}.${member.logoExt}`)
      await downloadFile(member.logoUrl, filePath)
      const contentType = contentTypeForExt(member.logoExt)
      run(
        `npx wrangler r2 object put ${R2_BUCKET}/${member.logo_r2_key} --file="${filePath}" --content-type="${contentType}" ${remoteFlag}`,
      )
      process.stdout.write(`Uploaded logo (${target}): ${member.company_name}\n`)
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
  const skipMigrations = process.argv.includes('--skip-migrations')
  const skipSql = process.argv.includes('--skip-sql')
  const targets = process.argv.includes('--remote-only')
    ? ['remote']
    : process.argv.includes('--local-only')
      ? ['local']
      : ['local', 'remote']

  if (!skipMigrations) {
    console.log('Applying migrations...')
    for (const target of targets) {
      const remoteFlag = target === 'remote' ? '--remote' : '--local'
      run(`npx wrangler d1 migrations apply ${D1_DATABASE} ${remoteFlag}`)
    }
  }

  console.log('Scraping members from nucalasvegas.com...')
  const members = await scrapeMembers()
  const sqlPath = path.join(ROOT, 'scripts', '.import-members.sql')

  if (!skipSql) {
    const sql = buildSql(members)
    fs.writeFileSync(sqlPath, sql, 'utf8')
    for (const target of targets) {
      console.log(`Importing ${members.length} members into ${target} D1...`)
      importSql(target, sqlPath)
    }
    if (fs.existsSync(sqlPath)) fs.unlinkSync(sqlPath)
  }

  for (const target of targets) {
    console.log(`Uploading logos to ${target} R2...`)
    await uploadLogos(members, target)
  }

  console.log(`Done. Imported ${members.length} members to ${targets.join(' and ')}.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
