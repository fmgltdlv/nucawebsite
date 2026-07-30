import type { Env } from '../env'
import { demoEvents, demoLeadership, demoMembers, site } from '../data/demo'
import { demoQaItems } from '../data/qa'
import { demoDirtReleases } from '../data/the-dirt'
import { countUsers, createUser } from './auth'
import { createEvent } from './events'
import { setContactInfo, setFooterInfo, setThemeId } from './site-settings'
import { upsertPage } from './pages-db'
import { createLeadership } from './leadership-db'

/** Seed first admin from Worker secrets when no users exist. */
export async function seedAdminIfNeeded(env: Env): Promise<void> {
  const count = await countUsers(env.DB)
  if (count > 0) return
  const email = env.ADMIN_EMAIL?.trim() || 'info@nucalasvegas.com'
  const password = env.ADMIN_PASSWORD
  if (!password) return
  await createUser(env.DB, email, password, 'admin', { display_name: 'Chapter Admin' })
}

export async function seedDemoMembersIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM members').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  let order = 0
  for (const m of demoMembers) {
    await env.DB
      .prepare(
        `INSERT INTO members (id, company_name, member_type, website, phone, active, display_order)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
      )
      .bind(m.id, m.company, m.type, m.website ?? null, m.phone ?? null, order++)
      .run()
  }
}

/** Seed Q&A, events, site settings, pages, and leadership from demo data when tables are empty. */
export async function seedContentIfEmpty(env: Env): Promise<void> {
  await seedSiteSettingsIfEmpty(env)
  await seedQaIfEmpty(env)
  await seedEventsIfEmpty(env)
  await seedPagesIfEmpty(env)
  await seedLeadershipIfEmpty(env)
}

async function seedSiteSettingsIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM site_settings').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  await setContactInfo(env.DB, { ...site })
  await setFooterInfo(env.DB, {
    dirtBlurb: 'Weekly chapter news and event updates.',
    copyrightNote: '',
  })
  await setThemeId(env.DB, 'desert')
}

async function seedQaIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM qa_items').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  let order = 0
  for (const item of demoQaItems) {
    await env.DB
      .prepare(
        `INSERT INTO qa_items (id, question, answer_md, sort_order, published, updated_at)
         VALUES (?, ?, ?, ?, 1, datetime('now'))`,
      )
      .bind(item.id, item.question, item.answer, order++)
      .run()
  }
}

async function seedEventsIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM events').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  for (const event of demoEvents) {
    await createEvent(env.DB, {
      title: event.title,
      starts_at: new Date(event.date).toISOString(),
      location: event.location,
      description: event.description,
      registration_url: event.registrationUrl && event.registrationUrl !== '#' ? event.registrationUrl : undefined,
    })
  }
}

async function seedPagesIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM pages').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return

  await upsertPage(env.DB, {
    slug: 'about',
    title: 'About NUCA of Las Vegas',
    body_md: `NUCA members include contractors who build and maintain underground utility systems, associate members who supply the industry, and institutional partners from education and government. The Las Vegas chapter hosts meetings, supports scholarships, and keeps members informed on safety and regulatory changes.

Under **About** in the menu:

- [Q & A](/about/q-and-a) — including "What is NUCA?"
- [Leadership](/about/leadership)
- [Member List](/members)
- [Events](/events)

Other main menu items: [Committees](/about/committees), [Industry Updates](/industry-updates) ([THE DIRT](/about/the-dirt)), [Resources](/resources).`,
    meta_description:
      'The local chapter of the National Utility Contractors Association serves utility construction professionals across Southern Nevada.',
    published: true,
  })

  await upsertPage(env.DB, {
    slug: 'committees',
    title: 'Committees',
    body_md: `NUCA of Las Vegas standing committees bring members together on advocacy, safety, standards, and damage prevention. Committee chairs coordinate meetings and chapter initiatives.

See also [NUCA Las Vegas Scholarships](/scholarships) under the Committees menu.`,
    published: true,
  })

  await upsertPage(env.DB, {
    slug: 'scholarships',
    title: 'NUCA Las Vegas Scholarships',
    body_md: `The NUCA Las Vegas chapter supports scholarships for students pursuing careers in utility construction and related fields.

Contact the chapter for current criteria, deadlines, and application materials.`,
    published: true,
  })

  await upsertPage(env.DB, {
    slug: 'resources',
    title: 'Resources',
    body_md: `Reference links and documents for NUCA members and the utility construction industry in Southern Nevada.`,
    published: true,
  })
}

async function seedLeadershipIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM leadership').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  let order = 0
  for (const person of demoLeadership) {
    await createLeadership(env.DB, {
      name: person.name,
      role_title: person.role,
      sort_order: order++,
      published: true,
    })
  }
}

/** Seed THE DIRT demo releases when table is empty (PDF keys point to demo uploads). */
export async function seedDirtIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM dirt_releases').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return

  for (const release of demoDirtReleases) {
    await env.DB
      .prepare(
        `INSERT INTO dirt_releases (id, title, summary, published_at, pdf_r2_key, published)
         VALUES (?, ?, ?, ?, ?, 1)`,
      )
      .bind(
        release.id,
        release.title,
        release.summary ?? null,
        release.publishedAt,
        `demo/${release.id}.pdf`,
      )
      .run()
  }
}
