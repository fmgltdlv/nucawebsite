import type { Env } from '../env'
import { demoEvents, demoLeadership, demoMembers, site } from '../data/demo'
import { demoQaItems } from '../data/qa'
import { demoDirtReleases } from '../data/the-dirt'
import { demoResourceItems } from '../data/resources'
import { countUsers, createUser } from './auth'
import { createEvent } from './events'
import { setContactInfo, setFooterInfo, setThemeId } from './site-settings'
import { seedNavItemsIfEmpty } from './nav-items-db'
import { upsertPage } from './pages-db'
import { createLeadership } from './leadership-db'
import { createResourceItem } from './resource-items-db'
import { seedCommitteesIfEmpty } from './committees-db'
import { defaultHomePageSeed } from './home-page'

/** Seed first admin from Worker secrets when no users exist. */
export async function seedAdminIfNeeded(env: Env): Promise<void> {
  const count = await countUsers(env.DB)
  if (count > 0) return
  const email = env.ADMIN_EMAIL?.trim() || 'info@nucalasvegas.com'
  const password = env.ADMIN_PASSWORD
  if (!password) return
  await createUser(env.DB, email, password, { display_name: 'Chapter Admin' })
}

export async function seedDemoMembersIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM members').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  for (const m of demoMembers) {
    await env.DB
      .prepare(
        `INSERT INTO members (id, company_name, member_type, website, phone, active)
         VALUES (?, ?, ?, ?, ?, 1)`,
      )
      .bind(m.id, m.company, m.type, m.website ?? null, m.phone ?? null)
      .run()
  }
}

/** Seed Q&A, events, site settings, pages, and leadership from demo data when tables are empty. */
export async function seedContentIfEmpty(env: Env): Promise<void> {
  await seedSiteSettingsIfEmpty(env)
  await seedCommitteesIfEmpty(env.DB)
  await seedNavItemsIfEmpty(env.DB)
  await seedQaIfEmpty(env)
  await seedEventsIfEmpty(env)
  await seedPagesIfEmpty(env)
  await seedHomePageIfMissing(env)
  await seedTrainingPageIfMissing(env)
  await seedResourcesIfEmpty(env)
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

- [FAQ](/about/faq) — including "What is NUCA?"
- [Leadership](/about/leadership)
- [Member List](/members)
- [Events](/events)
- [Resources](/resources)
- [Training](/training)

Other main menu items: [Committees](/about/committees), [THE DIRT](/the-dirt).`,
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
    body_md: '',
    meta_description: 'Reference links for local utilities, national organizations, and Southern Nevada municipalities.',
    published: true,
  })

  await upsertPage(env.DB, {
    slug: 'training',
    title: 'Training',
    body_md: trainingPageBodyMd(),
    meta_description:
      'NUCA excavation safety competent person and confined space entry training for utility construction professionals.',
    published: true,
  })
}

function trainingPageBodyMd(): string {
  return `NUCA of Las Vegas offers safety training programs for utility contractors, competent persons, and field crews. See [upcoming events](/events) for scheduled classes.

## NUCA Competent Person Class

Excavation is the most dangerous of all construction operations. More workers are killed or seriously injured in and around excavations than in other phases of construction work, and that's why the Occupational Safety and Health Administration (OSHA) requires a competent person to oversee all excavation and trenching jobsites. The competent person must have specific training in, and be knowledgeable about, soil analysis, the use of protective systems, and the requirements of OSHA Subpart P.

NUCA's Excavation Safety Competent Person Training program helps contractors train the competent person and workers. Although the responsibility for designating a competent person is the sole responsibility of the contractor, this program is designed to simplify the task by providing participants with the information and training needed to become a competent person.

The program includes the scope and application of Subpart P—Excavation Standard; definitions; general requirements; requirements for protective systems; soil classification; and handling an OSHA inspection. Each participant receives a training manual that includes a complete copy of the Excavation Standard.

## NUCA Confined Space Training

Millions of employees who enter into confined spaces each year face a significant risk of injury or death. Many of these same employees do not recognize that they may be facing serious unforeseen hazards by working in a confined space.

NUCA's Confined Space Entry course is intended to provide construction managers, competent persons, and workers with basic information regarding entry into confined spaces. Its purpose is to create an awareness of the hazards associated with confined spaces and to provide managers with basic information necessary to establish a confined space entry program. Every confined space is unique. Therefore, each confined space must be carefully evaluated, and hazards must be eliminated or controlled before a confined space entry supervisor issues an entry permit.

For questions about training dates or registration, [contact the chapter](/contact).`
}

async function seedHomePageIfMissing(env: Env): Promise<void> {
  const existing = await env.DB.prepare('SELECT slug FROM pages WHERE slug = ?')
    .bind('home')
    .first<{ slug: string }>()
  if (existing) return

  await upsertPage(env.DB, defaultHomePageSeed())
}

async function seedTrainingPageIfMissing(env: Env): Promise<void> {
  const existing = await env.DB.prepare('SELECT slug FROM pages WHERE slug = ?')
    .bind('training')
    .first<{ slug: string }>()
  if (existing) return

  await upsertPage(env.DB, {
    slug: 'training',
    title: 'Training',
    body_md: trainingPageBodyMd(),
    meta_description:
      'NUCA excavation safety competent person and confined space entry training for utility construction professionals.',
    published: true,
  })
}

async function seedResourcesIfEmpty(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as c FROM resource_items').first<{ c: number }>()
  if ((row?.c ?? 0) > 0) return
  let order = 0
  for (const item of demoResourceItems) {
    await createResourceItem(env.DB, {
      label: item.label,
      url: item.url,
      category: item.category,
      sort_order: order++,
      published: true,
    })
  }
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
