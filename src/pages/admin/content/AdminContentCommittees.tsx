import type { CommitteeRecord } from '../../../lib/committees-db'
import { committeePublicPath } from '../../../lib/committee-pages'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function committeeSearchText(item: CommitteeRecord): string {
  return [item.name, item.key, item.published ? 'published' : 'draft', String(item.sort_order)]
    .join(' ')
    .toLowerCase()
}

function CommitteeListRow({ item }: { item: CommitteeRecord }) {
  const editModalId = `edit-committee-${item.id}`

  return (
    <tr data-admin-list-row data-search={committeeSearchText(item)}>
      <td>{item.sort_order}</td>
      <td>
        <strong>{item.name}</strong>
        <br />
        <span class="admin-muted">{item.key}</span>
      </td>
      <td>
        {item.published === 1 ? (
          <span class="admin-status-badge admin-status-listed">Published</span>
        ) : (
          <span class="admin-status-badge admin-status-hidden">Draft</span>
        )}
      </td>
      <td class="admin-list-actions">
        <a class="btn btn-ghost btn-sm" href={`/admin/content/pages/committee-${item.key}`}>
          Edit page
        </a>{' '}
        <AdminEditButton modalId={editModalId} />
      </td>
    </tr>
  )
}

function CommitteeEditModal({ item }: { item: CommitteeRecord }) {
  const formId = `form-committee-${item.id}`

  return (
    <AdminModal
      id={`edit-committee-${item.id}`}
      title="Edit committee"
      formAction={`/admin/content/committees/${item.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/committees/${item.id}`}
          deleteAction={`/admin/content/committees/${item.id}/delete`}
        />
      }
    >
      <div class="form-field">
        <label>Key</label>
        <input type="text" value={item.key} disabled />
        <p class="form-hint">The URL key cannot be changed after creation.</p>
      </div>
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
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={item.published === 1} />
        Published on committees page and navigation
      </label>
      <p class="form-hint">
        Public page: <a href={committeePublicPath(item.key)}>{committeePublicPath(item.key)}</a>
      </p>
    </AdminModal>
  )
}

export function AdminContentCommitteesPage({
  ctx,
  items,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  items: CommitteeRecord[]
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      title="Committees"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · <a href="/about/committees">View public page</a>
          </p>
        }
        flash={flash}
        error={error}
        addButtonLabel="Add committee"
        addModalId="add-committee-dialog"
        addModalTitle="Add committee"
        addFormAction="/admin/content/committees"
        addSubmitLabel="Add committee"
        addFormBody={
          <>
            <div class="form-field">
              <label for="name">Name</label>
              <input type="text" name="name" id="name" required placeholder="Legislative Committee" />
            </div>
            <div class="form-field">
              <label for="key">URL key (optional)</label>
              <input
                type="text"
                name="key"
                id="key"
                placeholder="legislative"
                pattern="[a-z][a-z0-9_]*"
              />
              <p class="form-hint">
                Lowercase letters, numbers, and underscores. Leave blank to generate from the name.
              </p>
            </div>
          </>
        }
        listTitle="Committees"
        listCount={items.length}
        emptyMessage="No committees yet."
        hasItems={items.length > 0}
        tableHead={
          <tr>
            <th>Order</th>
            <th>Committee</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={items.map((item) => <CommitteeListRow item={item} key={item.id} />)}
        afterTable={items.map((item) => <CommitteeEditModal item={item} key={item.id} />)}
      />
    </AdminShell>
  )
}
