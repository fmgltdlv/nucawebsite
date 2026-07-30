import type { ResourceItemRecord } from '../../../lib/resource-items-db'
import { AdminShell } from '../../../views/AdminShell'
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
        <form id={formId} method="post" action={`/admin/content/resources/${item.id}`}>
          <button type="submit" class="btn btn-secondary btn-sm">Save</button>
        </form>
        <form method="post" action={`/admin/content/resources/${item.id}/delete`} class="admin-inline-form">
          <button type="submit" class="btn btn-secondary btn-sm">Delete</button>
        </form>
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
      <p class="admin-note">
        <a href="/admin/content">← Content</a> · <a href="/resources">View Resources page</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      <section class="admin-form-section">
        <h2>Add link</h2>
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
      </section>
      <section class="section">
        <h2>Links ({items.length})</h2>
        {items.length > 0 ? (
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
        ) : (
          <p class="muted">No resource links yet.</p>
        )}
      </section>
    </AdminShell>
  )
}
