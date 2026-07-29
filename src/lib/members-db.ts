import type { Member } from '../data/demo'
import type { MemberType } from '../data/demo'

export async function getMemberById(db: D1Database, id: string): Promise<Member | null> {
  const row = await db
    .prepare(
      `SELECT id, company_name, member_type, website, phone, email FROM members WHERE id = ? AND active = 1`,
    )
    .bind(id)
    .first<{
      id: string
      company_name: string
      member_type: MemberType
      website: string | null
      phone: string | null
      email: string | null
    }>()
  if (!row) return null
  return {
    id: row.id,
    company: row.company_name,
    type: row.member_type,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
  }
}

export async function updateMemberProfile(
  db: D1Database,
  id: string,
  data: { website?: string; phone?: string; email?: string },
): Promise<void> {
  await db
    .prepare(
      `UPDATE members SET website = ?, phone = ?, email = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(data.website ?? null, data.phone ?? null, data.email ?? null, id)
    .run()
}
