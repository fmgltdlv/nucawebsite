import { committeePageSlug, isCommitteeAssignmentKey } from '../../lib/chair-pages'
import { SCHOLARSHIPS_COMMITTEE_KEY } from '../../config/roles'
import type { CommitteeRecord } from '../../lib/committees-db'
import { pagePreviewPath, pagePublicPath } from '../../lib/page-paths'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function committeeLabel(key: string, committees: CommitteeRecord[]): string {
  if (key === SCHOLARSHIPS_COMMITTEE_KEY) return 'Scholarships'
  return committees.find((committee) => committee.key === key)?.name ?? key.replace(/_/g, ' ')
}

export function AdminCommitteesPage({
  theme,
  ctx,
  committees,
}: PageProps & { ctx: AdminContext; committees: CommitteeRecord[] }) {
  const keys = ctx.chairCommittees.filter(isCommitteeAssignmentKey)

  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      inboxCounts={ctx.inboxCounts}
      title="Committee pages"
      activePath="/admin/committees"
    >
      <p class="section-lead">Edit content for committees assigned by an admin.</p>
      <ul class="admin-link-list">
        {keys.map((key) => {
          const slug = committeePageSlug(key)
          return (
            <li key={key}>
              <a href={`/admin/content/pages/${slug}`}>
                Edit: {committeeLabel(key, committees)}
              </a>
              {' · '}
              <a href={pagePreviewPath(slug)}>preview</a>
              {' · '}
              <a href={pagePublicPath(slug)}>view</a>
            </li>
          )
        })}
      </ul>
    </AdminShell>
  )
}
