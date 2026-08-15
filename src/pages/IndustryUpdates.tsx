import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { markdownToSafeHtml } from '../lib/markdown'
import { sanitizePostHtml } from '../lib/sanitize-html'
import { formatArchiveDate } from '../lib/format'
import { getAssetUrl } from '../lib/r2-assets'
import { clampCoverWidthPct, type PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'
import { raw } from 'hono/html'

export function IndustryUpdateDetailPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  post,
}: PageProps & { post: PostRecord }) {
  const sanitized = sanitizePostHtml(post.body_html ?? '')
  const body = sanitized ? raw(sanitized) : markdownToSafeHtml(post.body_md)
  const coverUrl = post.cover_r2_key ? getAssetUrl(post.cover_r2_key) : null
  const coverWidth = clampCoverWidthPct(post.cover_width_pct, 100)

  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })} title={post.title}>
      <PageHeader
        title={post.title}
        lead={post.excerpt ?? formatArchiveDate(post.published_at)}
      />
      <section class="section">
        <div class="container">
          <p>
            <a class="btn btn-secondary btn-sm" href="/the-dirt">← THE DIRT</a>
          </p>
          {coverUrl && (
            <figure class="dirt-post-cover" style={{ width: `${coverWidth}%` }}>
              <img
                src={coverUrl}
                alt={post.cover_alt || ''}
                loading="eager"
                decoding="async"
              />
            </figure>
          )}
          <div class="prose dirt-post-body">{body}</div>
        </div>
      </section>
      <script src="/dirt-post-carousel.js" defer></script>
    </Layout>
  )
}
