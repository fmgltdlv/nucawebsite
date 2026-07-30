import { PAGE_LABELS, type PageRecord } from '../../../lib/pages-db'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

const publicPaths: Record<string, string> = {
  about: '/about',
  resources: '/resources',
  scholarships: '/scholarships',
  committees: '/about/committees',
  'committee-legislative': '/about/committees#legislative',
  'committee-safety': '/about/committees#safety',
  'committee-standards': '/about/committees#standards',
  'committee-damage_prevention': '/about/committees#damage_prevention',
}

export function AdminContentPagesPage({
  theme,
  ctx,
  pages,
}: PageProps & { ctx: AdminContext; pages: PageRecord[] }) {
  const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))

  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Editable pages"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a>
      </p>
      <ul class="admin-link-list">
        {Object.entries(PAGE_LABELS).map(([slug, label]) => {
          const page = bySlug[slug]
          const publicPath = publicPaths[slug] ?? `/${slug}`
          return (
            <li key={slug}>
              <a href={`/admin/content/pages/${slug}`}>{label}</a>
              {page ? (
                <span>
                  {' '}
                  — {page.published ? 'published' : 'draft'} ·{' '}
                  <a href={publicPath}>view</a>
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
