import type { Env } from '../../env'

const WEAK_JWT_SECRETS = new Set([
  'local-jwt-secret-change-in-production',
  'change-me',
  'secret',
])

let checked = false

/** Warn once per isolate when production-like secrets look weak. */
export function assertSafeSecrets(env: Env, isProduction: boolean): void {
  if (checked || !isProduction) return
  checked = true

  const secret = env.JWT_SECRET?.trim() ?? ''
  if (!secret || secret.length < 32 || WEAK_JWT_SECRETS.has(secret)) {
    console.error(
      'JWT_SECRET is missing, too short, or uses a known dev default. Set a strong random secret via wrangler secret put JWT_SECRET.',
    )
  }
}

export function isProductionRequest(url: URL): boolean {
  return url.protocol === 'https:' && !url.hostname.includes('localhost')
}
