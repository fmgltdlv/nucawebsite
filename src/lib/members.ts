import type { Member, MemberType } from '../data/demo'
import { memberLogoUrl } from './member-logos'

export async function listActiveMembers(db: D1Database): Promise<Member[]> {
  const { results } = await db
    .prepare(
      `SELECT id, company_name, member_type, website, phone, logo_r2_key
       FROM members WHERE active = 1 ORDER BY company_name ASC`,
    )
    .all<{
      id: string
      company_name: string
      member_type: MemberType
      website: string | null
      phone: string | null
      logo_r2_key: string | null
    }>()

  return (results ?? []).map((r) => ({
    id: r.id,
    company: r.company_name,
    type: r.member_type,
    website: r.website ?? undefined,
    phone: r.phone ?? undefined,
    logoUrl: memberLogoUrl(r.id, r.logo_r2_key),
  }))
}
