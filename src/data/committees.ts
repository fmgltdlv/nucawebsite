/** Default chapter committees — seeded into D1 on first run; managed in admin thereafter. */
export const CHAPTER_COMMITTEES = [
  { key: 'legislative', name: 'Legislative Committee' },
  { key: 'safety', name: 'Safety Committee' },
  { key: 'standards', name: 'Standards Committee' },
  { key: 'damage_prevention', name: 'Damage Prevention Committee' },
] as const

export type ChapterCommitteeKey = (typeof CHAPTER_COMMITTEES)[number]['key']

export const CHAPTER_COMMITTEE_BY_KEY: Record<ChapterCommitteeKey, string> = Object.fromEntries(
  CHAPTER_COMMITTEES.map((c) => [c.key, c.name]),
) as Record<ChapterCommitteeKey, string>
