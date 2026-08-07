export const MEMBER_GRID_LOGO_SIZE_OPTIONS = [
  {
    id: 'default',
    label: 'Default',
    description: 'Compact — good for long member lists.',
    rem: 3.5,
    fontRem: 1.25,
    px: 56,
  },
  {
    id: 'medium',
    label: 'Medium',
    description: 'Noticeably larger without crowding the grid.',
    rem: 5,
    fontRem: 1.5,
    px: 80,
  },
  {
    id: 'large',
    label: 'Large',
    description: 'Matches the Leadership page bubble size.',
    rem: 5.25,
    fontRem: 1.5,
    px: 84,
  },
  {
    id: 'xlarge',
    label: 'Extra large',
    description: 'Maximum recommended size for the 4-column grid.',
    rem: 6,
    fontRem: 1.65,
    px: 96,
  },
] as const

export type MemberGridLogoSizeId = (typeof MEMBER_GRID_LOGO_SIZE_OPTIONS)[number]['id']

export const DEFAULT_MEMBER_GRID_LOGO_SIZE: MemberGridLogoSizeId = 'default'

const sizeById = Object.fromEntries(
  MEMBER_GRID_LOGO_SIZE_OPTIONS.map((option) => [option.id, option]),
) as Record<MemberGridLogoSizeId, (typeof MEMBER_GRID_LOGO_SIZE_OPTIONS)[number]>

export function parseMemberGridLogoSize(value: unknown): MemberGridLogoSizeId {
  if (typeof value === 'string' && value in sizeById) {
    return value as MemberGridLogoSizeId
  }
  return DEFAULT_MEMBER_GRID_LOGO_SIZE
}

export function memberGridLogoSizeOption(id: MemberGridLogoSizeId) {
  return sizeById[id]
}

export function memberGridLogoCssVars(id: MemberGridLogoSizeId): Record<string, string> {
  const option = memberGridLogoSizeOption(id)
  return {
    '--member-logo-size': `${option.rem}rem`,
    '--member-logo-font-size': `${option.fontRem}rem`,
  }
}

export function memberGridLogoStyle(id: MemberGridLogoSizeId): string {
  const vars = memberGridLogoCssVars(id)
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}
