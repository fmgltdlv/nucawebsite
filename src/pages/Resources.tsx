import { Layout, PageHeader } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import type { PageRecord } from '../lib/pages-db'
import type { ResourceItemRecord } from '../lib/resource-items-db'
import type { PageProps } from '../types/page'

export function ResourcesPage({
  theme,
  contact,
  footer,
  breakingNews,
  page,
  items,
}: PageProps & { page: PageRecord | null; items: ResourceItemRecord[] }) {
  return (
    <Layout
      theme={theme}
      contact={contact}
      footer={footer}
      breakingNews={breakingNews}
      title="Resources"
      description={page?.meta_description ?? undefined}
    >
      <PageHeader
        title={page?.title ?? 'Resources'}
        lead={page?.meta_description ?? 'Reference links and documents for NUCA members.'}
      />
      <section class="section">
        <div class="container prose">
          {page && <div>{markdownToSafeHtml(page.body_md)}</div>}
          {items.length > 0 && (
            <ul class="resource-link-list">
              {items.map((item) => (
                <li key={item.id}>
                  <a href={item.url} rel="noopener noreferrer" target="_blank">
                    {item.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
          {items.length === 0 && !page?.body_md?.trim() && (
            <p>No resources have been added yet.</p>
          )}
        </div>
      </section>
    </Layout>
  )
}
