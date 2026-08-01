import type { Env } from '../../env'

type TurnstileResponse = {
  success: boolean
  'error-codes'?: string[]
}

export async function verifyTurnstile(
  env: Env,
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) return true
  if (!token?.trim()) return false

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
