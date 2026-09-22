/**
 * Attach custom domains to the nucawebsite Pages front-door project.
 * Usage:
 *   node scripts/add-pages-domain.mjs
 *   node scripts/add-pages-domain.mjs test.nucalasvegas.com www.nucalasvegas.com
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ACCOUNT_ID = 'ded6f41ae76367e770374f96348202dc'
const PROJECT = 'nucawebsite'
const DEFAULT_DOMAINS = ['www.nucalasvegas.com', 'test.nucalasvegas.com']
const DOMAINS = process.argv.slice(2).filter(Boolean)
const targets = DOMAINS.length ? DOMAINS : DEFAULT_DOMAINS

function getOAuthToken() {
  const raw = readFileSync(join(homedir(), '.wrangler', 'config', 'default.toml'), 'utf8')
  const match = raw.match(/oauth_token\s*=\s*"([^"]+)"/)
  if (!match) throw new Error('No oauth_token in wrangler config')
  return match[1]
}

const token = getOAuthToken()

async function api(path, options = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const json = await res.json()
  if (!json.success) {
    throw new Error(JSON.stringify(json.errors ?? json))
  }
  return json
}

const project = await api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}`)
console.log('Project subdomain:', project.result.subdomain)

const domainsRes = await api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`)
const attached = domainsRes.result ?? []

for (const name of targets) {
  const existing = attached.find((d) => d.name === name)
  if (existing) {
    console.log(`Already attached: ${name} (${existing.status})`)
    continue
  }
  const added = await api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  console.log('Domain added:', added.result)
}

const updated = await api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`)
console.log('\n--- SiteGround DNS ---')
console.log(`CNAME  www   →  ${project.result.subdomain}`)
console.log(`CNAME  test  →  ${project.result.subdomain}`)
for (const name of targets) {
  const domain = updated.result?.find((d) => d.name === name)
  console.log(`${name}: ${domain?.status ?? 'missing'}`)
  if (domain?.verification_data) {
    console.log('  Verification:', JSON.stringify(domain.verification_data))
  }
}
