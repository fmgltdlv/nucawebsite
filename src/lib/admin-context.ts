import type { Context } from 'hono'
import type { Env } from '../env'
import { getUserById } from './auth'
import type { User } from '../config/roles'
import { readSessionCookie, verifySessionToken } from './session'
import { getAdminInboxCounts, type AdminInboxCounts } from './admin-inbox-counts'

export type AdminContext = {
  user: User
  inboxCounts: AdminInboxCounts
  csrfToken: string
}

export async function resolveAdminContext(
  c: Pick<Context<{ Bindings: Env }>, 'env' | 'req'>,
): Promise<AdminContext | null> {
  const token = readSessionCookie(c.req.header('Cookie'))
  const session = await verifySessionToken(token, c.env)
  if (!session) return null

  const user = await getUserById(c.env.DB, session.sub)
  if (!user || user.role !== session.role) return null
  if (user.session_version !== session.sv) return null

  const inboxCounts = await getAdminInboxCounts(c.env.DB)

  return { user, inboxCounts, csrfToken: session.csrf }
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin'
}
