import { committeePageSlug, isCommitteeKey } from '../../lib/chair-pages'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminCommitteesPage({
  theme,
  ctx,
}: PageProps & { ctx: AdminContext }) {
  const keys = ctx.chairCommittees.filter(isCommitteeKey)

  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Committee pages"
      activePath="/admin/committees"
    >
      <p class="section-lead">Edit content for committees assigned by an admin.</p>
      <ul class="admin-link-list">
        {keys.map((key) => (
          <li key={key}>
            <a href={`/admin/content/pages/${committeePageSlug(key)}`}>
              Edit: {key === 'scholarships' ? 'Scholarships' : key.replace(/_/g, ' ')}
            </a>
            {' · '}
            <a href={key === 'scholarships' ? '/scholarships' : `/about/committees#${key}`}>
              View public page
            </a>
          </li>
        ))}
      </ul>
      {keys.length === 0 && <p class="muted">No committee pages assigned yet.</p>}
    </AdminShell>
  )
}
