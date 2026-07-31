import { CHAPTER_COMMITTEE_BY_KEY, type ChapterCommitteeKey } from '../data/committees'
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
  navigation,
  committeeKey,
  page,
}: PageProps & { committeeKey: ChapterCommitteeKey; page: PageRecord }) {
  const committeeName = CHAPTER_COMMITTEE_BY_KEY[committeeKey]

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation })}
      title={page.title}
      description={page.meta_description ?? undefined}
    >
      <PageHeader
        title={page.title}
        lead={page.meta_description ?? committeeName}
      />
      <section class="section">
        <div class="container prose">
          <p>
            <a href="/about/committees">← All committees</a>
          </p>
          {renderPageContent(page.body_md, page.body_json)}
        </div>
      </section>
    </Layout>
  )
}
