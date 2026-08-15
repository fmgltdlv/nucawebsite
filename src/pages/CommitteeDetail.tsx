import type { CommitteeRecord } from '../lib/committees-db'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { renderPageContent } from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

export function CommitteeDetailPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  committee,
  page,
  calendarEvents,
}: PageProps & {
  committee: CommitteeRecord
  page: PageRecord
  calendarEvents?: ExpandedEventRecord[]
}) {
  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })}
      title={page.title}
      description={page.meta_description ?? undefined}
    >
      <PageHeader
        title={page.title}
        lead={page.meta_description ?? committee.name}
      />
      <section class="section">
        <div class="container prose">
          <p>
            <a href="/about/committees">← All committees</a>
          </p>
          {renderPageContent(page.body_md, page.body_json, { calendarEvents })}
        </div>
      </section>
    </Layout>
  )
}
