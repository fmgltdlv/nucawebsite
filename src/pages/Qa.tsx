import { Layout, PageHeader } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import type { QaRecord } from '../lib/qa-db'
import type { PageProps } from '../types/page'

export function QaPage({ theme, contact, footer, breakingNews, items }: PageProps & { items: QaRecord[] }) {
  return (
    <Layout
      theme={theme}
      contact={contact}
      footer={footer}
      breakingNews={breakingNews}
      title="Q & A"
    >
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
