import type { Member } from '../data/demo'
import type { MemberType } from '../data/demo'

export type AdminMember = Member & {
  active: boolean
  display_order: number
}

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

export async function listMembersForAdmin(db: D1Database): Promise<AdminMember[]> {
  const { results } = await db
    .prepare(
      `SELECT id, company_name, member_type, website, phone, email, active, display_order
       FROM members ORDER BY display_order ASC, company_name ASC`,
    )
    .all<{
      id: string
      company_name: string
      member_type: MemberType
      website: string | null
      phone: string | null
      email: string | null
      active: number
      display_order: number
    }>()

  return (results ?? []).map((r) => ({
    id: r.id,
    company: r.company_name,
    type: r.member_type,
    website: r.website ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    active: r.active === 1,
    display_order: r.display_order,
  }))
}

export async function createMember(
  db: D1Database,
  data: {
    company_name: string
    member_type: MemberType
    website?: string
    phone?: string
    email?: string
    active?: boolean
    display_order?: number
  },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO members (id, company_name, member_type, website, phone, email, active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.company_name,
      data.member_type,
      data.website ?? null,
      data.phone ?? null,
      data.email ?? null,
      data.active ? 1 : 0,
      data.display_order ?? 0,
    )
    .run()
  return id
}

export async function updateMember(
  db: D1Database,
  id: string,
  data: {
    company_name: string
    member_type: MemberType
    website?: string
    phone?: string
    email?: string
    active: boolean
    display_order: number
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE members
       SET company_name = ?, member_type = ?, website = ?, phone = ?, email = ?,
           active = ?, display_order = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      data.company_name,
      data.member_type,
      data.website ?? null,
      data.phone ?? null,
      data.email ?? null,
      data.active ? 1 : 0,
      data.display_order,
      id,
    )
    .run()
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
