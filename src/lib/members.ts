import type { Member, MemberContact, MemberSummary, MemberType } from '../data/demo'
import { memberTypeLabel } from '../data/demo'
import { getMemberById } from './members-db'
import { memberLogoUrl } from './member-logos'

export type MemberPublicProfile = {
  id: string
  company: string
  typeLabel: string
  description: string | null
  website: string | null
  phone: string | null
  logoUrl: string | null
  contacts: MemberContact[]
}

async function listMemberContactsByCompany(db: D1Database): Promise<Map<string, MemberContact[]>> {
  const { results } = await db
    .prepare(
      `SELECT member_id, display_name, email
       FROM users
       WHERE role = 'member'
         AND member_link_status = 'approved'
         AND member_id IS NOT NULL
       ORDER BY COALESCE(display_name, email), email`,
    )
    .all<{ member_id: string; display_name: string | null; email: string }>()

  const contactsByMember = new Map<string, MemberContact[]>()
  for (const row of results ?? []) {
    const contacts = contactsByMember.get(row.member_id) ?? []
    contacts.push({
      name: row.display_name?.trim() || row.email,
      email: row.email,
    })
    contactsByMember.set(row.member_id, contacts)
  }
  return contactsByMember
}

export async function listActiveMemberSummaries(db: D1Database): Promise<MemberSummary[]> {
  const { results } = await db
    .prepare(
      `SELECT id, company_name, member_type, logo_r2_key
       FROM members WHERE active = 1 ORDER BY company_name ASC`,
    )
    .all<{
      id: string
      company_name: string
      member_type: MemberType
      logo_r2_key: string | null
    }>()

  return (results ?? []).map((r) => ({
    id: r.id,
    company: r.company_name,
    type: r.member_type,
    logoUrl: memberLogoUrl(r.logo_r2_key),
  }))
}

async function listMemberContactsForMember(db: D1Database, memberId: string): Promise<MemberContact[]> {
  const { results } = await db
    .prepare(
      `SELECT display_name, email
       FROM users
       WHERE role = 'member'
         AND member_link_status = 'approved'
         AND member_id = ?
       ORDER BY COALESCE(display_name, email), email`,
    )
    .bind(memberId)
    .all<{ display_name: string | null; email: string }>()

  return (results ?? []).map((row) => ({
    name: row.display_name?.trim() || row.email,
    email: row.email,
  }))
}

export async function getActiveMemberPublicProfile(
  db: D1Database,
  id: string,
): Promise<MemberPublicProfile | null> {
  const member = await getMemberById(db, id)
  if (!member) return null

  const contacts = await listMemberContactsForMember(db, id)

  return {
    id: member.id,
    company: member.company,
    typeLabel: memberTypeLabel[member.type],
    description: member.description ?? null,
    website: member.website ?? null,
    phone: member.phone ?? null,
    logoUrl: member.logoUrl ?? null,
    contacts,
  }
}

export async function listActiveMembers(db: D1Database): Promise<Member[]> {
  const contactsByMember = await listMemberContactsByCompany(db)
  const { results } = await db
    .prepare(
      `SELECT id, company_name, member_type, description, website, phone, logo_r2_key
       FROM members WHERE active = 1 ORDER BY company_name ASC`,
    )
    .all<{
      id: string
      company_name: string
      member_type: MemberType
      description: string | null
      website: string | null
      phone: string | null
      logo_r2_key: string | null
    }>()

  return (results ?? []).map((r) => ({
    id: r.id,
    company: r.company_name,
    type: r.member_type,
    description: r.description ?? undefined,
    website: r.website ?? undefined,
    phone: r.phone ?? undefined,
    logoUrl: memberLogoUrl(r.logo_r2_key),
    contacts: contactsByMember.get(r.id) ?? [],
  }))
}
