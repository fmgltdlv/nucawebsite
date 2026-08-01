import type { LeadershipRecord } from '../../../lib/leadership-db'
import { getAssetUrl } from '../../../lib/r2-assets'
import { AdminShell } from '../../../views/AdminShell'
import { AdminAssetPickerField } from '../../../views/admin/AdminAssetPickerField'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function leaderSearchText(person: LeadershipRecord): string {
  return [
    person.name,
    person.role_title,
    person.chair_title,
    person.company,
    person.published ? 'published' : 'draft',
    String(person.sort_order),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function LeaderListRow({ person }: { person: LeadershipRecord }) {
  const editModalId = `edit-leader-${person.id}`
  const photoUrl = person.photo_r2_key ? getAssetUrl(person.photo_r2_key) : null

  return (
    <tr data-admin-list-row data-search={leaderSearchText(person)}>
      <td class="admin-list-logo-cell">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            class="admin-member-logo-preview"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span class="admin-member-logo-placeholder" aria-hidden="true">
            {person.name.charAt(0)}
          </span>
        )}
      </td>
      <td><strong>{person.name}</strong></td>
      <td>{person.role_title}</td>
      <td>{person.company ?? '—'}</td>
      <td>{person.sort_order}</td>
      <td>
        {person.published === 1 ? (
          <span class="admin-status-badge admin-status-listed">Published</span>
        ) : (
          <span class="admin-status-badge admin-status-hidden">Draft</span>
        )}
      </td>
      <td class="admin-list-actions">
        <AdminEditButton modalId={editModalId} />
      </td>
    </tr>
  )
}

function LeaderEditModal({ person }: { person: LeadershipRecord }) {
  const formId = `form-leader-${person.id}`
  const photoUrl = person.photo_r2_key ? getAssetUrl(person.photo_r2_key) : null

  return (
    <AdminModal
      id={`edit-leader-${person.id}`}
      title={`Edit ${person.name}`}
      formAction={`/admin/content/leadership/${person.id}`}
      formEncType="multipart/form-data"
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/leadership/${person.id}`}
          deleteAction={`/admin/content/leadership/${person.id}/delete`}
        />
      }
    >
      <div class="form-row">
        <div class="form-field">
          <label for={`${formId}-name`}>Name</label>
          <input type="text" name="name" id={`${formId}-name`} value={person.name} required />
        </div>
        <div class="form-field">
          <label for={`${formId}-role`}>Role</label>
          <input
            type="text"
            name="role_title"
            id={`${formId}-role`}
            value={person.role_title}
            required
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for={`${formId}-chair`}>Chair / committee title</label>
          <input
            type="text"
            name="chair_title"
            id={`${formId}-chair`}
            value={person.chair_title ?? ''}
          />
        </div>
        <div class="form-field">
          <label for={`${formId}-company`}>Company</label>
          <input type="text" name="company" id={`${formId}-company`} value={person.company ?? ''} />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for={`${formId}-website`}>Website</label>
          <input
            type="url"
            name="website"
            id={`${formId}-website`}
            value={person.website ?? ''}
            placeholder="https://"
          />
        </div>
        <div class="form-field">
          <label for={`${formId}-linkedin`}>LinkedIn</label>
          <input
            type="url"
            name="linkedin_url"
            id={`${formId}-linkedin`}
            value={person.linkedin_url ?? ''}
            placeholder="https://linkedin.com/in/…"
          />
        </div>
      </div>
      <div class="form-field">
        <label for={`${formId}-bio`}>Bio</label>
        <textarea name="bio" id={`${formId}-bio`} rows={4} placeholder="Short biography">
          {person.bio ?? ''}
        </textarea>
      </div>
      <div class="form-field">
        <label for={`${formId}-order`}>Sort order</label>
        <input
          type="number"
          name="sort_order"
          id={`${formId}-order`}
          value={String(person.sort_order)}
        />
      </div>
      <AdminAssetPickerField
        label="Photo"
        kind="image"
        hiddenInputName="existing_photo_key"
        fileInputName="photo"
        fileInputId={`${formId}-photo`}
        fileAccept="image/*"
        currentKey={person.photo_r2_key}
        currentUrl={photoUrl}
        hint="Upload a new photo or choose an existing image from the library."
      />
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={person.published === 1} />
        Published on leadership page
      </label>
    </AdminModal>
  )
}

export function AdminContentLeadershipPage({
  ctx,
  leaders,
  flash,
  ...site
}: PageProps & { ctx: AdminContext; leaders: LeadershipRecord[]; flash?: string }) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      inboxCounts={ctx.inboxCounts}
      title="Leadership"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · <a href="/about/leadership">View public page</a>
          </p>
        }
        flash={flash}
        addButtonLabel="Add leader"
        addModalId="add-leader-dialog"
        addModalTitle="Add leader"
        addFormAction="/admin/content/leadership"
        addFormEncType="multipart/form-data"
        addSubmitLabel="Add leader"
        addFormBody={
          <>
            <div class="form-field">
              <label for="name">Name</label>
              <input type="text" name="name" id="name" required />
            </div>
            <div class="form-field">
              <label for="role_title">Role</label>
              <input type="text" name="role_title" id="role_title" required />
            </div>
            <div class="form-field">
              <label for="chair_title">Chair / committee title (optional)</label>
              <input type="text" name="chair_title" id="chair_title" />
            </div>
            <div class="form-field">
              <label for="company">Company (optional)</label>
              <input type="text" name="company" id="company" />
            </div>
            <div class="form-field">
              <label for="website">Website (optional)</label>
              <input type="url" name="website" id="website" placeholder="https://" />
            </div>
            <div class="form-field">
              <label for="linkedin_url">LinkedIn (optional)</label>
              <input type="url" name="linkedin_url" id="linkedin_url" placeholder="https://linkedin.com/in/…" />
            </div>
            <div class="form-field">
              <label for="bio">Bio (optional)</label>
              <textarea name="bio" id="bio" rows={4} placeholder="Short biography shown in the profile popup" />
            </div>
            <AdminAssetPickerField
              label="Photo (optional)"
              kind="image"
              hiddenInputName="existing_photo_key"
              fileInputName="photo"
              fileInputId="photo"
              fileAccept="image/*"
              hint="Upload a new photo or choose an existing image from the library."
            />
          </>
        }
        listTitle="Roster"
        listCount={leaders.length}
        emptyMessage="No leaders yet."
        hasItems={leaders.length > 0}
        tableHead={
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Role</th>
            <th>Company</th>
            <th>Order</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={leaders.map((person) => <LeaderListRow person={person} key={person.id} />)}
        afterTable={leaders.map((person) => <LeaderEditModal person={person} key={person.id} />)}
      />
    </AdminShell>
  )
}
