import { toCsv } from './csv'

export type NewsletterSubscriber = {
  id: string
  email: string
  subscribed_at: string
  source: string | null
  status: string
}

export async function subscribeNewsletter(
  db: D1Database,
  email: string,
  source?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  try {
    await db
      .prepare(
        `INSERT INTO newsletter_subscribers (id, email, source, status) VALUES (?, ?, ?, 'new')`,
      )
      .bind(crypto.randomUUID(), normalized, source ?? 'contact')
      .run()
    return { ok: true }
  } catch {
    return { ok: false, error: 'That email is already subscribed.' }
  }
}

export async function listNewsletterSubscribers(
  db: D1Database,
  options?: { limit?: number },
): Promise<NewsletterSubscriber[]> {
  const limit = options?.limit ?? 500
  const { results } = await db
    .prepare(
      `SELECT id, email, subscribed_at, source, status
       FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<NewsletterSubscriber>()
  return results ?? []
}

export async function listAllNewsletterSubscribers(db: D1Database): Promise<NewsletterSubscriber[]> {
  const { results } = await db
    .prepare(
      `SELECT id, email, subscribed_at, source, status
       FROM newsletter_subscribers ORDER BY subscribed_at DESC`,
    )
    .all<NewsletterSubscriber>()
  return results ?? []
}

export function buildNewsletterSubscribersCsv(subscribers: NewsletterSubscriber[]): string {
  const rows: string[][] = [
    ['email', 'subscribed_at', 'source', 'status'],
    ...subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.subscribed_at,
      subscriber.source ?? '',
      subscriber.status,
    ]),
  ]
  return '\uFEFF' + toCsv(rows)
}

export function newsletterSubscribersExportFilename(date = new Date()): string {
  return `newsletter-subscribers-${date.toISOString().slice(0, 10)}.csv`
}

export async function updateNewsletterSubscriberStatus(
  db: D1Database,
  id: string,
  status: string,
): Promise<void> {
  await db.prepare('UPDATE newsletter_subscribers SET status = ? WHERE id = ?').bind(status, id).run()
}

export async function deleteNewsletterSubscriber(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').bind(id).run()
}

export async function acknowledgeAllNewsletterSubscribers(db: D1Database): Promise<void> {
  await db
    .prepare(`UPDATE newsletter_subscribers SET status = 'acknowledged' WHERE status = 'new'`)
    .run()
}
