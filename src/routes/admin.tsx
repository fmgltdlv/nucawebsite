import { Hono } from 'hono'
import type { ThemeId } from '../config/themes'
import { COMMITTEE_KEYS, USER_ROLES, type UserRole } from '../config/roles'
import { MEMBER_TYPES, type MemberType } from '../data/demo'
import type { Env } from '../env'
import { assignChairCommittees, approveMemberLink, createUser, listUsersWithMemberInfo, rejectMemberLink, requestMemberLink, verifyUserLogin } from '../lib/auth'
import { canAccessRole, resolveAdminContext } from '../lib/admin-context'
import { parseRepeatRule, parseRepeatUntil } from '../lib/event-repeat'
import {
  applyEventImageUploads,
  createEvent,
  deleteEvent,
  deleteEventAssets,
  getEventById,
  listAllEventsForAdmin,
  resolveEventCoordinates,
  updateEvent,
} from '../lib/events'
import { parseDatetimeLocal } from '../lib/datetime'
import { registerAdminContentRoutes } from './admin-content'
import { listActiveMembers } from '../lib/members'
import {
  createMember,
  getMemberById,
  getMemberLogoR2Key,
  listMembersForAdmin,
  updateMember,
  updateMemberLogoKey,
  updateMemberProfile,
} from '../lib/members-db'
import { applyMemberLogoChange } from '../lib/member-logos'
import { countAssetsByType, dedupeAssetsByKey, filterAssetsByKind, listIndexedAssets, parseAssetType } from '../lib/assets-index'
import { getAssetUrl } from '../lib/r2-assets'
import { seedAdminIfNeeded } from '../lib/seed'
import {
  clearSessionCookieHeader,
  createSessionToken,
  sessionCookieHeader,
} from '../lib/session'
import { AdminLoginPage } from '../pages/AdminAuth'
import { AdminAssetsPage } from '../pages/admin/AdminAssets'
import { AdminCommitteesPage } from '../pages/admin/AdminCommittees'
import { AdminEventsPage } from '../pages/admin/AdminEvents'
import { AdminHomePage } from '../pages/admin/AdminHome'
import { AdminMembersPage } from '../pages/admin/AdminMembers'
import { AdminProfilePage } from '../pages/admin/AdminProfile'
import { AdminUsersPage } from '../pages/admin/AdminUsers'

type AdminVariables = { theme: ThemeId }

function parseMemberType(value: string): MemberType {
  return MEMBER_TYPES.includes(value as MemberType) ? (value as MemberType) : 'contractor'
}

function parseMemberFormBody(body: Record<string, File | string>) {
  const company_name = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const member_type = parseMemberType(
    typeof body.member_type === 'string' ? body.member_type : '',
  )
  const website = typeof body.website === 'string' ? body.website.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const active = body.active === '1'

  return {
    company_name,
    member_type,
    description: description || undefined,
    website: website || undefined,
    phone: phone || undefined,
    email: email || undefined,
    active,
  }
}

export function registerAdminRoutes(app: Hono<{ Bindings: Env; Variables: AdminVariables }>) {
  registerAdminContentRoutes(app)
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

  app.get('/admin/assets', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)

    const allAssets = await listIndexedAssets(c.env.DB)
    const filterType = parseAssetType(c.req.query('type'))
    const typeCounts = countAssetsByType(allAssets)
    const assets = filterType ? allAssets.filter((asset) => asset.type === filterType) : allAssets

    return c.html(
      <AdminAssetsPage
        theme={c.get('theme')}
        ctx={ctx}
        assets={assets}
        typeCounts={typeCounts}
        totalCount={allAssets.length}
        filterType={filterType}
      />,
    )
  })

  app.get('/admin/api/assets', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.json({ error: 'Unauthorized' }, 401)
    if (!canAccessRole(ctx.user, ['admin', 'chair'])) return c.json({ error: 'Forbidden' }, 403)

    const kind = c.req.query('kind') === 'pdf' ? 'pdf' : 'image'
    if (kind === 'pdf' && !canAccessRole(ctx.user, ['admin'])) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const allAssets = await listIndexedAssets(c.env.DB)
    const assets = dedupeAssetsByKey(filterAssetsByKind(allAssets, kind)).map((asset) => ({
      key: asset.key,
      label: asset.label,
      type: asset.type,
      url: getAssetUrl(asset.key),
    }))

    return c.json({ assets })
  })

  app.get('/admin/users', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)
    const users = await listUsersWithMemberInfo(c.env.DB)
    const members = await listActiveMembers(c.env.DB)
    const ok = c.req.query('ok')
    const message =
      ok === '1'
        ? 'User created.'
        : ok === 'approved'
          ? 'Company link approved.'
          : ok === 'rejected'
            ? 'Company link rejected.'
            : undefined
    return c.html(
      <AdminUsersPage theme={c.get('theme')} ctx={ctx} users={users} members={members} message={message} />,
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
      const users = await listUsersWithMemberInfo(c.env.DB)
      const members = await listActiveMembers(c.env.DB)
      return c.html(
        <AdminUsersPage
          theme={c.get('theme')}
          ctx={ctx}
          users={users}
          members={members}
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

  app.post('/admin/users/:userId/approve-link', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)

    const result = await approveMemberLink(c.env.DB, c.req.param('userId'))
    return c.redirect(result.ok ? '/admin/users?ok=approved' : '/admin/users', 303)
  })

  app.post('/admin/users/:userId/reject-link', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)

    const result = await rejectMemberLink(c.env.DB, c.req.param('userId'))
    return c.redirect(result.ok ? '/admin/users?ok=rejected' : '/admin/users', 303)
  })

  app.get('/admin/members', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)
    const members = await listMembersForAdmin(c.env.DB)
    const flash =
      c.req.query('ok') === '1'
        ? 'Member saved.'
        : c.req.query('created') === '1'
          ? 'Member added.'
          : undefined
    return c.html(
      <AdminMembersPage theme={c.get('theme')} ctx={ctx} members={members} flash={flash} />,
    )
  })

  app.post('/admin/members', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)

    const body = await c.req.parseBody()
    const data = parseMemberFormBody(body)
    if (!data.company_name) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          theme={c.get('theme')}
          ctx={ctx}
          members={members}
          error="Company name is required."
        />,
      )
    }

    const memberId = await createMember(c.env.DB, data)
    const logoError = await applyMemberLogoChange(
      c.env.R2,
      (id, key) => updateMemberLogoKey(c.env.DB, id, key),
      memberId,
      body,
    )
    if (logoError) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          theme={c.get('theme')}
          ctx={ctx}
          members={members}
          error={`Member added, but logo upload failed: ${logoError}`}
        />,
      )
    }

    return c.redirect('/admin/members?created=1', 303)
  })

  app.post('/admin/members/:id', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin'])) return c.redirect('/admin', 303)

    const id = c.req.param('id')
    const body = await c.req.parseBody()
    const data = parseMemberFormBody(body)
    if (!data.company_name) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          theme={c.get('theme')}
          ctx={ctx}
          members={members}
          error="Company name is required."
        />,
      )
    }

    await updateMember(c.env.DB, id, data)
    const previousKey = await getMemberLogoR2Key(c.env.DB, id)
    const logoError = await applyMemberLogoChange(
      c.env.R2,
      (memberId, key) => updateMemberLogoKey(c.env.DB, memberId, key),
      id,
      body,
      previousKey,
    )
    if (logoError) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          theme={c.get('theme')}
          ctx={ctx}
          members={members}
          error={`Member saved, but logo upload failed: ${logoError}`}
        />,
      )
    }

    return c.redirect('/admin/members?ok=1', 303)
  })

  app.get('/admin/events', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin', 'chair'])) return c.redirect('/admin', 303)
    const events = await listAllEventsForAdmin(c.env.DB)
    const flash =
      c.req.query('ok') === '1'
        ? 'Event saved.'
        : c.req.query('created') === '1'
          ? 'Event published.'
          : undefined
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
    const repeat_rule = parseRepeatRule(typeof body.repeat_rule === 'string' ? body.repeat_rule : '')
    const repeat_until = parseRepeatUntil(typeof body.repeat_until === 'string' ? body.repeat_until : '')
    const coords = await resolveEventCoordinates(location || null)

    const id = await createEvent(c.env.DB, {
      title,
      starts_at,
      ends_at: ends_at ?? undefined,
      location: location || undefined,
      description: description || undefined,
      registration_url: registration_url || undefined,
      repeat_rule,
      repeat_until,
      latitude: coords.latitude,
      longitude: coords.longitude,
    })

    const images = await applyEventImageUploads(c.env.R2, id, body)
    if (images.error) {
      return c.redirect(`/admin/events?error=${encodeURIComponent(images.error)}`, 303)
    }
    if (images.thumbnail_r2_key || images.flyer_r2_key) {
      await updateEvent(c.env.DB, id, {
        title,
        starts_at,
        ends_at,
        location: location || null,
        description: description || null,
        registration_url: registration_url || null,
        published: true,
        repeat_rule,
        repeat_until,
        thumbnail_r2_key: images.thumbnail_r2_key,
        flyer_r2_key: images.flyer_r2_key,
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
    }

    return c.redirect('/admin/events?created=1', 303)
  })

  app.post('/admin/events/:id', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin', 'chair'])) return c.redirect('/admin', 303)

    const id = c.req.param('id')
    const existing = await getEventById(c.env.DB, id)
    if (!existing) return c.redirect('/admin/events', 303)

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
    const repeat_rule = parseRepeatRule(typeof body.repeat_rule === 'string' ? body.repeat_rule : '')
    const repeat_until = parseRepeatUntil(typeof body.repeat_until === 'string' ? body.repeat_until : '')
    const coords = await resolveEventCoordinates(location || null, existing)
    const images = await applyEventImageUploads(c.env.R2, id, body, existing)
    if (images.error) {
      return c.redirect(`/admin/events?error=${encodeURIComponent(images.error)}`, 303)
    }

    await updateEvent(c.env.DB, id, {
      title,
      starts_at,
      ends_at,
      location: location || null,
      description: description || null,
      registration_url: registration_url || null,
      published: body.published === '1',
      repeat_rule,
      repeat_until,
      thumbnail_r2_key: images.thumbnail_r2_key,
      flyer_r2_key: images.flyer_r2_key,
      latitude: coords.latitude,
      longitude: coords.longitude,
    })

    return c.redirect('/admin/events?ok=1', 303)
  })

  app.post('/admin/events/:id/delete', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['admin', 'chair'])) return c.redirect('/admin', 303)
    const id = c.req.param('id')
    const existing = await getEventById(c.env.DB, id)
    if (existing) await deleteEventAssets(c.env.R2, existing)
    await deleteEvent(c.env.DB, id)
    return c.redirect('/admin/events?ok=1', 303)
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

    const companies = await listActiveMembers(c.env.DB)
    const member = ctx.user.member_id
      ? await getMemberById(c.env.DB, ctx.user.member_id)
      : null
    const pendingMember = ctx.user.pending_member_id
      ? await getMemberById(c.env.DB, ctx.user.pending_member_id)
      : null
    const ok = c.req.query('ok')
    const flash =
      ok === '1'
        ? 'Profile updated.'
        : ok === 'link'
          ? 'Company link request submitted for admin approval.'
          : undefined
    return c.html(
      <AdminProfilePage
        theme={c.get('theme')}
        ctx={ctx}
        member={member}
        pendingMember={pendingMember}
        companies={companies}
        flash={flash}
      />,
    )
  })

  app.post('/admin/profile/link', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['member'])) return c.redirect('/admin', 303)

    const body = await c.req.parseBody()
    const member_id = typeof body.member_id === 'string' ? body.member_id.trim() : ''
    if (!member_id) return c.redirect('/admin/profile', 303)

    const result = await requestMemberLink(c.env.DB, ctx.user.id, member_id)
    if (!result.ok) {
      const companies = await listActiveMembers(c.env.DB)
      const member = ctx.user.member_id
        ? await getMemberById(c.env.DB, ctx.user.member_id)
        : null
      const pendingMember = ctx.user.pending_member_id
        ? await getMemberById(c.env.DB, ctx.user.pending_member_id)
        : null
      return c.html(
        <AdminProfilePage
          theme={c.get('theme')}
          ctx={ctx}
          member={member}
          pendingMember={pendingMember}
          companies={companies}
          error={result.error}
        />,
      )
    }

    return c.redirect('/admin/profile?ok=link', 303)
  })

  app.post('/admin/profile', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    if (!canAccessRole(ctx.user, ['member'])) return c.redirect('/admin', 303)
    if (!ctx.user.member_id || ctx.user.member_link_status === 'none') {
      return c.redirect('/admin/profile', 303)
    }

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
