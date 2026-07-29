import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import type { MemberType } from './data/demo'
import { parseThemeId, type ThemeId } from './config/themes'
import type { Env } from './env'
import { getDirtRelease } from './data/the-dirt'
import { listActiveMembers } from './lib/members'
import { seedDemoMembersIfEmpty } from './lib/seed'
import { THEME_COOKIE, themeFromRequest } from './lib/theme'
import { registerAdminRoutes } from './routes/admin'
import { AboutPage } from './pages/About'
import { CommitteesPage } from './pages/Committees'
import { ContactPage, ContactThanksPage } from './pages/Contact'
import { EventsPage } from './pages/Events'
import { HomePage } from './pages/Home'
import { JoinPage, JoinThanksPage } from './pages/Join'
import { MembersPage } from './pages/Members'
import { LeadershipPage } from './pages/Leadership'
import { PlaceholderPage } from './pages/Placeholder'
import { QaPage } from './pages/Qa'
import { TheDirtArchivePage } from './pages/TheDirt'
import { TheDirtNotFoundPage, TheDirtViewerPage } from './pages/TheDirtViewer'
import { NewsletterThanksPage } from './pages/Newsletter'
import { NotFoundPage } from './pages/NotFound'

type Variables = { theme: ThemeId }

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.onError((err, c) => {
  console.error(err)
  return c.text('Internal Server Error', 500)
})

app.use('*', async (c, next) => {
  c.set('theme', themeFromRequest(c))
  await next()
})

const theme = (c: { get: (k: 'theme') => ThemeId }) => c.get('theme')

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

registerAdminRoutes(app)

app.get('/', (c) => c.html(<HomePage theme={theme(c)} />))
app.get('/about', (c) => c.html(<AboutPage theme={theme(c)} />))
app.get('/about/q-and-a', (c) => c.html(<QaPage theme={theme(c)} />))
app.get('/about/leadership', (c) => c.html(<LeadershipPage theme={theme(c)} />))
app.get('/about/committees', (c) => c.html(<CommitteesPage theme={theme(c)} />))
app.get('/about/the-dirt', (c) => c.html(<TheDirtArchivePage theme={theme(c)} />))
app.get('/about/the-dirt/:id', (c) => {
  const release = getDirtRelease(c.req.param('id'))
  const t = theme(c)
  if (!release) return c.html(<TheDirtNotFoundPage theme={t} />, 404)
  return c.html(<TheDirtViewerPage release={release} theme={t} />)
})
app.get('/scholarships', (c) =>
  c.html(
    <PlaceholderPage
      theme={theme(c)}
      title="NUCA Las Vegas Scholarships"
      status="todo"
      legacyUrl="https://nucalasvegas.com/nuca-las-vegas-scholarships/"
      notes="Copy scholarship criteria, deadlines, and applications from the live site. Nav groups this under Committees."
    />,
  ),
)
app.get('/industry-updates', (c) =>
  c.html(
    <PlaceholderPage
      theme={theme(c)}
      title="Industry Updates"
      status="todo"
      legacyUrl="https://nucalasvegas.com/industry-updates/"
      notes="This will become a news/blog listing (posts managed in admin, similar to events)."
    />,
  ),
)
app.get('/resources', (c) =>
  c.html(
    <PlaceholderPage
      theme={theme(c)}
      title="Resources"
      status="todo"
      legacyUrl="https://nucalasvegas.com/resources/"
      notes="Copy links, documents, and reference material from the current Resources page."
    />,
  ),
)
app.get('/members', async (c) => {
  await seedDemoMembersIfEmpty(c.env)
  const members = await listActiveMembers(c.env.DB)
  const type = c.req.query('type')
  const valid: MemberType[] = ['contractor', 'associate', 'institutional']
  const filter = valid.includes(type as MemberType) ? (type as MemberType) : undefined
  return c.html(<MembersPage theme={theme(c)} members={members} filter={filter} />)
})
app.get('/events', (c) => c.html(<EventsPage theme={theme(c)} />))
app.get('/advocacy', (c) => c.redirect('/about/committees', 301))
app.get('/join', (c) => c.html(<JoinPage theme={theme(c)} />))
app.post('/join', async (c) => {
  await c.req.parseBody()
  return c.html(<JoinThanksPage theme={theme(c)} />)
})
app.get('/contact', (c) => c.html(<ContactPage theme={theme(c)} />))
app.post('/contact', async (c) => {
  await c.req.parseBody()
  return c.html(<ContactThanksPage theme={theme(c)} />)
})

app.post('/newsletter/subscribe', async (c) => {
  await c.req.parseBody()
  return c.html(<NewsletterThanksPage theme={theme(c)} />)
})

app.notFound((c) => c.html(<NotFoundPage theme={theme(c)} />, 404))

export default app
