import type { Context } from 'hono'
import type { UserRole } from '../config/roles'
import type { ThemeId } from '../config/themes'
import type { Env } from '../env'
import { getUserById, listChairCommittees } from './auth'
import type { User } from '../config/roles'
import { readSessionCookie, verifySessionToken } from './session'
import { getAdminInboxCounts, type AdminInboxCounts } from './admin-inbox-counts'

export type AdminContext = {
  user: User
  chairCommittees: string[]
  inboxCounts?: AdminInboxCounts
}

export async function resolveAdminContext(
  c: Context<{ Bindings: Env; Variables: { theme: ThemeId } }>,
): Promise<AdminContext | null> {
  const token = readSessionCookie(c.req.header('Cookie'))
  const session = await verifySessionToken(token, c.env)
  if (!session) return null

  const user = await getUserById(c.env.DB, session.sub)
  if (!user || user.role !== session.role) return null

  const chairCommittees =
    user.role === 'chair' ? await listChairCommittees(c.env.DB, user.id) : []

  const inboxCounts = user.role === 'admin' ? await getAdminInboxCounts(c.env.DB) : undefined

  return { user, chairCommittees, inboxCounts }
}

export function canAccessRole(user: User, allowed: UserRole[]): boolean {
  return allowed.includes(user.role)
}
