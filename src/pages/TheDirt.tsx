import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { ArchiveCard, ArchiveCardList } from '../views/ArchiveCard'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import { mergeDirtFeed, paginateDirtFeed } from '../lib/dirt-feed'
import { getAssetUrl } from '../lib/r2-assets'
import { renderPageContent } from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

function dirtPageHref(listPage: number): string {
  return listPage <= 1 ? '/the-dirt' : `/the-dirt?page=${listPage}`
}

export function TheDirtArchivePage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  posts,
  releases,
  page,
  listPage: requestedPage = 1,
}: PageProps & {
  posts: PostRecord[]
  releases: DirtReleaseRecord[]
  page?: PageRecord | null
  listPage?: number
}) {
  const {
    items,
    listPage,
    totalPages,
    totalItems,
  } = paginateDirtFeed(mergeDirtFeed(posts, releases), requestedPage)
  const title = page?.title ?? 'THE DIRT'
  const lead =
    page?.meta_description ??
    'Chapter news releases, policy updates, and announcements. Open PDF issues in your browser or read web posts.'
  const intro = page?.body_json || page?.body_md?.trim()

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })}
      title={title}
      description={
        page?.meta_description ?? 'News, policy, and chapter announcements from NUCA of Las Vegas.'
      }
    >
      <PageHeader title={title} lead={lead} />
      <section class="section">
        <div class="container">
          {intro ? (
            <div class="prose dirt-subscribe">{renderPageContent(page?.body_md ?? '', page?.body_json)}</div>
          ) : (
            <p class="section-lead dirt-subscribe">
              Want email delivery?{' '}
              <a href="/contact#newsletter">Subscribe to the mailing list</a> on the Contact page.
            </p>
          )}
          {totalItems > 0 ? (
            <>
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
                          imageUrl={post.cover_r2_key ? getAssetUrl(post.cover_r2_key) : null}
                          imageAlt={post.cover_alt}
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
              <nav
                class="events-pagination"
                aria-label="THE DIRT pagination"
                hidden={totalPages <= 1 ? true : undefined}
              >
                {listPage > 1 ? (
                  <a class="btn btn-secondary btn-sm" href={dirtPageHref(listPage - 1)}>
                    Previous
                  </a>
                ) : (
                  <span class="btn btn-secondary btn-sm" aria-disabled="true">
                    Previous
                  </span>
                )}
                <span class="events-page-info">
                  Page {listPage} of {totalPages} ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
                {listPage < totalPages ? (
                  <a class="btn btn-secondary btn-sm" href={dirtPageHref(listPage + 1)}>
                    Next
                  </a>
                ) : (
                  <span class="btn btn-secondary btn-sm" aria-disabled="true">
                    Next
                  </span>
                )}
              </nav>
            </>
          ) : (
            <p class="prose">No releases have been published yet.</p>
          )}
        </div>
      </section>
    </Layout>
  )
}
