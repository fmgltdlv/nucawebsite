import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { demoDirtReleases } from '../data/the-dirt'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

import type { PageProps } from '../types/page'

export function TheDirtArchivePage({ theme }: PageProps) {
  return (
    <Layout
      theme={theme}
      title="THE DIRT"
      description="Archive of THE DIRT news releases from NUCA of Las Vegas."
    >
      <DemoBanner />
      <PageHeader
        title="THE DIRT"
        lead="Archive of chapter news releases. Open any issue in your browser or download the PDF. New issues will be uploaded through the admin panel."
      />
      <section class="section">
        <div class="container">
          <p class="section-lead dirt-subscribe">
            Want email delivery?{' '}
            <a href="/contact#newsletter">Subscribe to the mailing list</a> on the Contact page.
          </p>
          <ul class="dirt-archive">
            {demoDirtReleases.map((release) => (
              <li key={release.id}>
                <article class="dirt-card">
                  <div class="dirt-card-meta">
                    <time dateTime={release.publishedAt}>{formatDate(release.publishedAt)}</time>
                  </div>
                  <h2>
                    <a href={`/about/the-dirt/${release.id}`}>{release.title}</a>
                  </h2>
                  {release.summary && <p>{release.summary}</p>}
                  <div class="dirt-card-actions">
                    <a class="btn btn-primary btn-sm" href={`/about/the-dirt/${release.id}`}>
                      View in browser
                    </a>
                    <a
                      class="btn btn-secondary btn-sm"
                      href={release.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open PDF ↗
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <p class="dirt-admin-note">
            <em>Planned admin:</em> upload PDF to R2, set title and date, publish to this archive. PDFs will preview
            on-site via embedded viewer.
          </p>
        </div>
      </section>
    </Layout>
  )
}
