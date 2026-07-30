import type { LeadershipRecord } from './leadership-db'

export type LeadershipTier = 'featured' | 'officers' | 'board' | 'nonVoting' | 'other'

const OFFICER_ROLE_ORDER: [string, number][] = [
  ['secretary', 0],
  ['immediate past president', 1],
  ['past president', 1],
  ['treasurer', 2],
  ['executive director', 3],
]

export function classifyLeadershipRole(roleTitle: string): { tier: LeadershipTier; roleOrder: number } {
  const lower = roleTitle.toLowerCase().trim()

  if (/non[\s-]?voting/.test(lower)) {
    return { tier: 'nonVoting', roleOrder: 0 }
  }

  if (/\bboard\b/.test(lower) && !/president/.test(lower)) {
    return { tier: 'board', roleOrder: 0 }
  }

  if (/vice\s*president/.test(lower)) {
    return { tier: 'featured', roleOrder: 1 }
  }

  if (/\bpresident\b/.test(lower) && !/past/.test(lower) && !/vice/.test(lower)) {
    return { tier: 'featured', roleOrder: 0 }
  }

  for (const [pattern, order] of OFFICER_ROLE_ORDER) {
    if (lower.includes(pattern)) {
      return { tier: 'officers', roleOrder: order }
    }
  }

  return { tier: 'other', roleOrder: 0 }
}

function sortLeaders(items: LeadershipRecord[]): LeadershipRecord[] {
  return [...items].sort((a, b) => {
    const aClass = classifyLeadershipRole(a.role_title)
    const bClass = classifyLeadershipRole(b.role_title)
    if (aClass.roleOrder !== bClass.roleOrder) return aClass.roleOrder - bClass.roleOrder
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export function groupLeadership(leaders: LeadershipRecord[]): Record<LeadershipTier, LeadershipRecord[]> {
  const groups: Record<LeadershipTier, LeadershipRecord[]> = {
    featured: [],
    officers: [],
    board: [],
    nonVoting: [],
    other: [],
  }

  for (const person of leaders) {
    const { tier } = classifyLeadershipRole(person.role_title)
    groups[tier].push(person)
  }

  for (const tier of Object.keys(groups) as LeadershipTier[]) {
    groups[tier] = sortLeaders(groups[tier])
  }

  return groups
}
