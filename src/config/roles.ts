export const USER_ROLES = ['admin', 'chair', 'member'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const MEMBER_LINK_STATUSES = ['none', 'pending', 'approved', 'rejected'] as const
export type MemberLinkStatus = (typeof MEMBER_LINK_STATUSES)[number]

export type User = {
  id: string
  email: string
  role: UserRole
  member_id: string | null
  pending_member_id: string | null
  member_link_status: MemberLinkStatus
  display_name: string | null
}

export type UserWithMemberInfo = User & {
  member_company: string | null
  pending_company: string | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  chair: 'Chair',
  member: 'Member',
}

export const SCHOLARSHIPS_COMMITTEE_KEY = 'scholarships' as const

export function committeeAssignmentKeys(committees: { key: string }[]): string[] {
  return [...committees.map((committee) => committee.key), SCHOLARSHIPS_COMMITTEE_KEY]
}

export function committeeAssignmentLabels(
  committees: { key: string; name: string }[],
): Record<string, string> {
  return {
    ...Object.fromEntries(committees.map((committee) => [committee.key, committee.name])),
    [SCHOLARSHIPS_COMMITTEE_KEY]: 'NUCA Las Vegas Scholarships',
  }
}
