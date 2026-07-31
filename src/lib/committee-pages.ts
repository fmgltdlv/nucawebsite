export function parseCommitteeKey(key: string): string | null {
  const trimmed = key.trim()
  if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) return null
  return trimmed
}

export function committeeKeyFromSlug(slug: string): string | null {
  if (!slug.startsWith('committee-')) return null
  return parseCommitteeKey(slug.slice('committee-'.length))
}

export function committeePublicPath(key: string): string {
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
