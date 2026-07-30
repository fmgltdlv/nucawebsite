import { CHAPTER_COMMITTEES, type ChapterCommitteeKey } from '../data/committees'

export function parseCommitteeKey(key: string): ChapterCommitteeKey | null {
  return CHAPTER_COMMITTEES.some((committee) => committee.key === key)
    ? (key as ChapterCommitteeKey)
    : null
}

export function committeeKeyFromSlug(slug: string): ChapterCommitteeKey | null {
  if (!slug.startsWith('committee-')) return null
  const key = slug.slice('committee-'.length)
  return CHAPTER_COMMITTEES.some((c) => c.key === key) ? (key as ChapterCommitteeKey) : null
}

export function committeePublicPath(key: ChapterCommitteeKey): string {
  return `/about/committees/${key}`
}

export function defaultCommitteeBlocks(name: string) {
  return [
    {
      type: 'text' as const,
      body: `The ${name} brings NUCA of Las Vegas members together on chapter priorities in this area. Meeting schedules, initiatives, and contact details can be updated here by committee chairs and chapter staff.`,
    },
    {
      type: 'callout' as const,
      title: 'Get involved',
      body: 'Contact the chapter office to join this committee or ask about upcoming meetings.',
      style: 'accent' as const,
    },
  ]
}
