export type AuditLogEntry = {
  userId?: string | null
  action: string
  resource?: string | null
  resourceId?: string | null
  ip?: string | null
  details?: string | null
}

export async function writeAuditLog(db: D1Database, entry: AuditLogEntry): Promise<void> {
  await db
    .prepare(
      `INSERT INTO admin_audit_log (user_id, action, resource, resource_id, ip, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      entry.userId ?? null,
      entry.action,
      entry.resource ?? null,
      entry.resourceId ?? null,
      entry.ip ?? null,
      entry.details ?? null,
    )
    .run()
}
