import type { Child } from 'hono/jsx'
import { pagePreviewPath, pagePublicPath } from '../lib/page-paths'

export function PagePreviewBanner({
  slug,
  published,
}: {
  slug: string
  published: boolean
}) {
  const editUrl = `/admin/content/pages/${slug}`
  const publicPath = pagePublicPath(slug)

  return (
    <div class="page-preview-banner" role="status">
      <p>
        <strong>Preview mode</strong>
        {published ? ' — viewing saved content' : ' — this page is unpublished'}
        {' · '}
        <a href={editUrl}>Back to editor</a>
        {published ? (
          <>
            {' · '}
            <a href={publicPath}>View live page</a>
          </>
        ) : (
          <>
            {' · '}
            <a href={pagePreviewPath(slug)}>Refresh preview</a>
          </>
        )}
      </p>
    </div>
  )
}

export function PagePreviewFrame({
  slug,
  published,
  children,
}: {
  slug: string
  published: boolean
  children: Child
}) {
  return (
    <>
      <PagePreviewBanner slug={slug} published={published} />
      {children}
    </>
  )
}
