import type { ExpandedEventRecord } from './event-repeat'
import {
  countUpcomingEvents,
  EVENTS_LIST_PAGE_SIZE,
  listPublishedEventsForCalendar,
  listUpcomingEvents,
  listUpcomingEventsPage,
} from './events'
import { listDirtReleases } from './dirt-db'
import { listPublishedPosts } from './posts-db'
import { getCommitteeByKey, listCommittees, type CommitteeRecord } from './committees-db'
import { committeeKeyFromSlug } from './committee-pages'
import { pageBlocksIncludeCalendar } from './page-blocks'
import type { PageRecord } from './pages-db'
import { listResourceItems, type ResourceItemRecord } from './resource-items-db'
import { listQaItems, type QaRecord } from './qa-db'
import { listLeadership, type LeadershipRecord } from './leadership-db'
import type { DirtReleaseRecord } from './dirt-db'
import type { PostRecord } from './posts-db'
import { listMembershipTypes, type MembershipTypeRecord } from './membership-types-db'

export type EventsListExtras = {
  events: ExpandedEventRecord[]
  calendarEvents: ExpandedEventRecord[]
  view: 'list' | 'week' | 'month'
  listPage: number
  totalPages: number
  totalEvents: number
  focusDate: string
  committeeKey: string | null
  committees: CommitteeRecord[]
}

export type CmsPageExtras = {
  resourceItems?: ResourceItemRecord[]
  calendarEvents?: ExpandedEventRecord[]
  events?: ExpandedEventRecord[]
  dirtReleases?: DirtReleaseRecord[]
  posts?: PostRecord[]
  committees?: CommitteeRecord[]
  committee?: CommitteeRecord | null
  qaItems?: QaRecord[]
  leaders?: LeadershipRecord[]
  eventsList?: EventsListExtras
  membershipTypes?: MembershipTypeRecord[]
}

export async function loadPageCalendarEvents(
  db: D1Database,
  body_json: string | null | undefined,
): Promise<ExpandedEventRecord[] | undefined> {
  if (!pageBlocksIncludeCalendar(body_json)) return undefined
  return listPublishedEventsForCalendar(db)
}

function todayFocusDate(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

async function loadEventsListExtras(db: D1Database): Promise<EventsListExtras> {
  const [totalEvents, calendarEvents, committees, events] = await Promise.all([
    countUpcomingEvents(db, null),
    listPublishedEventsForCalendar(db),
    listCommittees(db, true),
    listUpcomingEventsPage(db, 1, EVENTS_LIST_PAGE_SIZE, null),
  ])
  const totalPages = Math.max(1, Math.ceil(totalEvents / EVENTS_LIST_PAGE_SIZE))
  return {
    events,
    calendarEvents,
    view: 'list',
    listPage: 1,
    totalPages,
    totalEvents,
    focusDate: todayFocusDate(),
    committeeKey: null,
    committees,
  }
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
  if (slug === 'faq') {
    extras.qaItems = await listQaItems(db, true)
  }
  if (slug === 'leadership') {
    extras.leaders = await listLeadership(db, true)
  }
  if (slug === 'events') {
    extras.eventsList = await loadEventsListExtras(db)
  }
  if (slug === 'the-dirt') {
    const [posts, dirtReleases] = await Promise.all([
      listPublishedPosts(db),
      listDirtReleases(db, true),
    ])
    extras.posts = posts
    extras.dirtReleases = dirtReleases
  }
  if (slug === 'join') {
    const [committees, membershipTypes] = await Promise.all([
      listCommittees(db, true),
      listMembershipTypes(db, true),
    ])
    extras.committees = committees
    extras.membershipTypes = membershipTypes
  }
  const committeeKey = committeeKeyFromSlug(slug)
  if (committeeKey) {
    extras.committee = await getCommitteeByKey(db, committeeKey)
  }
  const calendarEvents = await loadPageCalendarEvents(db, page.body_json)
  if (calendarEvents) extras.calendarEvents = calendarEvents
  return extras
}
