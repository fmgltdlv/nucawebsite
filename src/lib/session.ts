import { sign, verify } from 'hono/jwt'
import type { Env } from '../env'

const COOKIE_NAME = 'nuca_admin_session'
const MAX_AGE_SEC = 60 * 60 * 24

export type SessionPayload = {
  sub: string
  role: 'admin'
  sv: number
  csrf: string
  exp: number
}

export async function createSessionToken(
  userId: string,
  env: Env,
  opts: { sessionVersion: number; csrf: string },
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  return await sign(
    {
      sub: userId,
      role: 'admin',
      sv: opts.sessionVersion,
      csrf: opts.csrf,
      exp,
    },
    env.JWT_SECRET,
    'HS256',
  )
}

export async function verifySessionToken(
  token: string | undefined,
  env: Env,
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const payload = await verify(token, env.JWT_SECRET, 'HS256')
    if (typeof payload.sub !== 'string' || payload.role !== 'admin') return null
    if (typeof payload.csrf !== 'string' || typeof payload.sv !== 'number') return null
    return {
      sub: payload.sub,
      role: 'admin',
      sv: payload.sv,
      csrf: payload.csrf,
      exp: Number(payload.exp),
    }
  } catch {
    return null
  }
}

function cookieFlags(secure: boolean): string {
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function sessionCookieHeader(token: string, secure: boolean): string {
  return `${COOKIE_NAME}=${token}; ${cookieFlags(secure)}; Max-Age=${MAX_AGE_SEC}`
}

export function clearSessionCookieHeader(secure: boolean): string {
  return `${COOKIE_NAME}=; ${cookieFlags(secure)}; Max-Age=0`
}

export function readSessionCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match?.[1]
}

export function isSecureRequest(url: URL): boolean {
  return url.protocol === 'https:'
}
