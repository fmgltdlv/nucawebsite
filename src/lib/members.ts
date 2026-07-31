import type { Member, MemberContact, MemberSummary, MemberType } from '../data/demo'
import { memberTypeLabel } from '../data/demo'
import { parsePointsOfContactJson, visibleMemberContacts } from './member-contacts'
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

export async function getActiveMemberPublicProfile(
  db: D1Database,
  id: string,
): Promise<MemberPublicProfile | null> {
  const member = await getMemberById(db, id)
  if (!member) return null

  return {
    id: member.id,
    company: member.company,
    typeLabel: memberTypeLabel[member.type],
    description: member.description ?? null,
    website: member.website ?? null,
    phone: member.phone ?? null,
    logoUrl: member.logoUrl ?? null,
    contacts: visibleMemberContacts(member.contacts ?? []),
  }
}

export async function listActiveMembers(db: D1Database): Promise<Member[]> {
  const { results } = await db
    .prepare(
      `SELECT id, company_name, member_type, description, website, phone, email, logo_r2_key,
              points_of_contact_json
       FROM members WHERE active = 1 ORDER BY company_name ASC`,
    )
    .all<{
      id: string
      company_name: string
      member_type: MemberType
      description: string | null
      website: string | null
      phone: string | null
      email: string | null
      logo_r2_key: string | null
      points_of_contact_json: string | null
    }>()

  return (results ?? []).map((r) => ({
    id: r.id,
    company: r.company_name,
    type: r.member_type,
    description: r.description ?? undefined,
    website: r.website ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    logoUrl: memberLogoUrl(r.logo_r2_key),
    contacts: visibleMemberContacts(parsePointsOfContactJson(r.points_of_contact_json)),
  }))
}
