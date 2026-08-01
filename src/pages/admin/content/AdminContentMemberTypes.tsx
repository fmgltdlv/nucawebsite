import type { MembershipTypeRecord } from '../../../lib/membership-types-db'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function typeSearchText(item: MembershipTypeRecord): string {
  return [item.key, item.name, item.description, item.published ? 'published' : 'draft', String(item.sort_order)]
    .join(' ')
    .toLowerCase()
}

function MemberTypeListRow({ item }: { item: MembershipTypeRecord }) {
  const editModalId = `edit-member-type-${item.key}`

  return (
    <tr data-admin-list-row data-search={typeSearchText(item)}>
      <td>{item.sort_order}</td>
      <td>
        <code>{item.key}</code>
      </td>
      <td>
        <strong>{item.name}</strong>
      </td>
      <td>
        {item.published === 1 ? (
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

function MemberTypeEditModal({ item }: { item: MembershipTypeRecord }) {
  const formId = `form-member-type-${item.key}`

  return (
    <AdminModal
      id={`edit-member-type-${item.key}`}
      title={`Edit ${item.name}`}
      formAction={`/admin/content/member-types/${item.key}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/member-types/${item.key}`}
          deleteAction={`/admin/content/member-types/${item.key}/delete`}
        />
      }
    >
      <p class="admin-note">
        Key <code>{item.key}</code> cannot be changed after create.
      </p>
      <div class="form-field">
        <label for={`${formId}-order`}>Sort order</label>
        <input
          type="number"
          name="sort_order"
          id={`${formId}-order`}
          value={String(item.sort_order)}
        />
      </div>
      <div class="form-field">
        <label for={`${formId}-name`}>Name</label>
        <input type="text" name="name" id={`${formId}-name`} value={item.name} required />
      </div>
      <div class="form-field">
        <label for={`${formId}-description`}>Description</label>
        <textarea name="description" id={`${formId}-description`} rows={4}>
          {item.description}
        </textarea>
      </div>
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={item.published === 1} />
        Published on Join page and application form
      </label>
    </AdminModal>
  )
}

export function AdminContentMemberTypesPage({
  ctx,
  items,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  items: MembershipTypeRecord[]
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Membership types"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a>
            {' · '}
            <a href="/admin/content/pages/join">Edit Join page</a>
            {' · '}
            <a href="/join">View Join page</a>
          </p>
        }
        flash={flash}
        error={error}
        addButtonLabel="Add type"
        addModalId="add-member-type-dialog"
        addModalTitle="Add membership type"
        addFormAction="/admin/content/member-types"
        addSubmitLabel="Add type"
        addFormBody={
          <>
            <div class="form-field">
              <label for="key">Key (optional)</label>
              <input
                type="text"
                name="key"
                id="key"
                placeholder="e.g. contractor"
                pattern="[a-z][a-z0-9]*(?:-[a-z0-9]+)*"
              />
              <p class="form-hint">Lowercase letters, numbers, hyphens. Immutable after create.</p>
            </div>
            <div class="form-field">
              <label for="name">Name</label>
              <input type="text" name="name" id="name" required />
            </div>
            <div class="form-field">
              <label for="description">Description</label>
              <textarea name="description" id="description" rows={3} />
            </div>
          </>
        }
        listTitle="Types"
        listCount={items.length}
        emptyMessage="No membership types yet."
        hasItems={items.length > 0}
        tableHead={
          <tr>
            <th>Order</th>
            <th>Key</th>
            <th>Name</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={items.map((item) => <MemberTypeListRow item={item} key={item.key} />)}
        afterTable={items.map((item) => <MemberTypeEditModal item={item} key={item.key} />)}
      />
    </AdminShell>
  )
}
