import { Hono, type Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { MemberType } from './data/demo'
import { parseThemeId, type ThemeId } from './config/themes'
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
} from './lib/events'
import { listLeadership } from './lib/leadership-db'
import {
  getActiveMemberPublicProfile,
  listActiveMemberSummaries,
} from './lib/members'
import { committeePageSlug } from './lib/chair-pages'
import { parseCommitteeKey } from './lib/committee-pages'
import { getPageBySlug } from './lib/pages-db'
import { getPostBySlug, listPublishedPosts } from './lib/posts-db'
import { listQaItems } from './lib/qa-db'
import { listResourceItems } from './lib/resource-items-db'
import { getAssetObject } from './lib/r2-assets'
import { subscribeNewsletter } from './lib/newsletter-db'
import { loadPublicSiteContext } from './lib/site-context'
import { seedContentIfEmpty, seedDemoMembersIfEmpty, seedDirtIfEmpty } from './lib/seed'
import { THEME_COOKIE } from './lib/theme'
import { registerAdminRoutes } from './routes/admin'
import { CommitteesPage } from './pages/Committees'
import { CommitteeDetailPage } from './pages/CommitteeDetail'
import { ContentPage } from './pages/ContentPage'
import { ContactPage, ContactErrorPage, ContactThanksPage } from './pages/Contact'
import { EventDetailPage, EventNotFoundPage } from './pages/EventDetail'
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

type Variables = { theme: ThemeId }

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.onError((err, c) => {
  console.error(err)
  return c.text('Internal Server Error', 500)
})

async function ensureSeeded(env: Env) {
  await seedContentIfEmpty(env)
  await seedDirtIfEmpty(env)
}

async function siteProps(c: Context<{ Bindings: Env; Variables: Variables }>) {
  await ensureSeeded(c.env)
  return loadPublicSiteContext(c.env, getCookie(c, THEME_COOKIE))
}

app.post('/theme', async (c) => {
  const body = await c.req.parseBody()
  const id = parseThemeId(typeof body.theme === 'string' ? body.theme : undefined)
  setCookie(c, THEME_COOKIE, id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'Lax',
    httpOnly: true,
  })
  const referer = c.req.header('Referer')
  return c.redirect(referer && referer.startsWith('http') ? referer : '/', 303)
})

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

registerAdminRoutes(app)

app.get('/', async (c) => {
  const site = await siteProps(c)
  const [events, dirtReleases, posts] = await Promise.all([
    listUpcomingEvents(c.env.DB, 3),
    listDirtReleases(c.env.DB, true),
    listPublishedPosts(c.env.DB),
  ])
  return c.html(
    <HomePage {...site} events={events} dirtReleases={dirtReleases} posts={posts} />,
  )
})

app.get('/about', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'about', true)
  if (!page) return c.html(<NotFoundPage {...site} />, 404)
  return c.html(<ContentPage {...site} page={page} />)
})

app.get('/about/q-and-a', async (c) => {
  const site = await siteProps(c)
  const items = await listQaItems(c.env.DB, true)
  return c.html(<QaPage {...site} items={items} />)
})

app.get('/about/leadership', async (c) => {
  const site = await siteProps(c)
  const leaders = await listLeadership(c.env.DB, true)
  return c.html(<LeadershipPage {...site} leaders={leaders} />)
})

app.get('/about/committees', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'committees', true)
  return c.html(<CommitteesPage {...site} page={page} />)
})

app.get('/about/committees/:key', async (c) => {
  const site = await siteProps(c)
  const committeeKey = parseCommitteeKey(c.req.param('key'))
  if (!committeeKey) return c.html(<NotFoundPage {...site} />, 404)
  const page = await getPageBySlug(c.env.DB, committeePageSlug(committeeKey), true)
  if (!page) return c.html(<NotFoundPage {...site} />, 404)
  return c.html(<CommitteeDetailPage {...site} committeeKey={committeeKey} page={page} />)
})

app.get('/the-dirt', async (c) => {
  const site = await siteProps(c)
  const [posts, releases] = await Promise.all([
    listPublishedPosts(c.env.DB),
    listDirtReleases(c.env.DB, true),
  ])
  return c.html(<TheDirtArchivePage {...site} posts={posts} releases={releases} />)
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
  return c.html(<ContentPage {...site} page={page} />)
})

app.get('/scholarships', async (c) => {
  const site = await siteProps(c)
  const page = await getPageBySlug(c.env.DB, 'scholarships', true)
  if (!page) return c.html(<NotFoundPage {...site} />, 404)
  return c.html(<ContentPage {...site} page={page} />)
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
  return c.html(<ResourcesPage {...site} page={page} items={items} />)
})

app.get('/api/members/:id', async (c) => {
  const profile = await getActiveMemberPublicProfile(c.env.DB, c.req.param('id'))
  if (!profile) return c.json({ error: 'Not found' }, 404)
  return c.json(profile)
})

app.get('/members', async (c) => {
  await seedDemoMembersIfEmpty(c.env)
  const site = await siteProps(c)
  const members = await listActiveMemberSummaries(c.env.DB)
  const type = c.req.query('type')
  const valid: MemberType[] = ['contractor', 'associate', 'institutional']
  const filter = valid.includes(type as MemberType) ? (type as MemberType) : undefined
  return c.html(<MembersPage {...site} members={members} filter={filter} />)
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
  const committeeKey = parseCommitteeKey(c.req.query('committee') ?? '') ?? null

  const [totalEvents, calendarEvents] = await Promise.all([
    countUpcomingEvents(c.env.DB, committeeKey),
    listPublishedEventsForCalendar(c.env.DB, committeeKey),
  ])
  const totalPages = Math.max(1, Math.ceil(totalEvents / EVENTS_LIST_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const events = await listUpcomingEventsPage(c.env.DB, safePage, EVENTS_LIST_PAGE_SIZE, committeeKey)

  return c.html(
    <EventsPage
      {...site}
      events={events}
      calendarEvents={calendarEvents}
      view={view}
      page={safePage}
      totalPages={totalPages}
      totalEvents={totalEvents}
      focusDate={focusDate}
      committeeKey={committeeKey}
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

  return c.html(<EventDetailPage {...site} occurrence={occurrence} />)
})

app.get('/advocacy', (c) => c.redirect('/about/committees', 301))

app.get('/join', async (c) => {
  const site = await siteProps(c)
  return c.html(<JoinPage {...site} />)
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
  return c.html(<ContactPage {...site} />)
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

app.notFound(async (c) => {
  const site = await siteProps(c)
  return c.html(<NotFoundPage {...site} />, 404)
})

export default app
