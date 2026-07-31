export type ContactSubmission = {
  id: string
  name: string
  email: string
  message: string
  status: string
  submitted_at: string
}

export async function createContactSubmission(
  db: D1Database,
  data: { name: string; email: string; message: string },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO contact_submissions (id, name, email, message, status) VALUES (?, ?, ?, ?, 'new')`,
    )
    .bind(id, data.name, data.email, data.message)
    .run()
  return id
}

export async function listContactSubmissions(db: D1Database): Promise<ContactSubmission[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name, email, message, status, submitted_at
       FROM contact_submissions ORDER BY submitted_at DESC LIMIT 500`,
    )
    .all<ContactSubmission>()
  return results ?? []
}

export async function updateContactSubmissionStatus(
  db: D1Database,
  id: string,
  status: string,
): Promise<void> {
  await db.prepare('UPDATE contact_submissions SET status = ? WHERE id = ?').bind(status, id).run()
}
