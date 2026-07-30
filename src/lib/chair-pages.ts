import type { CommitteeKey } from '../config/roles'
import { COMMITTEE_KEYS } from '../config/roles'
import type { AdminContext } from './admin-context'

export function committeePageSlug(key: CommitteeKey): string {
  return key === 'scholarships' ? 'scholarships' : `committee-${key}`
}

export function isCommitteeKey(key: string): key is CommitteeKey {
  return (COMMITTEE_KEYS as readonly string[]).includes(key)
}

export function chairCanEditPage(ctx: AdminContext, slug: string): boolean {
  if (ctx.user.role === 'admin') return true
  if (ctx.user.role !== 'chair') return false
  for (const key of ctx.chairCommittees) {
    if (isCommitteeKey(key) && committeePageSlug(key) === slug) return true
  }
  return false
}

export function chairEditableSlugs(ctx: AdminContext): string[] {
  return ctx.chairCommittees
    .filter(isCommitteeKey)
    .map((key) => committeePageSlug(key))
}
