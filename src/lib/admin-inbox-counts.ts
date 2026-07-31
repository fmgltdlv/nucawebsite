export type AdminInboxCounts = {
  applications: number
  contactMessages: number
  newsletter: number
}

export function totalInboxCount(counts: AdminInboxCounts): number {
  return counts.applications + counts.contactMessages + counts.newsletter
}

export async function getAdminInboxCounts(db: D1Database): Promise<AdminInboxCounts> {
  const row = await db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM applications WHERE status = 'new') AS applications,
        (SELECT COUNT(*) FROM contact_submissions WHERE status = 'new') AS contact_messages,
        (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'new') AS newsletter`,
    )
    .first<{ applications: number; contact_messages: number; newsletter: number }>()

  return {
    applications: row?.applications ?? 0,
    contactMessages: row?.contact_messages ?? 0,
    newsletter: row?.newsletter ?? 0,
  }
}
