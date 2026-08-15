import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import { renderPageContent } from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { QaRecord } from '../lib/qa-db'
import type { PageProps } from '../types/page'

export function QaPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  items,
  page,
}: PageProps & { items: QaRecord[]; page?: PageRecord | null }) {
  const title = page?.title ?? 'FAQ'
  const lead =
    page?.meta_description ?? 'Frequently asked questions about NUCA and the Las Vegas chapter.'
  const intro = page?.body_json || page?.body_md?.trim()

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })}
      title={title}
      description={page?.meta_description ?? undefined}
    >
      <PageHeader title={title} lead={lead} />
      <section class="section">
        <div class="container">
          {intro && (
            <div class="prose">{renderPageContent(page?.body_md ?? '', page?.body_json)}</div>
          )}
          <dl class="qa-list">
            {items.map((item) => (
              <div class="qa-item" key={item.id}>
                <dt>{item.question}</dt>
                <dd>{markdownToSafeHtml(item.answer_md)}</dd>
              </div>
            ))}
          </dl>
          {items.length === 0 && <p class="prose">No questions have been published yet.</p>}
        </div>
      </section>
    </Layout>
  )
}
