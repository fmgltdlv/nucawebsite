import type { Member } from '../../data/demo'
import { memberTypeLabel } from '../../data/demo'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminProfilePage({
  theme,
  ctx,
  member,
  flash,
  error,
}: PageProps & {
  ctx: AdminContext
  member: Member | null
  flash?: string
  error?: string
}) {
  if (!member) {
    return (
      <AdminShell
        theme={theme}
        user={ctx.user}
        chairCommittees={ctx.chairCommittees}
        title="My listing"
        activePath="/admin/profile"
      >
        <p class="form-hint-warn">
          No member record is linked to your account. Ask an admin to set your <code>member_id</code> on your user.
        </p>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="My listing"
      activePath="/admin/profile"
    >
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="form-hint-warn">{error}</p>}
      <p class="section-lead">
        <strong>{member.company}</strong> ({memberTypeLabel[member.type]}) — company name and type are managed by staff.
      </p>
      <form class="form" method="post" action="/admin/profile">
        <div class="form-field">
          <label for="website">Website</label>
          <input type="url" name="website" id="website" value={member.website ?? ''} />
        </div>
        <div class="form-field">
          <label for="phone">Phone</label>
          <input type="tel" name="phone" id="phone" value={member.phone ?? ''} />
        </div>
        <div class="form-field">
          <label for="email">Public email</label>
          <input type="email" name="email" id="email" value={member.email ?? ''} />
        </div>
        <button type="submit" class="btn btn-primary">Save changes</button>
      </form>
    </AdminShell>
  )
}
