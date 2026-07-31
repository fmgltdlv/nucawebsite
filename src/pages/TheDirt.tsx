import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { ArchiveCard, ArchiveCardList } from '../views/ArchiveCard'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import { mergeDirtFeed } from '../lib/dirt-feed'
import { getAssetUrl } from '../lib/r2-assets'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

export function TheDirtArchivePage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  posts,
  releases,
}: PageProps & { posts: PostRecord[]; releases: DirtReleaseRecord[] }) {
  const items = mergeDirtFeed(posts, releases)

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation })}
      title="THE DIRT"
      description="News, policy, and chapter announcements from NUCA of Las Vegas."
    >
      <PageHeader
        title="THE DIRT"
        lead="Chapter news releases, policy updates, and announcements. Open PDF issues in your browser or read web posts."
      />
      <section class="section">
        <div class="container">
          <p class="section-lead dirt-subscribe">
            Want email delivery?{' '}
            <a href="/contact#newsletter">Subscribe to the mailing list</a> on the Contact page.
          </p>
          {items.length > 0 ? (
            <ArchiveCardList>
              {items.map((item) => {
                if (item.kind === 'post') {
                  const post = item.post
                  return (
                    <li key={`post-${post.id}`}>
                      <ArchiveCard
                        href={`/industry-updates/${post.slug}`}
                        date={post.published_at ?? ''}
                        title={post.title}
                        summary={post.excerpt}
                      />
                    </li>
                  )
                }

                const release = item.release
                const pdfUrl = getAssetUrl(release.pdf_r2_key)
                return (
                  <li key={`release-${release.id}`}>
                    <ArchiveCard
                      href={`/about/the-dirt/${release.id}`}
                      date={release.published_at}
                      title={release.title}
                      summary={release.summary}
                      actions={
                        <div class="dirt-card-actions">
                          <a class="btn btn-primary btn-sm" href={`/about/the-dirt/${release.id}`}>
                            View in browser
                          </a>
                          <a class="btn btn-secondary btn-sm" href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            Open PDF ↗
                          </a>
                        </div>
                      }
                    />
                  </li>
                )
              })}
            </ArchiveCardList>
          ) : (
            <p class="prose">No releases have been published yet.</p>
          )}
        </div>
      </section>
    </Layout>
  )
}
