export const THEME_IDS = ['desert', 'heritage', 'corporate'] as const
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
    label: 'Desert (default)',
    description: 'Warm sand background with navy and copper accents. Balanced spacing.',
    layout: 'standard',
  },
  {
    id: 'heritage',
    label: 'Heritage',
    description: 'Royal blue and maroon from the chapter logo. More open sections and hero.',
    layout: 'spacious',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    description: 'Cool gray minimal palette. Tighter header and section spacing.',
    layout: 'compact',
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
