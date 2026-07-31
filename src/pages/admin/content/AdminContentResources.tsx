import type { ResourceItemRecord } from '../../../lib/resource-items-db'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function resourceSearchText(item: ResourceItemRecord): string {
  return [
    item.category,
    item.label,
    item.url,
    item.published ? 'published' : 'draft',
    String(item.sort_order),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function ResourceListRow({ item }: { item: ResourceItemRecord }) {
  const editModalId = `edit-resource-${item.id}`

  return (
    <tr data-admin-list-row data-search={resourceSearchText(item)}>
      <td>{item.sort_order}</td>
      <td>{item.category || '—'}</td>
      <td><strong>{item.label}</strong></td>
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

function ResourceEditModal({ item }: { item: ResourceItemRecord }) {
  const formId = `form-resource-${item.id}`

  return (
    <AdminModal
      id={`edit-resource-${item.id}`}
      title={`Edit ${item.label}`}
      formAction={`/admin/content/resources/${item.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/resources/${item.id}`}
          deleteAction={`/admin/content/resources/${item.id}/delete`}
        />
      }
    >
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
        <label for={`${formId}-category`}>Category</label>
        <input type="text" name="category" id={`${formId}-category`} value={item.category} />
      </div>
      <div class="form-field">
        <label for={`${formId}-label`}>Label</label>
        <input type="text" name="label" id={`${formId}-label`} value={item.label} required />
      </div>
      <div class="form-field">
        <label for={`${formId}-url`}>URL</label>
        <input type="url" name="url" id={`${formId}-url`} value={item.url} required />
      </div>
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={item.published === 1} />
        Published on Resources page
      </label>
    </AdminModal>
  )
}

export function AdminContentResourcesPage({
  theme,
  ctx,
  items,
  flash,
}: PageProps & { ctx: AdminContext; items: ResourceItemRecord[]; flash?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      inboxCounts={ctx.inboxCounts}
      title="Resource links"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · <a href="/resources">View Resources page</a>
          </p>
        }
        flash={flash}
        addButtonLabel="Add link"
        addModalId="add-resource-dialog"
        addModalTitle="Add link"
        addFormAction="/admin/content/resources"
        addSubmitLabel="Add link"
        addFormBody={
          <>
            <div class="form-field">
              <label for="category">Category</label>
              <input type="text" name="category" id="category" placeholder="e.g. Local Utilities" />
            </div>
            <div class="form-field">
              <label for="label">Label</label>
              <input type="text" name="label" id="label" required />
            </div>
            <div class="form-field">
              <label for="url">URL</label>
              <input type="url" name="url" id="url" required />
            </div>
          </>
        }
        listTitle="Links"
        listCount={items.length}
        emptyMessage="No resource links yet."
        hasItems={items.length > 0}
        tableHead={
          <tr>
            <th>Order</th>
            <th>Category</th>
            <th>Label</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={items.map((item) => <ResourceListRow item={item} key={item.id} />)}
        afterTable={items.map((item) => <ResourceEditModal item={item} key={item.id} />)}
      />
    </AdminShell>
  )
}
