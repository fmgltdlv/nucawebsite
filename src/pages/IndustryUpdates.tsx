import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import { formatArchiveDate } from '../lib/format'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

export function IndustryUpdateDetailPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  post,
}: PageProps & { post: PostRecord }) {
  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation })} title={post.title}>
      <PageHeader
        title={post.title}
        lead={post.excerpt ?? formatArchiveDate(post.published_at)}
      />
      <section class="section">
        <div class="container">
          <p>
            <a class="btn btn-secondary btn-sm" href="/the-dirt">← THE DIRT</a>
          </p>
          <div class="prose">{markdownToSafeHtml(post.body_md)}</div>
        </div>
      </section>
    </Layout>
  )
}
