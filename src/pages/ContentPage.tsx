import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import { renderPageContent } from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

export function ContentPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  staffInboxCount,
  page,
  fallbackLead,
  calendarEvents,
}: PageProps & {
  page: PageRecord
  fallbackLead?: string
  calendarEvents?: ExpandedEventRecord[]
}) {
  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation, staffInboxCount })}
      title={page.title}
      description={page.meta_description ?? undefined}
    >
      <PageHeader title={page.title} lead={fallbackLead ?? page.meta_description ?? undefined} />
      <section class="section">
        <div class="container prose">
          {renderPageContent(page.body_md, page.body_json, { calendarEvents })}
        </div>
      </section>
    </Layout>
  )
}
