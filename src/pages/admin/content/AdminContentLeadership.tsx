import type { LeadershipRecord } from '../../../lib/leadership-db'
import { getAssetUrl } from '../../../lib/r2-assets'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function LeaderEditRow({ person }: { person: LeadershipRecord }) {
  const formId = `leader-${person.id}`
  return (
    <tr>
      <td>
        {person.photo_r2_key ? (
          <img src={getAssetUrl(person.photo_r2_key)} alt="" class="admin-member-logo-preview" />
        ) : (
          <span class="admin-member-logo-placeholder" aria-hidden="true">
            {person.name.charAt(0)}
          </span>
        )}
        <input form={formId} type="file" name="photo" accept="image/*" class="admin-table-file" />
      </td>
      <td>
        <input form={formId} type="text" name="name" class="admin-table-input" value={person.name} required />
      </td>
      <td>
        <input
          form={formId}
          type="text"
          name="role_title"
          class="admin-table-input"
          value={person.role_title}
          required
        />
      </td>
      <td>
        <input
          form={formId}
          type="number"
          name="sort_order"
          class="admin-table-input admin-table-input-narrow"
          value={String(person.sort_order)}
        />
      </td>
      <td>
        <label class="admin-check-inline">
          <input form={formId} type="checkbox" name="published" value="1" checked={person.published === 1} />
          Published
        </label>
      </td>
      <td>
        <form id={formId} method="post" action={`/admin/content/leadership/${person.id}`} encType="multipart/form-data">
          <button type="submit" class="btn btn-secondary btn-sm">Save</button>
        </form>
        <form method="post" action={`/admin/content/leadership/${person.id}/delete`} class="admin-inline-form">
          <button type="submit" class="btn btn-secondary btn-sm">Delete</button>
        </form>
      </td>
    </tr>
  )
}

export function AdminContentLeadershipPage({
  theme,
  ctx,
  leaders,
  flash,
}: PageProps & { ctx: AdminContext; leaders: LeadershipRecord[]; flash?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Leadership"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a> · <a href="/about/leadership">View public page</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      <section class="admin-form-section">
        <h2>Add leader</h2>
        <form class="form" method="post" action="/admin/content/leadership" encType="multipart/form-data">
          <div class="form-field">
            <label for="name">Name</label>
            <input type="text" name="name" id="name" required />
          </div>
          <div class="form-field">
            <label for="role_title">Role</label>
            <input type="text" name="role_title" id="role_title" required />
          </div>
          <div class="form-field">
            <label for="photo">Photo (optional)</label>
            <input type="file" name="photo" id="photo" accept="image/*" />
          </div>
          <button type="submit" class="btn btn-primary">Add leader</button>
        </form>
      </section>
      <section class="section">
        <h2>Roster ({leaders.length})</h2>
        {leaders.length > 0 ? (
          <table class="admin-members-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>Order</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((person) => (
                <LeaderEditRow person={person} key={person.id} />
              ))}
            </tbody>
          </table>
        ) : (
          <p class="muted">No leaders yet.</p>
        )}
      </section>
    </AdminShell>
  )
}
