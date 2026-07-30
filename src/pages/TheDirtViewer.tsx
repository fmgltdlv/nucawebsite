import { Layout, PageHeader } from '../views/Layout'
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
  release,
}: PageProps & { release: DirtReleaseRecord }) {
  const pdfUrl = getAssetUrl(release.pdf_r2_key)

  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title={release.title}>
      <PageHeader title={release.title} lead={`Published ${formatArchiveDate(release.published_at)}`} />
      <section class="section">
        <div class="container">
          <p>
            <a class="btn btn-secondary btn-sm" href="/about/the-dirt">← Back to archive</a>
          </p>
          {release.summary && <p class="section-lead">{release.summary}</p>}
          <div class="pdf-toolbar">
            <a class="btn btn-secondary btn-sm" href={pdfUrl} download>
              Download PDF
            </a>
            <a class="btn btn-secondary btn-sm" href={pdfUrl} target="_blank" rel="noopener noreferrer">
              Open in new tab ↗
            </a>
          </div>
          <div class="pdf-viewer-wrap">
            <iframe class="pdf-viewer" title={`PDF: ${release.title}`} src={pdfUrl} />
          </div>
          <p class="pdf-fallback">
            If the preview does not load, use <a href={pdfUrl}>Open in new tab</a> or download the file.
          </p>
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
      ctaHref="/about/the-dirt"
      ctaLabel="Back to THE DIRT archive"
    />
  )
}
