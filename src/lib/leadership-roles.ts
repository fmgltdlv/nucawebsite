export type LeadershipTier = 'featured' | 'officers' | 'board' | 'nonVoting' | 'other'

export type LeadershipRoleOption = {
  label: string
  tier: LeadershipTier
  roleOrder: number
}

/** Canonical leadership roles shown in admin and on the public roster. */
export const LEADERSHIP_ROLE_OPTIONS: LeadershipRoleOption[] = [
  { label: 'President', tier: 'featured', roleOrder: 0 },
  { label: 'Vice President', tier: 'featured', roleOrder: 1 },
  { label: 'Secretary', tier: 'officers', roleOrder: 0 },
  { label: 'Immediate Past President', tier: 'officers', roleOrder: 1 },
  { label: 'Past President', tier: 'officers', roleOrder: 1 },
  { label: 'Treasurer', tier: 'officers', roleOrder: 2 },
  { label: 'Executive Director', tier: 'officers', roleOrder: 3 },
  { label: 'Board Member', tier: 'board', roleOrder: 0 },
  { label: 'Non-Voting Board Member', tier: 'nonVoting', roleOrder: 0 },
]

export const LEADERSHIP_ROLE_LABELS = LEADERSHIP_ROLE_OPTIONS.map((option) => option.label)

const ROLE_BY_LABEL = new Map(
  LEADERSHIP_ROLE_OPTIONS.map((option) => [option.label.toLowerCase(), option]),
)

export function isKnownLeadershipRole(roleTitle: string): boolean {
  return ROLE_BY_LABEL.has(roleTitle.trim().toLowerCase())
}

export function classifyKnownLeadershipRole(roleTitle: string): {
  tier: LeadershipTier
  roleOrder: number
} | null {
  const option = ROLE_BY_LABEL.get(roleTitle.trim().toLowerCase())
  if (!option) return null
  return { tier: option.tier, roleOrder: option.roleOrder }
}

export function canonicalLeadershipRole(roleTitle: string): string | null {
  const trimmed = roleTitle.trim()
  if (!trimmed) return null
  const option = ROLE_BY_LABEL.get(trimmed.toLowerCase())
  return option?.label ?? null
}

export function parseLeadershipRole(
  roleTitle: unknown,
  existingRole?: string | null,
): string | null {
  if (typeof roleTitle !== 'string') return null
  const trimmed = roleTitle.trim()
  if (!trimmed) return null

  const canonical = canonicalLeadershipRole(trimmed)
  if (canonical) return canonical

  const existing = existingRole?.trim()
  if (existing && trimmed.toLowerCase() === existing.toLowerCase()) return existing

  return null
}

export function leadershipRoleOptionsForValue(currentRole: string): LeadershipRoleOption[] {
  const trimmed = currentRole.trim()
  if (!trimmed || isKnownLeadershipRole(trimmed)) return LEADERSHIP_ROLE_OPTIONS
  return [
    ...LEADERSHIP_ROLE_OPTIONS,
    { label: trimmed, tier: 'other', roleOrder: 0 },
  ]
}
