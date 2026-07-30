import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { ArchiveCard, ArchiveCardList } from '../views/ArchiveCard'
import { markdownToSafeHtml } from '../lib/markdown'
import { formatArchiveDate } from '../lib/format'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

export function IndustryUpdatesPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  posts,
}: PageProps & { posts: PostRecord[] }) {
  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl })} title="Industry Updates">
      <PageHeader
        title="Industry Updates"
        lead="News, policy, and chapter announcements from NUCA of Las Vegas."
      />
      <section class="section">
        <div class="container">
          {posts.length > 0 ? (
            <ArchiveCardList>
              {posts.map((post) => (
                <li key={post.id}>
                  <ArchiveCard
                    href={`/industry-updates/${post.slug}`}
                    date={post.published_at ?? ''}
                    title={post.title}
                    summary={post.excerpt}
                  />
                </li>
              ))}
            </ArchiveCardList>
          ) : (
            <p class="prose">No industry updates have been published yet.</p>
          )}
        </div>
      </section>
    </Layout>
  )
}

export function IndustryUpdateDetailPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  post,
}: PageProps & { post: PostRecord }) {
  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl })} title={post.title}>
      <PageHeader
        title={post.title}
        lead={post.excerpt ?? formatArchiveDate(post.published_at)}
      />
      <section class="section">
        <div class="container">
          <p>
            <a class="btn btn-secondary btn-sm" href="/industry-updates">← All updates</a>
          </p>
          <div class="prose">{markdownToSafeHtml(post.body_md)}</div>
        </div>
      </section>
    </Layout>
  )
}
