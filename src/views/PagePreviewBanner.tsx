import type { Child } from 'hono/jsx'
import { pagePreviewPath, pagePublicPath } from '../lib/page-paths'

export function PagePreviewBanner({
  slug,
  published,
  live = false,
}: {
  slug: string
  published: boolean
  live?: boolean
}) {
  const editUrl = `/admin/content/pages/${slug}`
  const publicPath = pagePublicPath(slug)

  return (
    <div class="page-preview-banner" role="status">
      <p>
        <strong>{live ? 'Live preview' : 'Preview mode'}</strong>
        {live
          ? ' — unsaved changes'
          : published
            ? ' — viewing saved content'
            : ' — this page is unpublished'}
        {' · '}
        <a href={editUrl}>Back to editor</a>
        {!live && published ? (
          <>
            {' · '}
            <a href={publicPath}>View live page</a>
          </>
        ) : !live ? (
          <>
            {' · '}
            <a href={pagePreviewPath(slug)}>Refresh preview</a>
          </>
        ) : null}
      </p>
    </div>
  )
}

export function PagePreviewFrame({
  slug,
  published,
  live = false,
  children,
}: {
  slug: string
  published: boolean
  live?: boolean
  children: Child
}) {
  return (
    <>
      <PagePreviewBanner slug={slug} published={published} live={live} />
      {children}
    </>
  )
}
