import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminContentPage({ theme, ctx }: PageProps & { ctx: AdminContext }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Content"
      activePath="/admin/content"
    >
      <ul class="admin-link-list">
        <li>Q & A — admin editor (planned)</li>
        <li>THE DIRT PDF archive — upload to R2 (planned)</li>
        <li>Industry updates / blog posts (planned)</li>
        <li>Editable pages: About, Resources, Advocacy (planned)</li>
        <li>Site theme preset (planned)</li>
      </ul>
    </AdminShell>
  )
}
