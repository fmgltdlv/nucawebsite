import type { Env } from '../../env'
import { isFormRateLimited, recordFormAttempt } from './rate-limit'
import { verifyTurnstile } from './turnstile'

export const PUBLIC_NAME_MAX = 200
export const PUBLIC_EMAIL_MAX = 254
export const PUBLIC_MESSAGE_MAX = 5000
export const PUBLIC_COMPANY_MAX = 200

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function stripHeaderChars(value: string): string {
  return value.replace(/[\r\n\0]/g, '')
}

export function clampField(value: string, max: number): string {
  return value.trim().slice(0, max)
}

export function isValidPublicEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return normalized.length > 0 && normalized.length <= PUBLIC_EMAIL_MAX && EMAIL_PATTERN.test(normalized)
}

export type PublicFormGuardResult = 'ok' | 'rate' | 'turnstile'

export async function enforcePublicFormGuard(
  env: Env,
  ip: string,
  action: string,
  turnstileToken: string | undefined,
): Promise<PublicFormGuardResult> {
  if (await isFormRateLimited(env.DB, ip, action)) return 'rate'
  await recordFormAttempt(env.DB, ip, action)
  if (!(await verifyTurnstile(env, turnstileToken, ip))) return 'turnstile'
  return 'ok'
}

export function turnstileTokenFromBody(body: Record<string, File | string | File[]>): string | undefined {
  const token = body['cf-turnstile-response']
  return typeof token === 'string' ? token : undefined
}
