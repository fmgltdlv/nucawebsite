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
      <PageHeader title={release.title} lead={`Published ${formatDate(release.published_at)}`} />
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

export function TheDirtNotFoundPage({ theme, contact, footer, breakingNews }: PageProps) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Release not found">
      <PageHeader title="Release not found" lead="That issue is not in the archive." />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/about/the-dirt">Back to THE DIRT archive</a>
        </div>
      </section>
    </Layout>
  )
}
