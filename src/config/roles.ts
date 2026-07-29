export const USER_ROLES = ['admin', 'chair', 'member'] as const
export type UserRole = (typeof USER_ROLES)[number]

export type User = {
  id: string
  email: string
  role: UserRole
  member_id: string | null
  display_name: string | null
}

import { CHAPTER_COMMITTEES, type ChapterCommitteeKey } from '../data/committees'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  chair: 'Chair',
  member: 'Member',
}

/** Committee page keys a Chair may be assigned to edit */
export const COMMITTEE_KEYS = [
  ...CHAPTER_COMMITTEES.map((c) => c.key),
  'scholarships',
] as const
export type CommitteeKey = ChapterCommitteeKey | 'scholarships'

export const COMMITTEE_LABELS: Record<CommitteeKey, string> = {
  ...Object.fromEntries(CHAPTER_COMMITTEES.map((c) => [c.key, c.name])),
  scholarships: 'NUCA Las Vegas Scholarships',
} as Record<CommitteeKey, string>
