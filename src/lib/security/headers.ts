import type { Context } from 'hono'

export function applySecurityHeaders(_c: Context, headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}
