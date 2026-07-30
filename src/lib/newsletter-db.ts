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
        `INSERT INTO newsletter_subscribers (id, email, source) VALUES (?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), normalized, source ?? 'contact')
      .run()
    return { ok: true }
  } catch {
    return { ok: false, error: 'That email is already subscribed.' }
  }
}

export async function listNewsletterSubscribers(db: D1Database): Promise<
  { id: string; email: string; subscribed_at: string; source: string | null }[]
> {
  const { results } = await db
    .prepare(
      `SELECT id, email, subscribed_at, source FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 500`,
    )
    .all<{ id: string; email: string; subscribed_at: string; source: string | null }>()
  return results ?? []
}
