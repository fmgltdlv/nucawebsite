import { Hono } from 'hono'
import type { ThemeId } from '../config/themes'
import { COMMITTEE_KEYS, USER_ROLES, type UserRole } from '../config/roles'
import type { Env } from '../env'
import { assignChairCommittees, createUser, listUsers, verifyUserLogin } from '../lib/auth'
import { canAccessRole, resolveAdminContext } from '../lib/admin-context'
import { createEvent, listUpcomingEvents } from '../lib/events'
import { listActiveMembers } from '../lib/members'
import { getMemberById, updateMemberProfile } from '../lib/members-db'
import { seedAdminIfNeeded } from '../lib/seed'
import {
  clearSessionCookieHeader,
  createSessionToken,
  sessionCookieHeader,
} from '../lib/session'
import { AdminLoginPage } from '../pages/AdminAuth'
import { AdminCommitteesPage } from '../pages/admin/AdminCommittees'
import { AdminContentPage } from '../pages/admin/AdminContent'
import { AdminEventsPage } from '../pages/admin/AdminEvents'
import { AdminHomePage } from '../pages/admin/AdminHome'
import { AdminMembersPage } from '../pages/admin/AdminMembers'
import { AdminProfilePage } from '../pages/admin/AdminProfile'
import { AdminUsersPage } from '../pages/admin/AdminUsers'

type AdminVariables = { theme: ThemeId }

function parseDatetimeLocal(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function registerAdminRoutes(app: Hono<{ Bindings: Env; Variables: AdminVariables }>) {
  app.get('/admin/login', async (c) => {
    await seedAdminIfNeeded(c.env)
    const ctx = await resolveAdminContext(c)
    if (ctx) return c.redirect('/admin', 303)
    return c.html(<AdminLoginPage theme={c.get('theme')} />)
  })

  app.post('/admin/login', async (c) => {
    await seedAdminIfNeeded(c.env)
    const body = await c.req.parseBody()
    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const user = await verifyUserLogin(c.env, email, password)
    if (!user) {
      return c.html(
        <AdminLoginPage theme={c.get('theme')} error="Invalid email or password." />,
        401,
      )
    }
    const token = await createSessionToken(user.id, user.role, c.env)
    c.header('Set-Cookie', sessionCookieHeader(token))
    return c.redirect('/admin', 303)
  })

  app.post('/admin/logout', (c) => {
    c.header('Set-Cookie', clearSessionCookieHeader())
    return c.redirect('/admin/login', 303)
  })

  app.get('/admin', async (c) => {
    await seedAdminIfNeeded(c.env)
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    return c.html(<AdminHomePage theme={c.get('theme')} ctx={ctx} />)
  })

  app.get('/admin/users', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)
    const users = await listUsers(c.env.DB)
    const message = c.req.query('ok') === '1' ? 'User created.' : undefined
    return c.html(
      <AdminUsersPage theme={c.get('theme')} ctx={ctx} users={users} message={message} />,
    )
  })

  app.post('/admin/users', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)

    const body = await c.req.parseBody()
    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const roleRaw = typeof body.role === 'string' ? body.role : ''
    const role = USER_ROLES.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : 'member'
    const member_id = typeof body.member_id === 'string' ? body.member_id.trim() : ''
    const display_name = typeof body.display_name === 'string' ? body.display_name.trim() : ''

    if (!email || password.length < 10) {
      const users = await listUsers(c.env.DB)
      return c.html(
        <AdminUsersPage
          theme={c.get('theme')}
          ctx={ctx}
          users={users}
          message="Email and password (10+ characters) are required."
        />,
      )
    }

    const userId = await createUser(c.env.DB, email, password, role, {
      member_id: member_id || undefined,
      display_name: display_name || undefined,
    })

    if (role === 'chair') {
      const keys = COMMITTEE_KEYS.filter((key) => body[`committee_${key}`] === '1')
      await assignChairCommittees(c.env.DB, userId, keys)
    }

    return c.redirect('/admin/users?ok=1', 303)
  })

  app.get('/admin/members', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)
    const members = await listActiveMembers(c.env.DB)
    return c.html(<AdminMembersPage theme={c.get('theme')} ctx={ctx} members={members} />)
  })

  app.get('/admin/events', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin', 'chair'])) return c.redirect('/admin', 303)
    const events = await listUpcomingEvents(c.env.DB)
    const flash = c.req.query('ok') === '1' ? 'Event published.' : undefined
    return c.html(
      <AdminEventsPage theme={c.get('theme')} ctx={ctx} events={events} flash={flash} />,
    )
  })

  app.post('/admin/events', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin', 'chair'])) return c.redirect('/admin', 303)

    const body = await c.req.parseBody()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const startsRaw = typeof body.starts_at === 'string' ? body.starts_at : ''
    const starts_at = parseDatetimeLocal(startsRaw)
    if (!title || !starts_at) return c.redirect('/admin/events', 303)

    const endsRaw = typeof body.ends_at === 'string' ? body.ends_at : ''
    const ends_at = endsRaw ? parseDatetimeLocal(endsRaw) : null
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const registration_url =
      typeof body.registration_url === 'string' ? body.registration_url.trim() : ''

    await createEvent(c.env.DB, {
      title,
      starts_at,
      ends_at: ends_at ?? undefined,
      location: location || undefined,
      description: description || undefined,
      registration_url: registration_url || undefined,
    })

    return c.redirect('/admin/events?ok=1', 303)
  })

  app.get('/admin/content', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)
    return c.html(<AdminContentPage theme={c.get('theme')} ctx={ctx} />)
  })

  app.get('/admin/committees', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['chair'])) return c.redirect('/admin', 303)
    return c.html(<AdminCommitteesPage theme={c.get('theme')} ctx={ctx} />)
  })

  app.get('/admin/profile', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['member'])) return c.redirect('/admin', 303)

    const member = ctx.user.member_id
      ? await getMemberById(c.env.DB, ctx.user.member_id)
      : null
    const flash = c.req.query('ok') === '1' ? 'Profile updated.' : undefined
    return c.html(
      <AdminProfilePage theme={c.get('theme')} ctx={ctx} member={member} flash={flash} />,
    )
  })

  app.post('/admin/profile', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['member'])) return c.redirect('/admin', 303)
    if (!ctx.user.member_id) return c.redirect('/admin/profile', 303)

    const body = await c.req.parseBody()
    const website = typeof body.website === 'string' ? body.website.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    await updateMemberProfile(c.env.DB, ctx.user.member_id, {
      website: website || undefined,
      phone: phone || undefined,
      email: email || undefined,
    })

    return c.redirect('/admin/profile?ok=1', 303)
  })
}
