import { SCHOLARSHIPS_COMMITTEE_KEY } from '../config/roles'
import type { AdminContext } from './admin-context'

export function committeePageSlug(key: string): string {
  return key === SCHOLARSHIPS_COMMITTEE_KEY ? 'scholarships' : `committee-${key}`
}

export function isCommitteeAssignmentKey(key: string): boolean {
  return key === SCHOLARSHIPS_COMMITTEE_KEY || /^[a-z][a-z0-9_]*$/.test(key)
}

export function chairCanEditPage(ctx: AdminContext, slug: string): boolean {
  if (ctx.user.role === 'admin') return true
  if (ctx.user.role !== 'chair') return false
  for (const key of ctx.chairCommittees) {
    if (isCommitteeAssignmentKey(key) && committeePageSlug(key) === slug) return true
  }
  return false
}

export function chairEditableSlugs(ctx: AdminContext): string[] {
  return ctx.chairCommittees
    .filter(isCommitteeAssignmentKey)
    .map((key) => committeePageSlug(key))
}
