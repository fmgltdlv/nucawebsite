import type { Env } from '../../env'

type TurnstileResponse = {
  success: boolean
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

export async function verifyTurnstile(
  env: Env,
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  const mode = turnstileMode(env)
  if (mode === 'off') return true
  if (mode === 'misconfigured') return false
  if (!token?.trim()) return false

  const secret = env.TURNSTILE_SECRET_KEY!.trim()
  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  })
  if (remoteIp) body.set('remoteip', remoteIp)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) return false
  const data = (await response.json()) as TurnstileResponse
  return data.success === true
}
