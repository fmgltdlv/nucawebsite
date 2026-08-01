import type { Context } from 'hono'

export function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const left = enc.encode(a)
  const right = enc.encode(b)
  if (left.length !== right.length) return false
  return crypto.subtle.timingSafeEqual(left, right)
}

export async function verifyCsrfRequest(c: Context, expected: string): Promise<boolean> {
  const header = c.req.header('X-CSRF-Token')
  if (header && timingSafeEqualStrings(header, expected)) return true

  const contentType = c.req.header('Content-Type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const json = (await c.req.raw.clone().json()) as { _csrf?: string }
      return typeof json._csrf === 'string' && timingSafeEqualStrings(json._csrf, expected)
    } catch {
      return false
    }
  }

  if (contentType.includes('form')) {
    try {
      const form = await c.req.raw.clone().formData()
      const token = form.get('_csrf')
      return typeof token === 'string' && timingSafeEqualStrings(token, expected)
    } catch {
      return false
    }
  }

  return false
}
