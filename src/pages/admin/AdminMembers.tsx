import type { Member } from '../../data/demo'
import { memberTypeLabel } from '../../data/demo'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminMembersPage({
  theme,
  ctx,
  members,
}: PageProps & { ctx: AdminContext; members: Member[] }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Member list"
      activePath="/admin/members"
    >
      <p class="section-lead">
        Public directory at <a href="/members">/members</a>. Full CRUD forms coming next; data is live from D1.
      </p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Type</th>
              <th>ID</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.company}</td>
                <td>{memberTypeLabel[m.type]}</td>
                <td><code class="admin-id">{m.id}</code></td>
                <td>{m.phone ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
