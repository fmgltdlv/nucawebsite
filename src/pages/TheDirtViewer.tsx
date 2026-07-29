import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { type DirtRelease } from '../data/the-dirt'
import type { PageProps } from '../types/page'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

import type { PageProps } from '../types/page'

export function TheDirtViewerPage({
  theme,
  release,
}: PageProps & { release: DirtRelease }) {
  return (
    <Layout theme={theme} title={release.title}>
      <DemoBanner />
      <PageHeader
        title={release.title}
        lead={`Published ${formatDate(release.publishedAt)}`}
        actions={
          <a class="btn btn-secondary btn-sm" href="/about/the-dirt">← Back to archive</a>
        }
      />
      <section class="section">
        <div class="container">
          {release.summary && <p class="section-lead">{release.summary}</p>}
          <div class="pdf-toolbar">
            <a class="btn btn-secondary btn-sm" href={release.pdfUrl} download>
              Download PDF
            </a>
            <a
              class="btn btn-secondary btn-sm"
              href={release.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new tab ↗
            </a>
          </div>
          <div class="pdf-viewer-wrap">
            <iframe
              class="pdf-viewer"
              title={`PDF: ${release.title}`}
              src={release.pdfUrl}
            />
          </div>
          <p class="pdf-fallback">
            If the preview does not load, use <a href={release.pdfUrl}>Open in new tab</a> or download the file.
          </p>
        </div>
      </section>
    </Layout>
  )
}

export function TheDirtNotFoundPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Release not found">
      <PageHeader title="Release not found" lead="That issue is not in the demo archive." />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/about/the-dirt">Back to THE DIRT archive</a>
        </div>
      </section>
    </Layout>
  )
}
