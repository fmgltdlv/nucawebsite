import type { Child } from 'hono/jsx'
import { CommitteesPage } from '../pages/Committees'
import { CommitteeDetailPage } from '../pages/CommitteeDetail'
import { ContentPage } from '../pages/ContentPage'
import { ResourcesPage } from '../pages/Resources'
import type { PageProps } from '../types/page'
import { committeeKeyFromSlug } from './committee-pages'
import type { PageRecord } from './pages-db'
import type { ResourceItemRecord } from './resource-items-db'

export function renderCmsPage(
  site: PageProps,
  slug: string,
  page: PageRecord,
  extras?: { resourceItems?: ResourceItemRecord[] },
): Child {
  if (slug === 'resources') {
    return <ResourcesPage {...site} page={page} items={extras?.resourceItems ?? []} />
  }
  if (slug === 'committees') {
    return <CommitteesPage {...site} page={page} />
  }
  const committeeKey = committeeKeyFromSlug(slug)
  if (committeeKey) {
    return <CommitteeDetailPage {...site} committeeKey={committeeKey} page={page} />
  }
  return <ContentPage {...site} page={page} />
}
