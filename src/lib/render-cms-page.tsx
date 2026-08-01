import type { Child } from 'hono/jsx'
import { CommitteesPage } from '../pages/Committees'
import { CommitteeDetailPage } from '../pages/CommitteeDetail'
import { ContentPage } from '../pages/ContentPage'
import { HomePage } from '../pages/Home'
import { ResourcesPage } from '../pages/Resources'
import { QaPage } from '../pages/Qa'
import { LeadershipPage } from '../pages/Leadership'
import { EventsPage } from '../pages/Events'
import { TheDirtArchivePage } from '../pages/TheDirt'
import { JoinPage } from '../pages/Join'
import { ContactPage } from '../pages/Contact'
import type { PageProps } from '../types/page'
import type { CmsPageExtras } from './cms-page-extras'
import { committeeKeyFromSlug } from './committee-pages'
import type { PageRecord } from './pages-db'

export function renderCmsPage(
  site: PageProps,
  slug: string,
  page: PageRecord,
  extras?: CmsPageExtras,
): Child {
  const calendarEvents = extras?.calendarEvents
  if (slug === 'home') {
    return (
      <HomePage
        {...site}
        page={page}
        events={extras?.events ?? []}
        dirtReleases={extras?.dirtReleases ?? []}
        posts={extras?.posts ?? []}
        calendarEvents={extras?.calendarEvents}
      />
    )
  }
  if (slug === 'resources') {
    return (
      <ResourcesPage
        {...site}
        page={page}
        items={extras?.resourceItems ?? []}
        calendarEvents={calendarEvents}
      />
    )
  }
  if (slug === 'committees') {
    return (
      <CommitteesPage
        {...site}
        page={page}
        calendarEvents={calendarEvents}
        committees={extras?.committees ?? []}
      />
    )
  }
  if (slug === 'faq') {
    return <QaPage {...site} page={page} items={extras?.qaItems ?? []} />
  }
  if (slug === 'leadership') {
    return <LeadershipPage {...site} page={page} leaders={extras?.leaders ?? []} />
  }
  if (slug === 'events') {
    const list = extras?.eventsList
    return (
      <EventsPage
        {...site}
        cmsPage={page}
        events={list?.events ?? []}
        calendarEvents={list?.calendarEvents ?? []}
        view={list?.view ?? 'list'}
        page={list?.listPage ?? 1}
        totalPages={list?.totalPages ?? 1}
        totalEvents={list?.totalEvents ?? 0}
        focusDate={list?.focusDate ?? new Date().toISOString().slice(0, 10)}
        committeeKey={list?.committeeKey ?? null}
        committees={list?.committees ?? []}
      />
    )
  }
  if (slug === 'the-dirt') {
    return (
      <TheDirtArchivePage
        {...site}
        page={page}
        posts={extras?.posts ?? []}
        releases={extras?.dirtReleases ?? []}
      />
    )
  }
  if (slug === 'join') {
    return (
      <JoinPage
        {...site}
        page={page}
        committees={extras?.committees ?? []}
        membershipTypes={extras?.membershipTypes ?? []}
      />
    )
  }
  if (slug === 'contact') {
    return <ContactPage {...site} page={page} />
  }
  const committeeKey = committeeKeyFromSlug(slug)
  if (committeeKey && extras?.committee) {
    return (
      <CommitteeDetailPage
        {...site}
        committee={extras.committee}
        page={page}
        calendarEvents={calendarEvents}
      />
    )
  }
  return <ContentPage {...site} page={page} calendarEvents={calendarEvents} />
}
