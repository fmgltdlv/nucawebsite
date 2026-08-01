import { committeePublicPath, SCHOLARSHIPS_COMMITTEE_KEY } from './committee-pages'
import { listCommittees } from './committees-db'
import { pagePublicPath } from './page-paths'
import { listPages, PAGE_LABELS, type PageRecord } from './pages-db'

export type SiteInternalLink = {
  href: string
  label: string
  group: string
}

const GROUP_ORDER = ['Site pages', 'Editable pages', 'Committees'] as const

export const STATIC_SITE_INTERNAL_LINKS: SiteInternalLink[] = [
  { href: '/', label: 'Home', group: 'Site pages' },
  { href: '/about', label: 'About', group: 'Site pages' },
  { href: '/about/faq', label: 'FAQ', group: 'Site pages' },
  { href: '/about/leadership', label: 'Leadership', group: 'Site pages' },
  { href: '/about/committees', label: 'Committees', group: 'Site pages' },
  { href: '/training', label: 'Training', group: 'Site pages' },
  { href: '/scholarships', label: 'NUCA Las Vegas Scholarships', group: 'Site pages' },
  { href: '/resources', label: 'Resources', group: 'Site pages' },
  { href: '/the-dirt', label: 'THE DIRT', group: 'Site pages' },
  { href: '/events', label: 'Events', group: 'Site pages' },
  { href: '/join', label: 'Join', group: 'Site pages' },
  { href: '/contact', label: 'Contact', group: 'Site pages' },
  { href: '/members', label: 'Members directory', group: 'Site pages' },
]

function sortInternalLinks(links: SiteInternalLink[]): SiteInternalLink[] {
  return [...links].sort((a, b) => {
    const groupDiff = GROUP_ORDER.indexOf(a.group as (typeof GROUP_ORDER)[number])
      - GROUP_ORDER.indexOf(b.group as (typeof GROUP_ORDER)[number])
    if (groupDiff !== 0) return groupDiff
    return a.label.localeCompare(b.label)
  })
}

export function pageRecordToInternalLink(page: Pick<PageRecord, 'slug' | 'title'>): SiteInternalLink {
  const staticLabel = PAGE_LABELS[page.slug as keyof typeof PAGE_LABELS]
  return {
    href: pagePublicPath(page.slug),
    label: page.title || staticLabel || page.slug,
    group: 'Editable pages',
  }
}

export async function listSiteInternalLinks(db: D1Database): Promise<SiteInternalLink[]> {
  const [pages, committees] = await Promise.all([listPages(db), listCommittees(db)])

  const seen = new Set(STATIC_SITE_INTERNAL_LINKS.map((link) => link.href))
  const links: SiteInternalLink[] = [...STATIC_SITE_INTERNAL_LINKS]

  for (const page of pages) {
    const link = pageRecordToInternalLink(page)
    if (seen.has(link.href)) continue
    seen.add(link.href)
    links.push(link)
  }

  for (const committee of committees) {
    const href =
      committee.key === SCHOLARSHIPS_COMMITTEE_KEY
        ? '/scholarships'
        : committeePublicPath(committee.key)
    if (seen.has(href)) continue
    seen.add(href)
    links.push({
      href,
      label: committee.name,
      group: 'Committees',
    })
  }

  return sortInternalLinks(links)
}
