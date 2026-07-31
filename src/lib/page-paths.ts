import { committeeKeyFromSlug, committeePublicPath } from './committee-pages'

const PUBLIC_PATHS: Record<string, string> = {
  about: '/about',
  training: '/training',
  resources: '/resources',
  scholarships: '/scholarships',
  committees: '/about/committees',
  'committee-legislative': '/about/committees/legislative',
  'committee-safety': '/about/committees/safety',
  'committee-standards': '/about/committees/standards',
  'committee-damage_prevention': '/about/committees/damage_prevention',
}

export function pagePublicPath(slug: string): string {
  const committeeKey = committeeKeyFromSlug(slug)
  if (committeeKey) return committeePublicPath(committeeKey)
  return PUBLIC_PATHS[slug] ?? `/${slug}`
}

export function pagePreviewPath(slug: string): string {
  return `/admin/content/pages/${slug}/preview`
}
