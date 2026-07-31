import type { ExpandedEventRecord } from './event-repeat'
import { listPublishedEventsForCalendar, listUpcomingEvents } from './events'
import { listDirtReleases } from './dirt-db'
import { listPublishedPosts } from './posts-db'
import { getCommitteeByKey, listCommittees, type CommitteeRecord } from './committees-db'
import { committeeKeyFromSlug } from './committee-pages'
import { pageBlocksIncludeCalendar } from './page-blocks'
import type { PageRecord } from './pages-db'
import { listResourceItems, type ResourceItemRecord } from './resource-items-db'

export type CmsPageExtras = {
  resourceItems?: ResourceItemRecord[]
  calendarEvents?: ExpandedEventRecord[]
  events?: ExpandedEventRecord[]
  dirtReleases?: Awaited<ReturnType<typeof listDirtReleases>>
  posts?: Awaited<ReturnType<typeof listPublishedPosts>>
  committees?: CommitteeRecord[]
  committee?: CommitteeRecord | null
}

export async function loadPageCalendarEvents(
  db: D1Database,
  body_json: string | null | undefined,
): Promise<ExpandedEventRecord[] | undefined> {
  if (!pageBlocksIncludeCalendar(body_json)) return undefined
  return listPublishedEventsForCalendar(db)
}

export async function loadCmsPageExtras(
  db: D1Database,
  slug: string,
  page: PageRecord,
): Promise<CmsPageExtras> {
  const extras: CmsPageExtras = {}
  if (slug === 'resources') {
    extras.resourceItems = await listResourceItems(db, true)
  }
  if (slug === 'home') {
    const [events, dirtReleases, posts] = await Promise.all([
      listUpcomingEvents(db, 12),
      listDirtReleases(db, true),
      listPublishedPosts(db),
    ])
    extras.events = events
    extras.dirtReleases = dirtReleases
    extras.posts = posts
  }
  if (slug === 'committees') {
    extras.committees = await listCommittees(db)
  }
  const committeeKey = committeeKeyFromSlug(slug)
  if (committeeKey) {
    extras.committee = await getCommitteeByKey(db, committeeKey)
  }
  const calendarEvents = await loadPageCalendarEvents(db, page.body_json)
  if (calendarEvents) extras.calendarEvents = calendarEvents
  return extras
}
