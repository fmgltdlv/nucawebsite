/**
 * Site navigation — see TODO.md for structure decisions.
 * `status` tracks copy progress (shown in the nav during demo).
 */
export type PageStatus = 'demo' | 'stub' | 'todo'

export type NavLink = {
  label: string
  href: string
  status?: PageStatus
  /** Visual nesting under a parent nav group (e.g. Scholarships under Committees) */
  indent?: boolean
  /** Old site URL for side-by-side copy work */
  legacyUrl?: string
}

export type NavGroup = {
  label: string
  href?: string
  status?: PageStatus
  legacyUrl?: string
  children: NavLink[]
}

export type NavEntry = NavLink | NavGroup

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

export const siteNavigation: NavEntry[] = [
  {
    label: 'Home',
    href: '/',
    status: 'demo',
    legacyUrl: 'https://nucalasvegas.com/',
  },
  {
    label: 'About',
    href: '/about',
    status: 'stub',
    legacyUrl: 'https://nucalasvegas.com/about-us/',
    children: [
      {
        label: 'FAQ',
        href: '/about/faq',
        status: 'stub',
      },
      {
        label: 'Leadership',
        href: '/about/leadership',
        status: 'stub',
        legacyUrl: 'https://nucalasvegas.com/leadership/',
      },
      {
        label: 'Member List',
        href: '/members',
        status: 'demo',
        legacyUrl: 'https://nucalasvegas.com/member-list/',
      },
      {
        label: 'Events',
        href: '/events',
        status: 'demo',
        legacyUrl: 'https://nucalasvegas.com/events/',
      },
      {
        label: 'Resources',
        href: '/resources',
        status: 'todo',
        legacyUrl: 'https://nucalasvegas.com/resources/',
      },
    ],
  },
  {
    label: 'Training',
    href: '/training',
    status: 'stub',
  },
  {
    label: 'Committees',
    href: '/about/committees',
    status: 'stub',
    legacyUrl: 'https://nucalasvegas.com/advocacy/',
    children: [
      {
        label: 'NUCA Las Vegas Scholarships',
        href: '/scholarships',
        status: 'todo',
        indent: true,
        legacyUrl: 'https://nucalasvegas.com/nuca-las-vegas-scholarships/',
      },
    ],
  },
  {
    label: 'THE DIRT',
    href: '/the-dirt',
    status: 'demo',
    legacyUrl: 'https://nucalasvegas.com/industry-updates/',
  },
  {
    label: 'Join NUCA of Las Vegas Today!',
    href: '/join',
    status: 'demo',
    legacyUrl: 'https://nucalasvegas.com/join/',
  },
  {
    label: 'Contact Us',
    href: '/contact',
    status: 'demo',
    legacyUrl: 'https://nucalasvegas.com/contact-us/',
  },
]

export const statusLegend: Record<PageStatus, string> = {
  demo: 'Demo page — layout & sample content',
  stub: 'Stub — route exists, copy not finished',
  todo: 'Not copied yet — placeholder only',
}
