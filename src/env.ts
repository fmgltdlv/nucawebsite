export type Env = {
  DB: D1Database
  R2: R2Bucket
  ASSETS: Fetcher
  EMAIL?: SendEmail
  JWT_SECRET: string
  ADMIN_PASSWORD: string
  ADMIN_EMAIL?: string
  /** Cloudflare Turnstile secret key (optional bot protection on login). */
  TURNSTILE_SECRET_KEY?: string
  /** Cloudflare Turnstile site key (public; shown on login form). */
  TURNSTILE_SITE_KEY?: string
}