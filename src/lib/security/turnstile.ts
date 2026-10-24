import type { Env } from '../../env'

type TurnstileResponse = {
  success: boolean
  action?: string
  hostname?: string
  'error-codes'?: string[]
}

export type TurnstileMode = 'off' | 'on' | 'misconfigured'

export function turnstileMode(env: Env): TurnstileMode {
  const site = env.TURNSTILE_SITE_KEY?.trim() ?? ''
  const secret = env.TURNSTILE_SECRET_KEY?.trim() ?? ''
  if (!site && !secret) return 'off'
  if (site && secret) return 'on'
  return 'misconfigured'
}

function expectedHostnames(env: Env): Set<string> {
  return new Set(
    (env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  )
}

export async function verifyTurnstile(
  env: Env,
  token: string | undefined,
  expectedAction: string,
  remoteIp?: string,
): Promise<boolean> {
  const mode = turnstileMode(env)
  if (mode === 'off') return true
  if (mode === 'misconfigured') return false

  const hostnames = expectedHostnames(env)
  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > 2048 ||
    hostnames.size === 0
  ) {
    return false
  }

  const secret = env.TURNSTILE_SECRET_KEY!.trim()
  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  })
  if (remoteIp) body.set('remoteip', remoteIp)

  let result: TurnstileResponse
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body,
    })
    if (!response.ok) return false
    result = (await response.json()) as TurnstileResponse
  } catch {
    return false
  }

  return result.success === true && result.action === expectedAction && hostnames.has(result.hostname ?? '')
}
