import { Layout, PageHeader } from '../views/Layout'
import type { PageStatus } from '../nav/site-nav'

import type { PageProps } from '../types/page'

type PlaceholderProps = PageProps & {
  title: string
  status: PageStatus
  legacyUrl?: string
  notes?: string
}

export function PlaceholderPage({ theme, title, status, legacyUrl, notes }: PlaceholderProps) {
  const statusLabel =
    status === 'demo' ? 'Demo' : status === 'stub' ? 'Stub' : 'Not copied yet'

  return (
    <Layout theme={theme} title={title}>
      <PageHeader
        title={title}
        lead={`Copy tracker: ${statusLabel}. This page is a placeholder in the new site.`}
      />
      <section class="section">
        <div class="container prose placeholder-panel">
          {notes && <p>{notes}</p>}
          <p>
            Use the live site as the source while we rebuild. Status dots in the navigation match
            this page.
          </p>
          {legacyUrl && (
            <p>
              <a class="btn btn-secondary" href={legacyUrl} rel="noopener noreferrer" target="_blank">
                Open current site page ↗
              </a>
            </p>
          )}
          <p>
            <a class="text-link" href="/">Back to home</a>
          </p>
        </div>
      </section>
    </Layout>
  )
}
