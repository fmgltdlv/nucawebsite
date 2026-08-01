import { MEMBER_TYPES, memberTypeLabel } from '../../data/demo'
import type { AdminMember } from '../../lib/members-db'
import { AdminShell } from '../../views/AdminShell'
import { AdminModal, AdminModalCancelButton } from '../../views/admin/AdminModal'
import { AdminAssetPickerField } from '../../views/admin/AdminAssetPickerField'
import { MemberPointsOfContactFields } from '../../views/admin/MemberPointsOfContactFields'
import { AdminCrudSections } from '../../views/admin/AdminCrudSections'
import { AdminEditButton } from '../../views/admin/AdminListSection'
import type { AdminContext } from '../../lib/admin-context'
import { padPointsOfContact } from '../../lib/member-contacts'
import type { PageProps } from '../../types/page'

function memberSearchText(member: AdminMember): string {
  return [
    member.company,
    memberTypeLabel[member.type],
    member.active ? 'listed' : 'hidden',
    member.id,
  ]
    .join(' ')
    .toLowerCase()
}

function MemberListRow({ member }: { member: AdminMember }) {
  const editModalId = `edit-member-${member.id}`

  return (
    <tr data-admin-list-row data-search={memberSearchText(member)}>
      <td class="admin-list-logo-cell">
        {member.logoUrl ? (
          <img
            src={member.logoUrl}
            alt=""
            class="admin-member-logo-preview"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span class="admin-member-logo-placeholder" aria-hidden="true">
            {member.company.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </td>
      <td>
        <strong>{member.company}</strong>
        <br />
        <code class="admin-id">{member.id}</code>
      </td>
      <td>{memberTypeLabel[member.type]}</td>
      <td>
        {member.active ? (
          <span class="admin-status-badge admin-status-listed">Listed</span>
        ) : (
          <span class="admin-status-badge admin-status-hidden">Hidden</span>
        )}
      </td>
      <td class="admin-list-actions">
        <AdminEditButton modalId={editModalId} />
      </td>
    </tr>
  )
}

function MemberEditModal({ member }: { member: AdminMember }) {
  const modalId = `edit-member-${member.id}`
  const formId = `form-member-${member.id}`

  return (
    <AdminModal
      id={modalId}
      title={`Edit ${member.company}`}
      formAction={`/admin/members/${member.id}`}
      formEncType="multipart/form-data"
      formId={formId}
      memberLogoForm
      footer={
        <>
          <AdminModalCancelButton />
          <button type="submit" class="btn btn-primary" form={formId}>Save</button>
        </>
      }
    >
      <div class="form-row">
        <div class="form-field">
          <label for={`${formId}-company`}>Company</label>
          <input
            type="text"
            name="company_name"
            id={`${formId}-company`}
            value={member.company}
            required
          />
        </div>
        <div class="form-field">
          <label for={`${formId}-type`}>Type</label>
          <select name="member_type" id={`${formId}-type`} required>
            {MEMBER_TYPES.map((type) => (
              <option key={type} value={type} selected={member.type === type}>
                {memberTypeLabel[type]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div class="form-field">
        <label for={`${formId}-description`}>Description</label>
        <textarea name="description" id={`${formId}-description`} rows={4}>
          {member.description ?? ''}
        </textarea>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for={`${formId}-website`}>Website</label>
          <input
            type="url"
            name="website"
            id={`${formId}-website`}
            value={member.website ?? ''}
            placeholder="https://"
          />
        </div>
        <div class="form-field">
          <label for={`${formId}-phone`}>Phone</label>
          <input type="tel" name="phone" id={`${formId}-phone`} value={member.phone ?? ''} />
        </div>
      </div>
      <div class="form-field">
        <label for={`${formId}-email`}>Email</label>
        <input type="email" name="email" id={`${formId}-email`} value={member.email ?? ''} />
      </div>
      <MemberPointsOfContactFields
        formIdPrefix={`${formId}-`}
        contacts={padPointsOfContact(member.contacts ?? [])}
      />
      <AdminAssetPickerField
        label="Company logo"
        kind="image"
        hiddenInputName="existing_logo_key"
        fileInputName="logo"
        fileInputId={`${formId}-logo`}
        fileAccept="image/png,image/jpeg,image/webp,image/svg+xml"
        currentKey={member.logo_r2_key}
        currentUrl={member.logoUrl}
        removeCheckboxName="remove_logo"
        hint="PNG, JPEG, WebP, or SVG, max 2 MB. Large images are compressed before upload."
      />
      <label class="admin-check">
        <input type="checkbox" name="active" value="1" checked={member.active} />
        Listed on public member directory
      </label>
    </AdminModal>
  )
}

export function AdminMembersPage({
  ctx,
  members,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  members: AdminMember[]
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      title="Member list"
      activePath="/admin/members"
    >
      <p class="section-lead">
        Public directory at <a href="/members">/members</a>. Only members marked <strong>Listed</strong>{' '}
        appear on the public site.
      </p>

      <AdminCrudSections
        flash={flash}
        error={error}
        addButtonLabel="Add member"
        addModalId="add-member-dialog"
        addModalTitle="Add member"
        addFormAction="/admin/members"
        addFormEncType="multipart/form-data"
        memberLogoForm
        addSubmitLabel="Add member"
        addFormBody={
          <>
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
            <div class="form-field">
              <label for="description">Description</label>
              <textarea name="description" id="description" rows={3}></textarea>
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
            <div class="form-field">
              <label for="email">Email</label>
              <input type="email" name="email" id="email" />
            </div>
            <MemberPointsOfContactFields />
            <AdminAssetPickerField
              label="Company logo"
              kind="image"
              hiddenInputName="existing_logo_key"
              fileInputName="logo"
              fileInputId="logo"
              fileAccept="image/png,image/jpeg,image/webp,image/svg+xml"
              hint="Optional. Upload a new file or choose an existing image from the library."
            />
            <label class="admin-check">
              <input type="checkbox" name="active" value="1" />
              Listed on public member directory
            </label>
          </>
        }
        listTitle="All members"
        listCount={members.length}
        emptyMessage="No members yet. Click Add member to create one."
        hasItems={members.length > 0}
        tableHead={
          <tr>
            <th>Logo</th>
            <th>Company</th>
            <th>Type</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={members.map((member) => <MemberListRow key={member.id} member={member} />)}
        afterTable={members.map((member) => <MemberEditModal key={member.id} member={member} />)}
      />
    </AdminShell>
  )
}
