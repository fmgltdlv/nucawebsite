import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { ArchiveCard, ArchiveCardList } from '../views/ArchiveCard'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import { getAssetUrl } from '../lib/r2-assets'
import type { PageProps } from '../types/page'

export function TheDirtArchivePage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  releases,
}: PageProps & { releases: DirtReleaseRecord[] }) {
  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl })}
      title="THE DIRT"
      description="Archive of THE DIRT news releases from NUCA of Las Vegas."
    >
      <PageHeader
        title="THE DIRT"
        lead="Archive of chapter news releases. Open any issue in your browser or download the PDF."
      />
      <section class="section">
        <div class="container">
          <p class="section-lead dirt-subscribe">
            Want email delivery?{' '}
            <a href="/contact#newsletter">Subscribe to the mailing list</a> on the Contact page.
          </p>
          <ArchiveCardList>
            {releases.map((release) => {
              const pdfUrl = getAssetUrl(release.pdf_r2_key)
              return (
                <li key={release.id}>
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
          {releases.length === 0 && <p class="prose">No releases have been published yet.</p>}
        </div>
      </section>
    </Layout>
  )
}
