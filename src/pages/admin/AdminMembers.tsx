import { MEMBER_TYPES, memberTypeLabel } from '../../data/demo'
import type { AdminMember } from '../../lib/members-db'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function MemberEditRow({ member }: { member: AdminMember }) {
  const formId = `edit-member-${member.id}`

  return (
    <tr>
      <td class="admin-member-logo-cell">
        {member.logoUrl ? (
          <img src={member.logoUrl} alt="" class="admin-member-logo-preview" />
        ) : (
          <span class="admin-member-logo-placeholder" aria-hidden="true">
            {member.company.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}
        <input
          form={formId}
          type="file"
          name="logo"
          class="admin-table-file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
        />
        {member.logoUrl && (
          <label class="admin-check-inline">
            <input form={formId} type="checkbox" name="remove_logo" value="1" />
            Remove
          </label>
        )}
      </td>
      <td>
        <input
          form={formId}
          type="text"
          name="company_name"
          class="admin-table-input"
          value={member.company}
          required
        />
      </td>
      <td>
        <select form={formId} name="member_type" class="admin-table-input" required>
          {MEMBER_TYPES.map((type) => (
            <option key={type} value={type} selected={member.type === type}>
              {memberTypeLabel[type]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          form={formId}
          type="url"
          name="website"
          class="admin-table-input"
          value={member.website ?? ''}
          placeholder="https://"
        />
      </td>
      <td>
        <input
          form={formId}
          type="tel"
          name="phone"
          class="admin-table-input"
          value={member.phone ?? ''}
        />
      </td>
      <td>
        <input
          form={formId}
          type="email"
          name="email"
          class="admin-table-input"
          value={member.email ?? ''}
        />
      </td>
      <td class="admin-table-check">
        <label class="admin-check-inline">
          <input form={formId} type="checkbox" name="active" value="1" checked={member.active} />
          Listed
        </label>
      </td>
      <td>
        <input
          form={formId}
          type="number"
          name="display_order"
          class="admin-table-input admin-table-input-narrow"
          value={String(member.display_order)}
          min={0}
        />
      </td>
      <td>
        <code class="admin-id">{member.id}</code>
      </td>
      <td>
        <form
          id={formId}
          method="post"
          action={`/admin/members/${member.id}`}
          enctype="multipart/form-data"
        >
          <button type="submit" class="btn btn-secondary btn-sm">
            Save
          </button>
        </form>
      </td>
    </tr>
  )
}

export function AdminMembersPage({
  theme,
  ctx,
  members,
  flash,
  error,
}: PageProps & {
  ctx: AdminContext
  members: AdminMember[]
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Member list"
      activePath="/admin/members"
    >
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="form-hint-warn">{error}</p>}
      <p class="section-lead">
        Public directory at <a href="/members">/members</a>. Only members marked <strong>Listed</strong>{' '}
        appear on the public site. Upload a company logo (PNG, JPEG, WebP, or SVG, max 2 MB) for the member grid.
      </p>

      <section class="admin-form-section">
        <h2>Add member</h2>
        <form class="form" method="post" action="/admin/members" enctype="multipart/form-data">
          <div class="form-row">
            <div class="form-field">
              <label for="company_name">Company</label>
              <input type="text" name="company_name" id="company_name" required />
            </div>
            <div class="form-field">
              <label for="member_type">Type</label>
              <select name="member_type" id="member_type" required>
                {MEMBER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {memberTypeLabel[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label for="website">Website</label>
              <input type="url" name="website" id="website" placeholder="https://" />
            </div>
            <div class="form-field">
              <label for="phone">Phone</label>
              <input type="tel" name="phone" id="phone" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label for="email">Email</label>
              <input type="email" name="email" id="email" />
            </div>
            <div class="form-field">
              <label for="display_order">Display order</label>
              <input type="number" name="display_order" id="display_order" min={0} value={0} />
            </div>
          </div>
          <div class="form-field">
            <label for="logo">Company logo</label>
            <input
              type="file"
              name="logo"
              id="logo"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
            />
            <p class="form-hint">Optional. Shown on the public member grid.</p>
          </div>
          <label class="admin-check">
            <input type="checkbox" name="active" value="1" />
            Listed on public member directory
          </label>
          <button type="submit" class="btn btn-primary">Add member</button>
        </form>
      </section>

      <section class="section">
        <h2>All members ({members.length})</h2>
        {members.length === 0 ? (
          <p class="muted">No members yet. Add one above.</p>
        ) : (
          <div class="table-wrap">
            <table class="data-table admin-members-table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Website</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <MemberEditRow key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  )
}
