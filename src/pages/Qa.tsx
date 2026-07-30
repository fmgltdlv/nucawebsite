import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import type { QaRecord } from '../lib/qa-db'
import type { PageProps } from '../types/page'

export function QaPage({ theme, contact, footer, breakingNews, logoUrl, items }: PageProps & { items: QaRecord[] }) {
  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl })} title="Q & A">
      <PageHeader
        title="Q & A"
        lead="Frequently asked questions about NUCA and the Las Vegas chapter."
      />
      <section class="section">
        <div class="container">
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
