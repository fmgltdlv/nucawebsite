import { committeeKeyFromSlug, committeePublicPath } from './committee-pages'

const PUBLIC_PATHS: Record<string, string> = {
  home: '/',
  about: '/about',
  training: '/training',
  resources: '/resources',
  scholarships: '/scholarships',
  committees: '/about/committees',
}

export function pagePublicPath(slug: string): string {
  const committeeKey = committeeKeyFromSlug(slug)
  if (committeeKey) return committeePublicPath(committeeKey)
  return PUBLIC_PATHS[slug] ?? `/${slug}`
}
export function pagePreviewPath(slug: string): string {
  return `/admin/content/pages/${slug}/preview`
}

export function pagePreviewDraftPath(slug: string): string {
  return `/admin/content/pages/${slug}/preview-draft`
}
