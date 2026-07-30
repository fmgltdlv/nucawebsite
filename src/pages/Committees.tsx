import { CHAPTER_COMMITTEES } from '../data/committees'
import { Layout, PageHeader } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

export function CommitteesPage({
  theme,
  contact,
  footer,
  breakingNews,
  page,
}: PageProps & { page: PageRecord | null }) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Committees">
      <PageHeader
        title={page?.title ?? 'Committees'}
        lead={
          page?.meta_description ??
          'Chapter committees coordinate member engagement, advocacy, and chapter programs.'
        }
      />
      <section class="section">
        <div class="container">
          <h2>Chapter committees</h2>
          <ul class="leader-list committee-list">
            {CHAPTER_COMMITTEES.map((committee) => (
              <li key={committee.key} id={committee.key}>
                <span class="leader-name">{committee.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {page?.body_md?.trim() && (
        <section class="section section-muted">
          <div class="container prose">{markdownToSafeHtml(page.body_md)}</div>
        </section>
      )}
    </Layout>
  )
}
