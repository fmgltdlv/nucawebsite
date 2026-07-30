import type { ResourceItemRecord } from '../../../lib/resource-items-db'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditActions } from '../../../views/admin/AdminEditActions'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function ResourceEditRow({ item }: { item: ResourceItemRecord }) {
  const formId = `resource-${item.id}`
  return (
    <tr>
      <td>
        <input
          form={formId}
          type="number"
          name="sort_order"
          class="admin-table-input admin-table-input-narrow"
          value={String(item.sort_order)}
        />
      </td>
      <td>
        <input form={formId} type="text" name="label" class="admin-table-input" value={item.label} required />
      </td>
      <td>
        <input form={formId} type="url" name="url" class="admin-table-input" value={item.url} required />
      </td>
      <td>
        <label class="admin-check-inline">
          <input form={formId} type="checkbox" name="published" value="1" checked={item.published === 1} />
          Published
        </label>
      </td>
      <td>
        <AdminEditActions
          formId={formId}
          saveAction={`/admin/content/resources/${item.id}`}
          deleteAction={`/admin/content/resources/${item.id}/delete`}
        />
      </td>
    </tr>
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
        addTitle="Add link"
        addForm={
          <form class="form" method="post" action="/admin/content/resources">
            <div class="form-field">
              <label for="label">Label</label>
              <input type="text" name="label" id="label" required />
            </div>
            <div class="form-field">
              <label for="url">URL</label>
              <input type="url" name="url" id="url" required />
            </div>
            <button type="submit" class="btn btn-primary">Add link</button>
          </form>
        }
        listTitle="Links"
        listCount={items.length}
        emptyMessage="No resource links yet."
        hasItems={items.length > 0}
        table={
          <table class="admin-members-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Label</th>
                <th>URL</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ResourceEditRow item={item} key={item.id} />
              ))}
            </tbody>
          </table>
        }
      />
    </AdminShell>
  )
}
