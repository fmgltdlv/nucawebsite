import { Hono, type Context } from 'hono'
import type { ThemeId } from './config/themes'
import type { Env } from './env'
import { createApplication } from './lib/applications-db'
import { createContactSubmission } from './lib/contact-db'
import { getDirtRelease, listDirtReleases } from './lib/dirt-db'
import { sendContactMessage, notifyStaffOfApplication } from './lib/email'
import {
  countUpcomingEvents,
  EVENTS_LIST_PAGE_SIZE,
  listPublishedEventsForCalendar,
  listUpcomingEvents,
  listUpcomingEventsPage,
  getPublishedEventById,
  resolveEventOccurrence,
  eventPublicHref,
} from './lib/events'
import { countEventRsvps, createEventRsvp, parseRsvpQuantity } from './lib/event-rsvps'
import { listLeadership } from './lib/leadership-db'
import {
  getActiveMemberPublicProfile,
  listActiveMemberSummaries,
} from './lib/members'
import { committeePageSlug, parseCommitteeKey } from './lib/committee-pages'
import { getCommitteeByKey, listCommittees } from './lib/committees-db'
import { loadPageCalendarEvents } from './lib/cms-page-extras'
import { getPageBySlug, isCustomPage } from './lib/pages-db'
import { getPostBySlug, listPublishedPosts } from './lib/posts-db'
import { listQaItems } from './lib/qa-db'
import { listResourceItems } from './lib/resource-items-db'
import { listMembershipTypes } from './lib/membership-types-db'
import { getMemberGridLogoSize } from './lib/site-settings'
import { getAssetObject } from './lib/r2-assets'
import { subscribeNewsletter } from './lib/newsletter-db'
import { loadAdminLayoutProps, loadPublicSiteContext, type AdminLayoutProps } from './lib/site-context'
import { resolveAdminContext } from './lib/admin-context'
import { adminAuthMiddleware, adminCsrfMiddleware } from './lib/admin-guard'
import { assertSafeSecrets, isProductionRequest } from './lib/security/env-check'
import { applySecurityHeaders } from './lib/security/headers'
import { totalInboxCount } from './lib/admin-inbox-counts'
import { seedContentIfEmpty, seedDemoMembersIfEmpty, seedDirtIfEmpty } from './lib/seed'
import { registerAdminRoutes } from './routes/admin'
import { CommitteesPage } from './pages/Committees'
import { CommitteeDetailPage } from './pages/CommitteeDetail'
import { ContentPage } from './pages/ContentPage'
import { ContactPage, ContactErrorPage, ContactThanksPage } from './pages/Contact'
import { EventDetailPage, EventNotFoundPage, EventRsvpThanksPage } from './pages/EventDetail'
import { EventsPage, type EventsView } from './pages/Events'
import { HomePage } from './pages/Home'
import { IndustryUpdateDetailPage } from './pages/IndustryUpdates'
import { JoinPage, JoinThanksPage } from './pages/Join'
import { MembersPage } from './pages/Members'
import { LeadershipPage } from './pages/Leadership'
import { QaPage } from './pages/Qa'
import { ResourcesPage } from './pages/Resources'
import { TheDirtArchivePage } from './pages/TheDirt'
import { TheDirtNotFoundPage, TheDirtViewerPage } from './pages/TheDirtViewer'
import { NewsletterErrorPage, NewsletterThanksPage } from './pages/Newsletter'
import { NotFoundPage } from './pages/NotFound'

type Variables = { theme: ThemeId; adminSite: AdminLayoutProps; adminCtx: import('./lib/admin-context').AdminContext | null }

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.onError((err, c) => {
  console.error(err)
  return c.text('Internal Server Error', 500)
})

app.use('*', async (c, next) => {
  assertSafeSecrets(c.env, isProductionRequest(new URL(c.req.url)))
  await next()
  applySecurityHeaders(c, c.res.headers)
})

async function ensureSeeded(env: Env) {
  await seedContentIfEmpty(env)
  await seedDirtIfEmpty(env)
}

async function siteProps(c: Context<{ Bindings: Env; Variables: Variables }>) {
  await ensureSeeded(c.env)
  const site = await loadPublicSiteContext(c.env)
  const adminCtx = await resolveAdminContext(c)
  const total = adminCtx?.inboxCounts ? totalInboxCount(adminCtx.inboxCounts) : 0
  return {
    ...site,
    staffInboxCount: total > 0 ? total : undefined,
  }
}

app.get('/assets/*', async (c) => {
  const key = c.req.path.replace(/^\/assets\//, '')
  if (!key) return c.notFound()
  const object = await getAssetObject(c.env.R2, key)
  if (!object) return c.notFound()
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'public, max-age=86400')
  return new Response(object.body, { headers })
})

app.use(async (c, next) => {
  if (!c.req.path.startsWith('/admin')) return next()
  const ctx = await resolveAdminContext(c)
  const adminSite = await loadAdminLayoutProps(c.env, ctx?.inboxCounts)
  c.set('theme', adminSite.theme)
  c.set('adminSite', adminSite)
  await next()
})

app.use(adminAuthMiddleware())
app.use(adminCsrfMiddleware())

registerAdminRoutes(app)

app.get('/', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'home', true)
  const [events, dirtReleases, posts, calendarEvents] = await Promise.all([
    listUpcomingEvents(c.env.DB, 12),
    listDirtReleases(c.env.DB, true),
    listPublishedPosts(c.env.DB),
    loadPageCalendarEvents(c.env.DB, page?.body_json),
  ])
  return c.html(
    <HomePage
      {...site}
      page={page}
      events={events}
      dirtReleases={dirtReleases}
      posts={posts}
      calendarEvents={calendarEvents}
    />,
  )
})

app.get('/about', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'about', true)
  if (!page) return c.html(<NotFoundPage {...site} />, 404)
  const calendarEvents = await loadPageCalendarEvents(c.env.DB, page.body_json)
  return c.html(<ContentPage {...site} page={page} calendarEvents={calendarEvents} />)
})

app.get('/about/faq', async (c) => {
  const site = await siteProps(c)
  const [page, items] = await Promise.all([
    getPageBySlug(c.env.DB, 'faq', true),
    listQaItems(c.env.DB, true),
  ])
  return c.html(<QaPage {...site} page={page} items={items} />)
})

app.get('/about/q-and-a', (c) => c.redirect('/about/faq', 301))

app.get('/about/leadership', async (c) => {
  const site = await siteProps(c)
  const [page, leaders] = await Promise.all([
    getPageBySlug(c.env.DB, 'leadership', true),
    listLeadership(c.env.DB, true),
  ])
  return c.html(<LeadershipPage {...site} page={page} leaders={leaders} />)
})

app.get('/about/committees', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'committees', true)
  const committees = await listCommittees(c.env.DB, true)
  const calendarEvents = page
    ? await loadPageCalendarEvents(c.env.DB, page.body_json)
    : undefined
  return c.html(
    <CommitteesPage {...site} page={page} calendarEvents={calendarEvents} committees={committees} />,
  )
})

app.get('/about/committees/:key', async (c) => {
  const site = await siteProps(c)
  const committeeKey = parseCommitteeKey(c.req.param('key'))
  if (!committeeKey) return c.html(<NotFoundPage {...site} />, 404)
  const committee = await getCommitteeByKey(c.env.DB, committeeKey, true)
  if (!committee) return c.html(<NotFoundPage {...site} />, 404)
  const page = await getPageBySlug(c.env.DB, committeePageSlug(committeeKey), true)
  if (!page) return c.html(<NotFoundPage {...site} />, 404)
  const calendarEvents = await loadPageCalendarEvents(c.env.DB, page.body_json)
  return c.html(
    <CommitteeDetailPage
      {...site}
      committee={committee}
      page={page}
      calendarEvents={calendarEvents}
    />,
  )
})

app.get('/the-dirt', async (c) => {
  const site = await siteProps(c)
  const listPage = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1)
  const [page, posts, releases] = await Promise.all([
    getPageBySlug(c.env.DB, 'the-dirt', true),
    listPublishedPosts(c.env.DB),
    listDirtReleases(c.env.DB, true),
  ])
  return c.html(
    <TheDirtArchivePage
      {...site}
      page={page}
      posts={posts}
      releases={releases}
      listPage={listPage}
    />,
  )
})

app.get('/about/the-dirt', (c) => c.redirect('/the-dirt', 301))

app.get('/about/the-dirt/:id', async (c) => {
  const site = await siteProps(c)
  const release = await getDirtRelease(c.env.DB, c.req.param('id'))
  if (!release || release.published !== 1) {
    return c.html(<TheDirtNotFoundPage {...site} />, 404)
  }
  return c.html(<TheDirtViewerPage {...site} release={release} />)
})

app.get('/training', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'training', true)
  if (!page) return c.html(<NotFoundPage {...site} />, 404)
  const calendarEvents = await loadPageCalendarEvents(c.env.DB, page.body_json)
  return c.html(<ContentPage {...site} page={page} calendarEvents={calendarEvents} />)
})

app.get('/scholarships', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'scholarships', true)
  if (!page) return c.html(<NotFoundPage {...site} />, 404)
  const calendarEvents = await loadPageCalendarEvents(c.env.DB, page.body_json)
  return c.html(<ContentPage {...site} page={page} calendarEvents={calendarEvents} />)
})

app.get('/industry-updates', (c) => c.redirect('/the-dirt', 301))

app.get('/industry-updates/:slug', async (c) => {
  const site = await siteProps(c)
  const post = await getPostBySlug(c.env.DB, c.req.param('slug'))
  if (!post) return c.html(<NotFoundPage {...site} />, 404)
  return c.html(<IndustryUpdateDetailPage {...site} post={post} />)
})

app.get('/resources', async (c) => {
  const site = await siteProps(c)
  const [page, items] = await Promise.all([
    getPageBySlug(c.env.DB, 'resources', true),
    listResourceItems(c.env.DB, true),
  ])
  const calendarEvents = page
    ? await loadPageCalendarEvents(c.env.DB, page.body_json)
    : undefined
  return c.html(
    <ResourcesPage {...site} page={page} items={items} calendarEvents={calendarEvents} />,
  )
})

app.get('/api/members/:id', async (c) => {
  const profile = await getActiveMemberPublicProfile(c.env.DB, c.req.param('id'))
  if (!profile) return c.json({ error: 'Not found' }, 404)
  return c.json(profile)
})

app.get('/members', async (c) => {
  await seedDemoMembersIfEmpty(c.env)
  const site = await siteProps(c)
  const [members, membershipTypes, memberGridLogoSize] = await Promise.all([
    listActiveMemberSummaries(c.env.DB),
    listMembershipTypes(c.env.DB, true),
    getMemberGridLogoSize(c.env.DB),
  ])
  const type = c.req.query('type')
  const valid = new Set(membershipTypes.map((t) => t.key))
  const filter = type && valid.has(type) ? type : undefined
  return c.html(
    <MembersPage
      {...site}
      members={members}
      filter={filter}
      membershipTypes={membershipTypes}
      memberGridLogoSize={memberGridLogoSize}
    />,
  )
})

function parseEventsView(value: string | undefined): EventsView {
  if (value === 'week' || value === 'month') return value
  return 'list'
}

function parseEventsFocusDate(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

app.get('/events', async (c) => {
  const site = await siteProps(c)
  const view = parseEventsView(c.req.query('view'))
  const focusDate = parseEventsFocusDate(c.req.query('date'))
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1)
  const committeeParam = c.req.query('committee') ?? ''
  const parsedCommitteeKey = parseCommitteeKey(committeeParam)
  let committeeKey: string | null = null
  if (parsedCommitteeKey) {
    const committee = await getCommitteeByKey(c.env.DB, parsedCommitteeKey, true)
    committeeKey = committee ? committee.key : null
  }

  const [cmsPage, totalEvents, calendarEvents, committees] = await Promise.all([
    getPageBySlug(c.env.DB, 'events', true),
    countUpcomingEvents(c.env.DB, committeeKey),
    listPublishedEventsForCalendar(c.env.DB),
    listCommittees(c.env.DB, true),
  ])
  const totalPages = Math.max(1, Math.ceil(totalEvents / EVENTS_LIST_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const events = await listUpcomingEventsPage(c.env.DB, safePage, EVENTS_LIST_PAGE_SIZE, committeeKey)

  return c.html(
    <EventsPage
      {...site}
      cmsPage={cmsPage}
      events={events}
      calendarEvents={calendarEvents}
      view={view}
      page={safePage}
      totalPages={totalPages}
      totalEvents={totalEvents}
      focusDate={focusDate}
      committeeKey={committeeKey}
      committees={committees}
    />,
  )
})

app.get('/events/:id', async (c) => {
  const site = await siteProps(c)
  const master = await getPublishedEventById(c.env.DB, c.req.param('id'))
  if (!master) return c.html(<EventNotFoundPage {...site} />, 404)

  const at = c.req.query('at')
  const occurrence = resolveEventOccurrence(master, at)
  if (!occurrence) return c.html(<EventNotFoundPage {...site} />, 404)

  const rsvpCount =
    master.rsvp_enabled === 1
      ? await countEventRsvps(c.env.DB, master.id, occurrence.starts_at)
      : 0
  const rsvpError = c.req.query('rsvp_error') || undefined

  return c.html(
    <EventDetailPage {...site} occurrence={occurrence} rsvpCount={rsvpCount} rsvpError={rsvpError} />,
  )
})

app.post('/events/:id/rsvp', async (c) => {
  const site = await siteProps(c)
  const master = await getPublishedEventById(c.env.DB, c.req.param('id'))
  if (!master) return c.html(<EventNotFoundPage {...site} />, 404)

  const body = await c.req.parseBody()
  const occurrenceRaw =
    typeof body.occurrence_starts_at === 'string' ? body.occurrence_starts_at : ''
  const occurrence = resolveEventOccurrence(master, occurrenceRaw || null)
  if (!occurrence) return c.html(<EventNotFoundPage {...site} />, 404)

  const eventHref = eventPublicHref({ series_id: master.id, starts_at: occurrence.starts_at })
  const name = typeof body.name === 'string' ? body.name : ''
  const email = typeof body.email === 'string' ? body.email : ''
  const spotsUsed =
    master.rsvp_enabled === 1 && master.registration_limit != null
      ? await countEventRsvps(c.env.DB, master.id, occurrence.starts_at)
      : 0
  const spotsLeft =
    master.registration_limit != null
      ? Math.max(0, master.registration_limit - spotsUsed)
      : null
  const quantity = parseRsvpQuantity(body.quantity, spotsLeft)
  if (quantity == null) {
    const sep = eventHref.includes('?') ? '&' : '?'
    return c.redirect(`${eventHref}${sep}rsvp_error=invalid`, 303)
  }

  const result = await createEventRsvp(c.env.DB, {
    eventId: master.id,
    occurrenceStartsAt: occurrence.starts_at,
    name,
    email,
    quantity,
    rsvpEnabled: master.rsvp_enabled === 1,
    registrationLimit: master.registration_limit,
  })

  if (!result.ok) {
    const sep = eventHref.includes('?') ? '&' : '?'
    return c.redirect(`${eventHref}${sep}rsvp_error=${encodeURIComponent(result.error)}`, 303)
  }

  return c.html(
    <EventRsvpThanksPage {...site} eventTitle={master.title} eventHref={eventHref} />,
  )
})

app.get('/advocacy', (c) => c.redirect('/about/committees', 301))

app.get('/join', async (c) => {
  const [site, page, committees, membershipTypes] = await Promise.all([
    siteProps(c),
    getPageBySlug(c.env.DB, 'join', true),
    listCommittees(c.env.DB, true),
    listMembershipTypes(c.env.DB, true),
  ])
  return c.html(
    <JoinPage
      {...site}
      page={page}
      committees={committees}
      membershipTypes={membershipTypes}
    />,
  )
})

app.post('/join', async (c) => {
  const site = await siteProps(c)
  const body = await c.req.parseBody()
  const payload: Record<string, string> = {}
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && value.trim()) payload[key] = value.trim()
  }
  const member_type = typeof body.member_type === 'string' ? body.member_type : undefined
  const id = await createApplication(c.env.DB, { member_type, payload })
  const company = payload.company_name || payload.company || 'New application'
  await notifyStaffOfApplication(c.env, id, `Membership application from ${company}.\n\nReview at /admin/applications`)
  return c.html(<JoinThanksPage {...site} />)
})

app.get('/contact', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'contact', true)
  return c.html(<ContactPage {...site} page={page} />)
})

app.post('/contact', async (c) => {
  const site = await siteProps(c)
  const body = await c.req.parseBody()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!name || !email || !message) {
    return c.html(<ContactErrorPage {...site} error="Name, email, and message are required." />)
  }
  try {
    await createContactSubmission(c.env.DB, { name, email, message })
  } catch {
    return c.html(
      <ContactErrorPage {...site} error="Could not save your message. Please try calling the chapter." />,
    )
  }
  await sendContactMessage(c.env, { name, email, message })
  return c.html(<ContactThanksPage {...site} />)
})

app.post('/newsletter/subscribe', async (c) => {
  const site = await siteProps(c)
  const body = await c.req.parseBody()
  const email = typeof body.newsletter_email === 'string' ? body.newsletter_email : ''
  const result = await subscribeNewsletter(c.env.DB, email, 'contact')
  if (!result.ok) return c.html(<NewsletterErrorPage {...site} error={result.error} />)
  return c.html(<NewsletterThanksPage {...site} />)
})

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const page = await getPageBySlug(c.env.DB, slug, true)
  if (!page || !isCustomPage(page)) {
    const site = await siteProps(c)
    return c.html(<NotFoundPage {...site} />, 404)
  }
  const site = await siteProps(c)
  const calendarEvents = await loadPageCalendarEvents(c.env.DB, page.body_json)
  return c.html(<ContentPage {...site} page={page} calendarEvents={calendarEvents} />)
})

app.notFound(async (c) => {
  const site = await siteProps(c)
  return c.html(<NotFoundPage {...site} />, 404)
})

export default app
