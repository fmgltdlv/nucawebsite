import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
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
  page,
  fallbackLead,
}: PageProps & { page: PageRecord; fallbackLead?: string }) {
  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation })}
      title={page.title}
      description={page.meta_description ?? undefined}
    >
      <PageHeader title={page.title} lead={fallbackLead ?? page.meta_description ?? undefined} />
      <section class="section">
        <div class="container prose">{renderPageContent(page.body_md, page.body_json)}</div>
      </section>
    </Layout>
  )
}
