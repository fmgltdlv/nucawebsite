export const THEME_IDS = [
  'desert',
  'heritage',
  'corporate',
  'blueprint',
  'neon',
  'terracotta',
  'quarry',
] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const LAYOUT_IDS = ['standard', 'spacious', 'compact'] as const
export type LayoutVariantId = (typeof LAYOUT_IDS)[number]

export const DEFAULT_THEME: ThemeId = 'desert'

export type ThemeOption = {
  id: ThemeId
  label: string
  description: string
  /** Spacing / density preset bundled with this theme (admin picks one preset). */
  layout: LayoutVariantId
}

/** Presets secretary can choose in admin later (`site_settings.theme_id`). */
export const themeOptions: ThemeOption[] = [
  {
    id: 'desert',
    label: 'Desert Sunset',
    description:
      'Warm sand tones, serif headlines, and soft rounded buttons — the classic chapter look.',
    layout: 'standard',
  },
  {
    id: 'heritage',
    label: 'Chapter Heritage',
    description:
      'Royal blue and maroon with formal serif typography, sharp corners, and outlined buttons.',
    layout: 'spacious',
  },
  {
    id: 'corporate',
    label: 'Clean Corporate',
    description:
      'Cool gray minimalism, tight Inter typography, flat buttons with subtle lift on hover.',
    layout: 'compact',
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    description:
      'Engineering-site aesthetic — condensed type, dashed borders, sharp corners, construction orange accents.',
    layout: 'compact',
  },
  {
    id: 'neon',
    label: 'Neon Nights',
    description:
      'Dark Vegas vibe with glowing teal and pink accents, bold display type, and neon button glow.',
    layout: 'standard',
  },
  {
    id: 'terracotta',
    label: 'Southwest Clay',
    description:
      'Earthy terracotta and sage, soft Fraunces headlines, pill-shaped buttons, and rounded cards.',
    layout: 'spacious',
  },
  {
    id: 'quarry',
    label: 'Quarry Stone',
    description:
      'Industrial stone grays with rust accents, uppercase Oswald headings, and chunky pressed buttons.',
    layout: 'standard',
  },
]

const themeById = Object.fromEntries(themeOptions.map((t) => [t.id, t])) as Record<ThemeId, ThemeOption>

export function parseThemeId(value: string | undefined | null): ThemeId {
  if (value && THEME_IDS.includes(value as ThemeId)) return value as ThemeId
  return DEFAULT_THEME
}

export function layoutForTheme(themeId: ThemeId): LayoutVariantId {
  return themeById[themeId]?.layout ?? 'standard'
}

export const layoutVariantLabels: Record<LayoutVariantId, string> = {
  standard: 'Balanced',
  spacious: 'Open',
  compact: 'Compact',
}
