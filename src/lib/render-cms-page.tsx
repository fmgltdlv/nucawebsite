import type { Child } from 'hono/jsx'
import { CommitteesPage } from '../pages/Committees'
import { CommitteeDetailPage } from '../pages/CommitteeDetail'
import { ContentPage } from '../pages/ContentPage'
import { HomePage } from '../pages/Home'
import { ResourcesPage } from '../pages/Resources'
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
