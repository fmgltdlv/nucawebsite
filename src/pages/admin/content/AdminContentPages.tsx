import type { PageRecord } from '../../../lib/pages-db'
import { pagePreviewPath, pagePublicPath } from '../../../lib/page-paths'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

export function AdminContentPagesPage({
  ctx,
  pages,
  pageLabels,
  ...site
}: PageProps & { ctx: AdminContext; pages: PageRecord[]; pageLabels: Record<string, string> }) {
  const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      title="Editable pages"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a>
      </p>
      <ul class="admin-link-list">
        {Object.entries(pageLabels).map(([slug, label]) => {
          const page = bySlug[slug]
          const publicPath = pagePublicPath(slug)
          const previewPath = pagePreviewPath(slug)
          return (
            <li key={slug}>
              <a href={`/admin/content/pages/${slug}`}>{label}</a>
              {page ? (
                <span>
                  {' '}
                  — {page.published ? 'published' : 'draft'} ·{' '}
                  <a href={previewPath}>preview</a>
                  {page.published ? (
                    <>
                      {' · '}
                      <a href={publicPath}>view</a>
                    </>
                  ) : null}
                </span>
              ) : (
                <span> — not created yet</span>
              )}
            </li>
          )
        })}
      </ul>
    </AdminShell>
  )
}
