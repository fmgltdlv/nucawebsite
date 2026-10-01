const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5
const MAX_FORM_ATTEMPTS = 8
const RETENTION_MS = 24 * 60 * 60 * 1000

function windowStartIso(): string {
  return new Date(Date.now() - WINDOW_MS).toISOString()
}

function retentionCutoffIso(): string {
  return new Date(Date.now() - RETENTION_MS).toISOString()
}

export async function isLoginRateLimited(db: D1Database, ip: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as c FROM login_attempts
       WHERE ip = ? AND success = 0 AND attempted_at > ?`,
    )
    .bind(ip, windowStartIso())
    .first<{ c: number }>()
  return (row?.c ?? 0) >= MAX_FAILED_ATTEMPTS
}

export async function recordLoginAttempt(
  db: D1Database,
  ip: string,
  success: boolean,
): Promise<void> {
  await db
    .prepare(`INSERT INTO login_attempts (ip, success) VALUES (?, ?)`)
    .bind(ip, success ? 1 : 0)
    .run()

  await db
    .prepare(`DELETE FROM login_attempts WHERE attempted_at < ?`)
    .bind(retentionCutoffIso())
    .run()
}

export async function isFormRateLimited(db: D1Database, ip: string, action: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as c FROM form_attempts
       WHERE ip = ? AND action = ? AND attempted_at > ?`,
    )
    .bind(ip, action, windowStartIso())
    .first<{ c: number }>()
  return (row?.c ?? 0) >= MAX_FORM_ATTEMPTS
}

export async function recordFormAttempt(db: D1Database, ip: string, action: string): Promise<void> {
  await db
    .prepare(`INSERT INTO form_attempts (ip, action) VALUES (?, ?)`)
    .bind(ip, action)
    .run()

  await db
    .prepare(`DELETE FROM form_attempts WHERE attempted_at < ?`)
    .bind(retentionCutoffIso())
    .run()
}

/** Prefer Cloudflare's connecting IP; ignore spoofable XFF when the request hit CF. */
export function clientIp(headers: { get(name: string): string | null | undefined }): string {
  const cf = headers.get('CF-Connecting-IP')?.trim()
  if (cf) return cf
  if (headers.get('CF-RAY')) return 'unknown'
  return headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown'
}
