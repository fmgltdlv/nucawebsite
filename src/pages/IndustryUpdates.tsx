import { Layout, PageHeader } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function IndustryUpdatesPage({
  theme,
  contact,
  footer,
  breakingNews,
  posts,
}: PageProps & { posts: PostRecord[] }) {
  return (
    <Layout
      theme={theme}
      contact={contact}
      footer={footer}
      breakingNews={breakingNews}
      title="Industry Updates"
    >
      <PageHeader
        title="Industry Updates"
        lead="News, policy, and chapter announcements from NUCA of Las Vegas."
      />
      <section class="section">
        <div class="container">
          {posts.length > 0 ? (
            <ul class="dirt-archive">
              {posts.map((post) => (
                <li key={post.id}>
                  <article class="dirt-card">
                    <div class="dirt-card-meta">
                      <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
                    </div>
                    <h2>
                      <a href={`/industry-updates/${post.slug}`}>{post.title}</a>
                    </h2>
                    {post.excerpt && <p>{post.excerpt}</p>}
                    <a class="text-link" href={`/industry-updates/${post.slug}`}>
                      Read more →
                    </a>
                  </article>
                </li>
              ))}
            </ul>
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
  post,
}: PageProps & { post: PostRecord }) {
  return (
    <Layout
      theme={theme}
      contact={contact}
      footer={footer}
      breakingNews={breakingNews}
      title={post.title}
    >
      <PageHeader
        title={post.title}
        lead={post.excerpt ?? formatDate(post.published_at)}
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
