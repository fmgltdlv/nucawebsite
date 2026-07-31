import type { Member, MemberContact } from '../data/demo'
import type { MemberType } from '../data/demo'
import { parsePointsOfContactJson, serializePointsOfContact } from './member-contacts'
import { memberLogoUrl } from './member-logos'

export type AdminMember = Member & {
  active: boolean
  logo_r2_key?: string
}

type MemberRow = {
  id: string
  company_name: string
  member_type: MemberType
  description: string | null
  website: string | null
  phone: string | null
  email: string | null
  logo_r2_key: string | null
  points_of_contact_json: string | null
}

function mapMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    company: row.company_name,
    type: row.member_type,
    description: row.description ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    logoUrl: memberLogoUrl(row.logo_r2_key),
    contacts: parsePointsOfContactJson(row.points_of_contact_json),
  }
}

export async function getMemberById(db: D1Database, id: string): Promise<Member | null> {
  const row = await db
    .prepare(
      `SELECT id, company_name, member_type, description, website, phone, email, logo_r2_key,
              points_of_contact_json
       FROM members WHERE id = ? AND active = 1`,
    )
    .bind(id)
    .first<MemberRow>()
  if (!row) return null
  return mapMemberRow(row)
}

export async function getMemberLogoR2Key(db: D1Database, id: string): Promise<string | null> {
  const row = await db
    .prepare(`SELECT logo_r2_key FROM members WHERE id = ?`)
    .bind(id)
    .first<{ logo_r2_key: string | null }>()
  return row?.logo_r2_key ?? null
}

export async function listMembersForAdmin(db: D1Database): Promise<AdminMember[]> {
  const { results } = await db
    .prepare(
      `SELECT id, company_name, member_type, description, website, phone, email, active, logo_r2_key,
              points_of_contact_json
       FROM members ORDER BY company_name ASC`,
    )
    .all<MemberRow & { active: number }>()

  return (results ?? []).map((r) => ({
    ...mapMemberRow(r),
    active: r.active === 1,
    logo_r2_key: r.logo_r2_key ?? undefined,
  }))
}

export async function createMember(
  db: D1Database,
  data: {
    company_name: string
    member_type: MemberType
    description?: string
    website?: string
    phone?: string
    email?: string
    contacts?: MemberContact[]
    active?: boolean
    logo_r2_key?: string
  },
): Promise<string> {
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO members (id, company_name, member_type, description, website, phone, email,
                            points_of_contact_json, active, logo_r2_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.company_name,
      data.member_type,
      data.description ?? null,
      data.website ?? null,
      data.phone ?? null,
      data.email ?? null,
      serializePointsOfContact(data.contacts ?? []),
      data.active ? 1 : 0,
      data.logo_r2_key ?? null,
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
    description?: string
    website?: string
    phone?: string
    email?: string
    contacts?: MemberContact[]
    active: boolean
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE members
       SET company_name = ?, member_type = ?, description = ?, website = ?, phone = ?, email = ?,
           points_of_contact_json = ?, active = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      data.company_name,
      data.member_type,
      data.description ?? null,
      data.website ?? null,
      data.phone ?? null,
      data.email ?? null,
      serializePointsOfContact(data.contacts ?? []),
      data.active ? 1 : 0,
      id,
    )
    .run()
}

export async function updateMemberLogoKey(
  db: D1Database,
  id: string,
  logo_r2_key: string | null,
): Promise<void> {
  await db
    .prepare(`UPDATE members SET logo_r2_key = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(logo_r2_key, id)
    .run()
}

export async function updateMemberProfile(
  db: D1Database,
  id: string,
  data: { website?: string; phone?: string; email?: string; contacts?: MemberContact[] },
): Promise<void> {
  await db
    .prepare(
      `UPDATE members
       SET website = ?, phone = ?, email = ?, points_of_contact_json = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      data.website ?? null,
      data.phone ?? null,
      data.email ?? null,
      serializePointsOfContact(data.contacts ?? []),
      id,
    )
    .run()
}
