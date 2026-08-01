import type { Member } from '../../data/demo'
import {
  committeeAssignmentKeys,
  committeeAssignmentLabels,
  ROLE_LABELS,
  type UserWithMemberInfo,
} from '../../config/roles'
import type { CommitteeRecord } from '../../lib/committees-db'
import { AdminShell } from '../../views/AdminShell'
import { AdminCrudSections } from '../../views/admin/AdminCrudSections'
import { AdminListSection, AdminListSearch } from '../../views/admin/AdminListSection'
import { MemberLinkStatusDot } from '../../views/MemberLinkStatus'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function userSearchText(u: UserWithMemberInfo): string {
  return [
    u.email,
    u.display_name,
    ROLE_LABELS[u.role],
    u.member_company,
    u.pending_company,
    u.member_link_status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function AdminUsersPage({
  ctx,
  users,
  members,
  committees,
  message,
  ...site
}: PageProps & {
  ctx: AdminContext
  users: UserWithMemberInfo[]
  members: Member[]
  committees: CommitteeRecord[]
  message?: string
}) {
  const pending = users.filter((u) => u.member_link_status === 'pending')
  const assignmentKeys = committeeAssignmentKeys(committees)
  const assignmentLabels = committeeAssignmentLabels(committees)

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      inboxCounts={ctx.inboxCounts}
      title="Users & roles"
      activePath="/admin/users"
    >
      {message && <p class="admin-flash">{message}</p>}
      <p class="section-lead">
        <strong>Admin</strong> — full access. <strong>Chair</strong> — events + assigned committee pages.
        <strong>Member</strong> — edit linked directory listing only.
      </p>

      {pending.length > 0 && (
        <AdminListSection
          title="Pending company link requests"
          count={pending.length}
          emptyMessage=""
          hasItems={pending.length > 0}
          listId="admin-pending-links"
          toolbar={<AdminListSearch />}
          tableHead={
            <tr>
              <th>User</th>
              <th>Current company</th>
              <th>Requested company</th>
              <th>Actions</th>
            </tr>
          }
          tableBody={pending.map((u) => (
            <tr
              key={u.id}
              data-admin-list-row
              data-search={[u.email, u.display_name, u.member_company, u.pending_company]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()}
            >
              <td>
                {u.display_name || u.email}
                <br />
                <span class="admin-table-sub">{u.email}</span>
              </td>
              <td>
                {u.member_company ? (
                  <span class="member-link-inline">
                    <MemberLinkStatusDot status="approved" />
                    {u.member_company}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td>
                <span class="member-link-inline">
                  <MemberLinkStatusDot status="pending" />
                  {u.pending_company ?? '—'}
                </span>
              </td>
              <td class="admin-list-actions">
                <form method="post" action={`/admin/users/${u.id}/approve-link`} class="admin-inline-form">
                  <button type="submit" class="btn btn-primary btn-sm">Approve</button>
                </form>
                <form method="post" action={`/admin/users/${u.id}/reject-link`} class="admin-inline-form">
                  <button type="submit" class="btn btn-secondary btn-sm">Reject</button>
                </form>
              </td>
            </tr>
          ))}
        />
      )}

      <AdminCrudSections
        addButtonLabel="Add user"
        addModalId="add-user-dialog"
        addModalTitle="Add user"
        addFormAction="/admin/users"
        addSubmitLabel="Create user"
        addFormBody={
          <>
            <div class="form-row">
              <div class="form-field">
                <label for="email">Email</label>
                <input type="email" name="email" id="email" required />
              </div>
              <div class="form-field">
                <label for="password">Password</label>
                <input type="password" name="password" id="password" required minlength={10} />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="role">Role</label>
                <select name="role" id="role" required>
                  <option value="admin">Admin</option>
                  <option value="chair">Chair</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div class="form-field">
                <label for="member_id">Member company (for Member role)</label>
                <select name="member_id" id="member_id">
                  <option value="">None — user will request later</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.company}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div class="form-field">
              <label for="display_name">Display name</label>
              <input type="text" name="display_name" id="display_name" />
            </div>
            <fieldset class="admin-fieldset">
              <legend>Chair committee assignments</legend>
              {assignmentKeys.map((key) => (
                <label class="admin-check" key={key}>
                  <input type="checkbox" name={`committee_${key}`} value="1" />
                  {assignmentLabels[key]}
                </label>
              ))}
            </fieldset>
          </>
        }
        listTitle="All users"
        listCount={users.length}
        emptyMessage="No users yet."
        hasItems={users.length > 0}
        tableHead={
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Member company</th>
            <th>Name</th>
          </tr>
        }
        tableBody={users.map((u) => (
          <tr key={u.id} data-admin-list-row data-search={userSearchText(u)}>
            <td>{u.email}</td>
            <td>{ROLE_LABELS[u.role]}</td>
            <td>
              {u.member_company ? (
                <span class="member-link-inline">
                  <MemberLinkStatusDot status="approved" />
                  {u.member_company}
                </span>
              ) : u.pending_company && u.member_link_status === 'pending' ? (
                <span class="member-link-inline">
                  <MemberLinkStatusDot status="pending" />
                  {u.pending_company} (pending)
                </span>
              ) : (
                '—'
              )}
            </td>
            <td>{u.display_name ?? '—'}</td>
          </tr>
        ))}
      />
    </AdminShell>
  )
}
