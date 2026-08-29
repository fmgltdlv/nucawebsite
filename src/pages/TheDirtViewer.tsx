import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { PdfViewer } from '../views/PdfViewer'
import { StatusPage } from '../views/StatusPage'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import { formatArchiveDate } from '../lib/format'
import { getAssetUrl } from '../lib/r2-assets'
import type { PageProps } from '../types/page'

export function TheDirtViewerPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  headerBranding,
  navigation,
  staffInboxCount,
  release,
}: PageProps & { release: DirtReleaseRecord }) {
  const pdfUrl = getAssetUrl(release.pdf_r2_key)

  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, headerBranding, navigation, staffInboxCount })} title={release.title}>
      <PageHeader title={release.title} lead={`Published ${formatArchiveDate(release.published_at)}`} />
      <section class="section">
        <div class="container">
          <p>
            <a class="btn btn-secondary btn-sm" href="/the-dirt">← Back to THE DIRT</a>
          </p>
          {release.summary && <p class="section-lead">{release.summary}</p>}
          <PdfViewer pdfUrl={pdfUrl} title={`PDF: ${release.title}`} />
        </div>
      </section>
    </Layout>
  )
}

export function TheDirtNotFoundPage(props: PageProps) {
  return (
    <StatusPage
      {...props}
      title="Release not found"
      heading="Release not found"
      lead="That issue is not in the archive."
      ctaHref="/the-dirt"
      ctaLabel="Back to THE DIRT"
    />
  )
}
