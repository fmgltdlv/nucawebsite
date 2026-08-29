/**
 * Add www.nucalasvegas.com custom domain to nuca-frontdoor Pages project.
 * Usage: node scripts/add-pages-domain.mjs
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ACCOUNT_ID = 'ded6f41ae76367e770374f96348202dc'
const PROJECT = 'nuca-frontdoor'
const DOMAIN = 'www.nucalasvegas.com'

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

const domains = await api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`)
const existing = domains.result?.find((d) => d.name === DOMAIN)
if (existing) {
  console.log('Domain already attached:', existing)
} else {
  const added = await api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: DOMAIN }),
  })
  console.log('Domain added:', added.result)
}

const updated = await api(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`)
const domain = updated.result?.find((d) => d.name === DOMAIN)
console.log('\n--- SiteGround DNS ---')
console.log(`CNAME  www  →  ${project.result.subdomain}`)
console.log(`Domain status: ${domain?.status ?? 'unknown'}`)
if (domain?.verification_data) {
  console.log('Verification:', JSON.stringify(domain.verification_data, null, 2))
}
