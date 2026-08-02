import { Hono } from 'hono'
import type { ThemeId } from '../config/themes'
import type { AdminLayoutProps } from '../lib/site-context'
import { MEMBER_TYPES, type MemberType } from '../data/demo'
import type { Env } from '../env'
import { createUser, changeUserPassword, deleteUser, getSessionVersion, listUsers, verifyUserLogin, verifyUserPassword } from '../lib/auth'
import { getAdminCtx } from '../lib/admin-guard'
import { resolveAdminContext } from '../lib/admin-context'
import { writeAuditLog } from '../lib/security/audit-log'
import { generateCsrfToken } from '../lib/security/csrf'
import { clientIp, isLoginRateLimited, recordLoginAttempt } from '../lib/security/rate-limit'
import { verifyTurnstile } from '../lib/security/turnstile'
import { parseRepeatRule, parseRepeatUntil } from '../lib/event-repeat'
import {
  applyEventImageUploads,
  createEvent,
  deleteEvent,
  deleteEventAssets,
  getEventById,
  listAllEventsForAdmin,
  parseManualCoordinates,
  resolveEventFormCoordinates,
  updateEvent,
  resolveEventCommitteeKey,
} from '../lib/events'
import {
  buildEventRsvpsCsv,
  deleteEventRsvp,
  eventRsvpsExportFilename,
  listEventRsvps,
  parseRegistrationLimit,
} from '../lib/event-rsvps'
import { listCommittees } from '../lib/committees-db'
import { listMembershipTypes } from '../lib/membership-types-db'
import {
  geocodeClarkCountyAddress,
  geocodeClarkCountyAddressCandidates,
} from '../lib/geocode'
import { parseDatetimeLocal } from '../lib/datetime'
import { registerAdminContentRoutes } from './admin-content'
import {
  createMember,
  getMemberLogoR2Key,
  listMembersForAdmin,
  updateMember,
  updateMemberLogoKey,
} from '../lib/members-db'
import { applyMemberLogoChange } from '../lib/member-logos'
import { parsePointsOfContactFromForm } from '../lib/member-contacts'
import { countAssetsByType, dedupeAssetsByKey, filterAssetsByKind, listIndexedAssets, parseAssetType } from '../lib/assets-index'
import { getAssetUrl } from '../lib/r2-assets'
import { seedAdminIfNeeded } from '../lib/seed'
import {
  clearSessionCookieHeader,
  createSessionToken,
  isSecureRequest,
  sessionCookieHeader,
} from '../lib/session'
import { AdminLoginPage } from '../pages/AdminAuth'
import { AdminAssetsPage } from '../pages/admin/AdminAssets'
import { AdminEventsPage } from '../pages/admin/AdminEvents'
import { AdminEventRsvpsPage } from '../pages/admin/AdminEventRsvps'
import { AdminHomePage } from '../pages/admin/AdminHome'
import { AdminMembersPage } from '../pages/admin/AdminMembers'
import { AdminProfilePage } from '../pages/admin/AdminProfile'
import { AdminUsersPage } from '../pages/admin/AdminUsers'
import { deleteLibraryAsset } from '../lib/library-assets-db'
import { uploadLibraryAsset } from '../lib/library-asset-upload'
import { applyAssetManage, parseAssetManageRequest } from '../lib/asset-manage'
import { deleteAssetIfUnreferenced } from '../lib/asset-references'

type AdminVariables = { theme: ThemeId; adminSite: AdminLayoutProps; adminCtx: import('../lib/admin-context').AdminContext | null }

function parseMemberType(value: string, allowedKeys: string[]): MemberType {
  if (allowedKeys.includes(value)) return value
  if ((MEMBER_TYPES as readonly string[]).includes(value)) return value
  return allowedKeys[0] ?? 'contractor'
}

function parseMemberFormBody(body: Record<string, File | string>, allowedKeys: string[]) {
  const company_name = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const member_type = parseMemberType(
    typeof body.member_type === 'string' ? body.member_type : '',
    allowedKeys,
  )
  const website = typeof body.website === 'string' ? body.website.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const active = body.active === '1'
  const contacts = parsePointsOfContactFromForm(body)

  return {
    company_name,
    member_type,
    description: description || undefined,
    website: website || undefined,
    phone: phone || undefined,
    email: email || undefined,
    contacts,
    active,
  }
}

function secure(c: { req: { url: string } }): boolean {
  return isSecureRequest(new URL(c.req.url))
}

export function registerAdminRoutes(app: Hono<{ Bindings: Env; Variables: AdminVariables }>) {
  registerAdminContentRoutes(app)
  app.get('/admin/login', async (c) => {
    await seedAdminIfNeeded(c.env)
    const ctx = await resolveAdminContext(c)
    if (ctx) return c.redirect('/admin', 303)
    return c.html(
      <AdminLoginPage
        {...c.get('adminSite')}
        turnstileSiteKey={c.env.TURNSTILE_SITE_KEY}
      />,
    )
  })

  app.post('/admin/login', async (c) => {
    await seedAdminIfNeeded(c.env)
    const ip = clientIp(c.req.raw.headers)
    const turnstileSiteKey = c.env.TURNSTILE_SITE_KEY

    if (await isLoginRateLimited(c.env.DB, ip)) {
      await writeAuditLog(c.env.DB, { action: 'login.rate_limited', ip })
      return c.html(
        <AdminLoginPage
          {...c.get('adminSite')}
          turnstileSiteKey={turnstileSiteKey}
          error="Too many sign-in attempts. Please wait about 15 minutes and try again."
        />,
        429,
      )
    }

    const body = await c.req.parseBody()
    const turnstileToken =
      typeof body['cf-turnstile-response'] === 'string' ? body['cf-turnstile-response'] : undefined
    if (!(await verifyTurnstile(c.env, turnstileToken, ip))) {
      await writeAuditLog(c.env.DB, { action: 'login.turnstile_failed', ip })
      return c.html(
        <AdminLoginPage
          {...c.get('adminSite')}
          turnstileSiteKey={turnstileSiteKey}
          error="Security check failed. Please try again."
        />,
        403,
      )
    }

    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const user = await verifyUserLogin(c.env, email, password)
    await recordLoginAttempt(c.env.DB, ip, !!user)

    if (!user) {
      await writeAuditLog(c.env.DB, { action: 'login.failed', ip, details: email || undefined })
      return c.html(
        <AdminLoginPage
          {...c.get('adminSite')}
          turnstileSiteKey={turnstileSiteKey}
          error="Invalid email or password."
        />,
        401,
      )
    }

    const sessionVersion = await getSessionVersion(c.env.DB, user.id)
    const csrf = generateCsrfToken()
    const token = await createSessionToken(user.id, c.env, { sessionVersion, csrf })
    await writeAuditLog(c.env.DB, { userId: user.id, action: 'login.success', ip })
    c.header('Set-Cookie', sessionCookieHeader(token, secure(c)))
    return c.redirect('/admin', 303)
  })

  app.post('/admin/logout', async (c) => {
    const ctx = c.get('adminCtx')
    if (ctx) {
      await writeAuditLog(c.env.DB, {
        userId: ctx.user.id,
        action: 'logout',
        ip: clientIp(c.req.raw.headers),
      })
    }
    c.header('Set-Cookie', clearSessionCookieHeader(secure(c)))
    return c.redirect('/admin/login', 303)
  })

  app.get('/admin', async (c) => {
    await seedAdminIfNeeded(c.env)
    const ctx = getAdminCtx(c)
    return c.html(<AdminHomePage {...c.get('adminSite')} ctx={ctx} />)
  })

  app.get('/admin/assets', async (c) => {
    const ctx = getAdminCtx(c)

    const allAssets = await listIndexedAssets(c.env.DB)
    const filterType = parseAssetType(c.req.query('type'))
    const typeCounts = countAssetsByType(allAssets)
    const assets = filterType ? allAssets.filter((asset) => asset.type === filterType) : allAssets
    const flash =
      c.req.query('ok') === '1'
        ? 'Asset updated.'
        : c.req.query('uploaded') === '1'
          ? 'Asset uploaded.'
        : c.req.query('deleted') === '1'
          ? 'Library asset deleted.'
          : undefined

    return c.html(
      <AdminAssetsPage
        {...c.get('adminSite')}
        ctx={ctx}
        assets={assets}
        typeCounts={typeCounts}
        totalCount={allAssets.length}
        filterType={filterType}
        flash={flash}
        error={c.req.query('error') || undefined}
      />,
    )
  })

  app.post('/admin/assets/upload', async (c) => {
    getAdminCtx(c)
    const body = await c.req.parseBody()
    const file = body.file
    const label = typeof body.label === 'string' ? body.label : undefined

    if (!(file instanceof File)) {
      return c.redirect('/admin/assets?error=' + encodeURIComponent('Choose a file to upload.'), 303)
    }

    const result = await uploadLibraryAsset(c.env.R2, c.env.DB, file, { label })
    if (!result.ok) {
      return c.redirect('/admin/assets?error=' + encodeURIComponent(result.error), 303)
    }

    return c.redirect('/admin/assets?type=library&uploaded=1', 303)
  })

  app.post('/admin/api/assets/upload', async (c) => {
    getAdminCtx(c)
    const body = await c.req.parseBody()
    const file = body.file
    const label = typeof body.label === 'string' ? body.label : undefined
    const expectedKind = body.kind === 'pdf' ? 'pdf' : 'image'

    if (!(file instanceof File)) {
      return c.json({ ok: false, error: 'Choose a file to upload.' }, 400)
    }

    const result = await uploadLibraryAsset(c.env.R2, c.env.DB, file, {
      label,
      expectedKind,
    })

    if (!result.ok) {
      return c.json({ ok: false, error: result.error }, 400)
    }

    return c.json({ ok: true, asset: result.asset })
  })

  app.post('/admin/assets/manage', async (c) => {
    getAdminCtx(c)
    const body = await c.req.parseBody()
    const { type, entityId, currentKey, returnType } = parseAssetManageRequest(body)

    const redirectBase = returnType ? `/admin/assets?type=${returnType}` : '/admin/assets'
    const redirectWithQuery = (query: string) =>
      redirectBase.includes('?') ? `${redirectBase}&${query}` : `${redirectBase}?${query}`

    if (!type || !entityId) {
      return c.redirect(redirectWithQuery(`error=${encodeURIComponent('Invalid asset.')}`), 303)
    }

    const result = await applyAssetManage(c.env.R2, c.env.DB, type, entityId, currentKey, body)
    if (!result.ok) {
      return c.redirect(redirectWithQuery(`error=${encodeURIComponent(result.error)}`), 303)
    }

    return c.redirect(redirectWithQuery('ok=1'), 303)
  })

  app.post('/admin/assets/library/:id/delete', async (c) => {
    getAdminCtx(c)
    const key = await deleteLibraryAsset(c.env.DB, c.req.param('id'))
    if (key) await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, key)
    return c.redirect('/admin/assets?type=library&deleted=1', 303)
  })

  app.get('/admin/api/assets', async (c) => {
    const ctx = getAdminCtx(c)

    const kind = c.req.query('kind') === 'pdf' ? 'pdf' : 'image'
    const allAssets = await listIndexedAssets(c.env.DB)
    const assets = dedupeAssetsByKey(filterAssetsByKind(allAssets, kind)).map((asset) => ({
      key: asset.key,
      label: asset.label,
      type: asset.type,
      url: getAssetUrl(asset.key),
    }))

    return c.json({ assets })
  })

  app.get('/admin/api/geocode', async (c) => {
    const ctx = getAdminCtx(c)

    const address = c.req.query('address')?.trim() ?? ''
    if (!address) return c.json({ ok: false, candidates: [] })

    const suggest = c.req.query('suggest') === '1'
    if (suggest) {
      const candidates = await geocodeClarkCountyAddressCandidates(address).catch(() => [])
      return c.json({
        ok: candidates.length > 0,
        candidates: candidates.map((candidate) => ({
          latitude: candidate.lat,
          longitude: candidate.lng,
          formatted: candidate.formatted,
          score: candidate.score,
        })),
      })
    }

    const result = await geocodeClarkCountyAddress(address).catch(() => null)
    if (!result) return c.json({ ok: false, candidates: [] })

    return c.json({
      ok: true,
      latitude: result.lat,
      longitude: result.lng,
      formatted: result.formatted,
      candidates: [
        {
          latitude: result.lat,
          longitude: result.lng,
          formatted: result.formatted,
          score: result.score,
        },
      ],
    })
  })

  app.get('/admin/users', async (c) => {
    const ctx = getAdminCtx(c)
    const users = await listUsers(c.env.DB)
    const message =
      c.req.query('ok') === '1'
        ? 'User created.'
        : c.req.query('password') === '1'
          ? 'Password updated.'
          : c.req.query('deleted') === '1'
            ? 'User deleted.'
            : undefined
    return c.html(
      <AdminUsersPage
        {...c.get('adminSite')}
        ctx={ctx}
        users={users}
        message={message}
        error={c.req.query('error') || undefined}
      />,
    )
  })

  app.post('/admin/users', async (c) => {
    const ctx = getAdminCtx(c)

    const body = await c.req.parseBody()
    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const display_name = typeof body.display_name === 'string' ? body.display_name.trim() : ''

    if (!email || password.length < 10) {
      const users = await listUsers(c.env.DB)
      return c.html(
        <AdminUsersPage
          {...c.get('adminSite')}
          ctx={ctx}
          users={users}
          error="Email and password (10+ characters) are required."
        />,
      )
    }

    const userId = await createUser(c.env.DB, email, password, {
      display_name: display_name || undefined,
    })
    await writeAuditLog(c.env.DB, {
      userId: ctx.user.id,
      action: 'user.create',
      resource: 'users',
      resourceId: userId,
      ip: clientIp(c.req.raw.headers),
      details: email,
    })

    return c.redirect('/admin/users?ok=1', 303)
  })

  app.post('/admin/users/:id/password', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const password = typeof body.password === 'string' ? body.password : ''
    if (password.length < 10) {
      return c.redirect(
        '/admin/users?error=' + encodeURIComponent('Password must be at least 10 characters.'),
        303,
      )
    }
    const id = c.req.param('id')
    await changeUserPassword(c.env.DB, id, password)
    await writeAuditLog(c.env.DB, {
      userId: ctx.user.id,
      action: 'user.password_reset',
      resource: 'users',
      resourceId: id,
      ip: clientIp(c.req.raw.headers),
    })
    return c.redirect('/admin/users?password=1', 303)
  })

  app.post('/admin/users/:id/delete', async (c) => {
    const ctx = getAdminCtx(c)
    const id = c.req.param('id')
    if (id === ctx.user.id) {
      return c.redirect(
        '/admin/users?error=' + encodeURIComponent('You cannot delete your own account.'),
        303,
      )
    }
    await deleteUser(c.env.DB, id)
    await writeAuditLog(c.env.DB, {
      userId: ctx.user.id,
      action: 'user.delete',
      resource: 'users',
      resourceId: id,
      ip: clientIp(c.req.raw.headers),
    })
    return c.redirect('/admin/users?deleted=1', 303)
  })

  app.get('/admin/profile', async (c) => {
    const ctx = getAdminCtx(c)
    return c.html(
      <AdminProfilePage
        {...c.get('adminSite')}
        ctx={ctx}
        flash={c.req.query('ok') === '1' ? 'Password updated.' : undefined}
        error={c.req.query('error') || undefined}
      />,
    )
  })

  app.post('/admin/profile/password', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const current = typeof body.current_password === 'string' ? body.current_password : ''
    const next = typeof body.new_password === 'string' ? body.new_password : ''
    const confirm = typeof body.confirm_password === 'string' ? body.confirm_password : ''

    if (next.length < 10) {
      return c.redirect(
        '/admin/profile?error=' + encodeURIComponent('New password must be at least 10 characters.'),
        303,
      )
    }
    if (next !== confirm) {
      return c.redirect(
        '/admin/profile?error=' + encodeURIComponent('New password and confirmation do not match.'),
        303,
      )
    }
    const ok = await verifyUserPassword(c.env.DB, ctx.user.id, current)
    if (!ok) {
      return c.redirect(
        '/admin/profile?error=' + encodeURIComponent('Current password is incorrect.'),
        303,
      )
    }

    await changeUserPassword(c.env.DB, ctx.user.id, next)
    const sessionVersion = await getSessionVersion(c.env.DB, ctx.user.id)
    const csrf = generateCsrfToken()
    const token = await createSessionToken(ctx.user.id, c.env, { sessionVersion, csrf })
    await writeAuditLog(c.env.DB, {
      userId: ctx.user.id,
      action: 'user.password_change',
      resource: 'users',
      resourceId: ctx.user.id,
      ip: clientIp(c.req.raw.headers),
    })
    c.header('Set-Cookie', sessionCookieHeader(token, secure(c)))
    return c.redirect('/admin/profile?ok=1', 303)
  })

  app.get('/admin/members', async (c) => {
    const ctx = getAdminCtx(c)
    const [members, membershipTypes] = await Promise.all([
      listMembersForAdmin(c.env.DB),
      listMembershipTypes(c.env.DB),
    ])
    const flash =
      c.req.query('ok') === '1'
        ? 'Member saved.'
        : c.req.query('created') === '1'
          ? 'Member added.'
          : undefined
    return c.html(
      <AdminMembersPage
        {...c.get('adminSite')}
        ctx={ctx}
        members={members}
        membershipTypes={membershipTypes}
        flash={flash}
      />,
    )
  })

  app.post('/admin/members', async (c) => {
    const ctx = getAdminCtx(c)

    const body = await c.req.parseBody()
    const membershipTypes = await listMembershipTypes(c.env.DB)
    const allowedKeys = membershipTypes.map((t) => t.key)
    const data = parseMemberFormBody(body, allowedKeys)
    if (!data.company_name) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          {...c.get('adminSite')}
          ctx={ctx}
          members={members}
          membershipTypes={membershipTypes}
          error="Company name is required."
        />,
      )
    }

    const memberId = await createMember(c.env.DB, data)
    const logoError = await applyMemberLogoChange(
      c.env.R2,
      c.env.DB,
      (id, key) => updateMemberLogoKey(c.env.DB, id, key),
      memberId,
      body,
    )
    if (logoError) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          {...c.get('adminSite')}
          ctx={ctx}
          members={members}
          membershipTypes={membershipTypes}
          error={`Member added, but logo upload failed: ${logoError}`}
        />,
      )
    }

    return c.redirect('/admin/members?created=1', 303)
  })

  app.post('/admin/members/:id', async (c) => {
    const ctx = getAdminCtx(c)

    const id = c.req.param('id')
    const body = await c.req.parseBody()
    const membershipTypes = await listMembershipTypes(c.env.DB)
    const allowedKeys = membershipTypes.map((t) => t.key)
    const data = parseMemberFormBody(body, allowedKeys)
    if (!data.company_name) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          {...c.get('adminSite')}
          ctx={ctx}
          members={members}
          membershipTypes={membershipTypes}
          error="Company name is required."
        />,
      )
    }

    await updateMember(c.env.DB, id, data)
    const previousKey = await getMemberLogoR2Key(c.env.DB, id)
    const logoError = await applyMemberLogoChange(
      c.env.R2,
      c.env.DB,
      (memberId, key) => updateMemberLogoKey(c.env.DB, memberId, key),
      id,
      body,
      previousKey,
    )
    if (logoError) {
      const members = await listMembersForAdmin(c.env.DB)
      return c.html(
        <AdminMembersPage
          {...c.get('adminSite')}
          ctx={ctx}
          members={members}
          membershipTypes={membershipTypes}
          error={`Member saved, but logo upload failed: ${logoError}`}
        />,
      )
    }

    return c.redirect('/admin/members?ok=1', 303)
  })

  app.get('/admin/events', async (c) => {
    const ctx = getAdminCtx(c)
    const events = await listAllEventsForAdmin(c.env.DB)
    const committees = await listCommittees(c.env.DB)
    const flash =
      c.req.query('ok') === '1'
        ? 'Event saved.'
        : c.req.query('created') === '1'
          ? 'Event published.'
          : undefined
    return c.html(
      <AdminEventsPage
        {...c.get('adminSite')}
        ctx={ctx}
        events={events}
        committees={committees}
        flash={flash}
      />,
    )
  })

  app.post('/admin/events', async (c) => {
    const ctx = getAdminCtx(c)

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
    const rsvp_enabled = body.rsvp_enabled === '1'
    const registration_limit = parseRegistrationLimit(body.registration_limit)
    const repeat_rule = parseRepeatRule(typeof body.repeat_rule === 'string' ? body.repeat_rule : '')
    const repeat_until = parseRepeatUntil(typeof body.repeat_until === 'string' ? body.repeat_until : '')
    const committee_key = await resolveEventCommitteeKey(c.env.DB, body.committee_key)
    const coords = await resolveEventFormCoordinates(location || null, {
      manual: parseManualCoordinates(body.latitude, body.longitude),
      skipMap: body.map_skip === '1',
    })

    const id = await createEvent(c.env.DB, {
      title,
      starts_at,
      ends_at: ends_at ?? undefined,
      location: location || undefined,
      description: description || undefined,
      registration_url: registration_url || undefined,
      rsvp_enabled,
      registration_limit,
      repeat_rule,
      repeat_until,
      committee_key,
      latitude: coords.latitude,
      longitude: coords.longitude,
    })

    const images = await applyEventImageUploads(c.env.R2, c.env.DB, id, body)
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
        rsvp_enabled,
        registration_limit,
        published: true,
        repeat_rule,
        repeat_until,
        committee_key,
        thumbnail_r2_key: images.thumbnail_r2_key,
        flyer_r2_key: images.flyer_r2_key,
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
    }

    return c.redirect('/admin/events?created=1', 303)
  })

  app.post('/admin/events/:id', async (c) => {
    const ctx = getAdminCtx(c)

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
    const rsvp_enabled = body.rsvp_enabled === '1'
    const registration_limit = parseRegistrationLimit(body.registration_limit)
    const repeat_rule = parseRepeatRule(typeof body.repeat_rule === 'string' ? body.repeat_rule : '')
    const repeat_until = parseRepeatUntil(typeof body.repeat_until === 'string' ? body.repeat_until : '')
    const committee_key = await resolveEventCommitteeKey(c.env.DB, body.committee_key)
    const coords = await resolveEventFormCoordinates(location || null, {
      existing,
      manual: parseManualCoordinates(body.latitude, body.longitude),
      skipMap: body.map_skip === '1',
    })
    const images = await applyEventImageUploads(c.env.R2, c.env.DB, id, body, existing)
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
      rsvp_enabled,
      registration_limit,
      published: body.published === '1',
      repeat_rule,
      repeat_until,
      committee_key,
      thumbnail_r2_key: images.thumbnail_r2_key,
      flyer_r2_key: images.flyer_r2_key,
      latitude: coords.latitude,
      longitude: coords.longitude,
    })

    return c.redirect('/admin/events?ok=1', 303)
  })

  app.get('/admin/events/:id/rsvps', async (c) => {
    const ctx = getAdminCtx(c)
    const event = await getEventById(c.env.DB, c.req.param('id'))
    if (!event) return c.redirect('/admin/events', 303)
    const rsvps = await listEventRsvps(c.env.DB, event.id)
    const flash = c.req.query('ok') === '1' ? 'RSVP list updated.' : undefined
    return c.html(
      <AdminEventRsvpsPage {...c.get('adminSite')} ctx={ctx} event={event} rsvps={rsvps} flash={flash} />,
    )
  })

  app.get('/admin/events/:id/rsvps/export', async (c) => {
    const ctx = getAdminCtx(c)
    const event = await getEventById(c.env.DB, c.req.param('id'))
    if (!event) return c.redirect('/admin/events', 303)
    const rsvps = await listEventRsvps(c.env.DB, event.id)
    await writeAuditLog(c.env.DB, {
      action: 'event_rsvps.export',
      resource: 'event_rsvps',
      resourceId: event.id,
      userId: ctx.user.id,
      details: `${rsvps.length} rsvps`,
      ip: clientIp(c.req.raw.headers),
    })
    const filename = eventRsvpsExportFilename(event.title)
    const csv = buildEventRsvpsCsv(rsvps)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  })

  app.post('/admin/events/:id/rsvps/:rsvpId/delete', async (c) => {
    getAdminCtx(c)
    const eventId = c.req.param('id')
    const event = await getEventById(c.env.DB, eventId)
    if (!event) return c.redirect('/admin/events', 303)
    await deleteEventRsvp(c.env.DB, c.req.param('rsvpId'))
    return c.redirect(`/admin/events/${eventId}/rsvps?ok=1`, 303)
  })

  app.post('/admin/events/:id/delete', async (c) => {
    const ctx = getAdminCtx(c)
    const id = c.req.param('id')
    const existing = await getEventById(c.env.DB, id)
    if (existing) await deleteEventAssets(c.env.R2, c.env.DB, existing)
    await deleteEvent(c.env.DB, id)
    return c.redirect('/admin/events?ok=1', 303)
  })
}
