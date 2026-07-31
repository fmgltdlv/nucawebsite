export type ApplicationRecord = {
  id: string
  member_type: string | null
  payload_json: string
  status: string
  submitted_at: string
}

export type ApplicationPayload = Record<string, string>

export async function createApplication(
  db: D1Database,
  data: { member_type?: string; payload: ApplicationPayload },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO applications (id, member_type, payload_json, status) VALUES (?, ?, ?, 'new')`,
    )
    .bind(id, data.member_type ?? null, JSON.stringify(data.payload))
    .run()
  return id
}

export async function listApplications(db: D1Database): Promise<ApplicationRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, member_type, payload_json, status, submitted_at
       FROM applications ORDER BY submitted_at DESC LIMIT 200`,
    )
    .all<ApplicationRecord>()
  return results ?? []
}

export async function updateApplicationStatus(
  db: D1Database,
  id: string,
  status: string,
): Promise<void> {
  await db.prepare('UPDATE applications SET status = ? WHERE id = ?').bind(status, id).run()
}

export async function deleteApplication(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM applications WHERE id = ?').bind(id).run()
}

export async function acknowledgeAllApplications(db: D1Database): Promise<void> {
  await db.prepare(`UPDATE applications SET status = 'reviewed' WHERE status = 'new'`).run()
}

export function parseApplicationPayload(json: string): ApplicationPayload {
  try {
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object') return parsed as ApplicationPayload
  } catch {
    /* ignore */
  }
  return {}
}
