import { CHAPTER_COMMITTEES } from '../../data/committees'
import { COMMITTEE_KEYS, COMMITTEE_LABELS, type CommitteeKey } from '../../config/roles'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function isCommitteeKey(key: string): key is CommitteeKey {
  return (COMMITTEE_KEYS as readonly string[]).includes(key)
}

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
      <p class="section-lead">You can edit content for committees assigned by an admin.</p>
      <ul class="admin-link-list">
        {CHAPTER_COMMITTEES.filter((c) => keys.includes(c.key)).map((committee) => (
          <li key={committee.key}>
            <a href={`/about/committees#${committee.key}`}>Public: {committee.name}</a> — rich editor coming soon
          </li>
        ))}
        {keys.includes('scholarships') && (
          <li>
            <a href="/scholarships">Public: Scholarships</a> — rich editor coming soon
          </li>
        )}
      </ul>
      {keys.length === 0 && <p class="muted">No committee pages assigned yet.</p>}
      {keys.length > 0 && (
        <p class="admin-note">
          Assigned: {keys.map((k) => COMMITTEE_LABELS[k]).join(', ')}
        </p>
      )}
    </AdminShell>
  )
}
