import { Layout, PageHeader } from '../views/Layout'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import { getAssetUrl } from '../lib/r2-assets'
import type { PageProps } from '../types/page'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TheDirtArchivePage({
  theme,
  contact,
  footer,
  breakingNews,
  releases,
}: PageProps & { releases: DirtReleaseRecord[] }) {
  return (
    <Layout
      theme={theme}
      contact={contact}
      footer={footer}
      breakingNews={breakingNews}
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
          <ul class="dirt-archive">
            {releases.map((release) => {
              const pdfUrl = getAssetUrl(release.pdf_r2_key)
              return (
                <li key={release.id}>
                  <article class="dirt-card">
                    <div class="dirt-card-meta">
                      <time dateTime={release.published_at}>{formatDate(release.published_at)}</time>
                    </div>
                    <h2>
                      <a href={`/about/the-dirt/${release.id}`}>{release.title}</a>
                    </h2>
                    {release.summary && <p>{release.summary}</p>}
                    <div class="dirt-card-actions">
                      <a class="btn btn-primary btn-sm" href={`/about/the-dirt/${release.id}`}>
                        View in browser
                      </a>
                      <a class="btn btn-secondary btn-sm" href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        Open PDF ↗
                      </a>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
          {releases.length === 0 && <p class="prose">No releases have been published yet.</p>}
        </div>
      </section>
    </Layout>
  )
}
