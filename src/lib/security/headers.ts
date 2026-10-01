import type { Context } from 'hono'

const PAGE_CSP = [
  "default-src 'self'",
  "script-src 'self' https://unpkg.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://unpkg.com https://*.tile.openstreetmap.org",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://www.openstreetmap.org https://challenges.cloudflare.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const ASSET_CSP = "default-src 'none'; sandbox; frame-ancestors 'self'; object-src 'none'"

export function applySecurityHeaders(c: Context, headers: Headers): void {
  const url = new URL(c.req.url)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (url.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  if (url.pathname.startsWith('/assets/')) {
    headers.set('Content-Security-Policy', ASSET_CSP)
  } else {
    headers.set('Content-Security-Policy', PAGE_CSP)
  }
}
