import type { NavItemRecord } from '../../../lib/nav-items-db'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function parentLabel(item: NavItemRecord, items: NavItemRecord[]): string {
  if (!item.parent_id) return '—'
  const parent = items.find((entry) => entry.id === item.parent_id)
  return parent?.label ?? '—'
}

function navSearchText(item: NavItemRecord, items: NavItemRecord[]): string {
  return [
    parentLabel(item, items),
    item.label,
    item.href,
    item.published ? 'published' : 'draft',
    item.indent ? 'indented' : '',
    String(item.sort_order),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function ParentSelect({
  formId,
  groups,
  value,
}: {
  formId: string
  groups: NavItemRecord[]
  value?: string | null
}) {
  return (
    <div class="form-field">
      <label for={`${formId}-parent`}>Parent menu (optional)</label>
      <select name="parent_id" id={`${formId}-parent`}>
        <option value="" selected={!value}>
          Top level
        </option>
        {groups.map((group) => (
          <option value={group.id} selected={value === group.id}>
            {group.label}
          </option>
        ))}
      </select>
      <p class="form-hint">Choose a parent to create a submenu item. Top-level items with children become dropdown menus.</p>
    </div>
  )
}

function NavListRow({ item, items }: { item: NavItemRecord; items: NavItemRecord[] }) {
  const editModalId = `edit-nav-${item.id}`

  return (
    <tr data-admin-list-row data-search={navSearchText(item, items)}>
      <td>{item.sort_order}</td>
      <td>{parentLabel(item, items)}</td>
      <td>
        <strong>{item.indent === 1 ? '↳ ' : ''}{item.label}</strong>
      </td>
      <td>{item.href || '—'}</td>
      <td>
        {item.published === 1 ? (
          <span class="admin-status-badge admin-status-listed">Published</span>
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

function NavEditModal({ item, groups }: { item: NavItemRecord; groups: NavItemRecord[] }) {
  const formId = `form-nav-${item.id}`
  const selectableGroups = groups.filter((group) => group.id !== item.id)

  return (
    <AdminModal
      id={`edit-nav-${item.id}`}
      title={`Edit ${item.label}`}
      formAction={`/admin/content/navigation/${item.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/navigation/${item.id}`}
          deleteAction={`/admin/content/navigation/${item.id}/delete`}
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
      <ParentSelect formId={formId} groups={selectableGroups} value={item.parent_id} />
      <div class="form-field">
        <label for={`${formId}-label`}>Label</label>
        <input type="text" name="label" id={`${formId}-label`} value={item.label} required />
      </div>
      <div class="form-field">
        <label for={`${formId}-href`}>Link URL</label>
        <input type="text" name="href" id={`${formId}-href`} value={item.href} placeholder="/about or https://..." />
        <p class="form-hint">Leave blank for a label-only parent menu item.</p>
      </div>
      <label class="admin-check">
        <input type="checkbox" name="indent" value="1" checked={item.indent === 1} />
        Indent in submenu
      </label>
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={item.published === 1} />
        Show in site navigation
      </label>
    </AdminModal>
  )
}

export function AdminContentNavigationPage({
  theme,
  ctx,
  items,
  groups,
  flash,
  error,
}: PageProps & {
  ctx: AdminContext
  items: NavItemRecord[]
  groups: NavItemRecord[]
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Navigation"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · Changes appear in the public header menu.
          </p>
        }
        flash={flash}
        error={error}
        addButtonLabel="Add menu item"
        addModalId="add-nav-dialog"
        addModalTitle="Add menu item"
        addFormAction="/admin/content/navigation"
        addSubmitLabel="Add item"
        addFormBody={
          <>
            <div class="form-field">
              <label for="label">Label</label>
              <input type="text" name="label" id="label" required />
            </div>
            <ParentSelect formId="add-nav" groups={groups} />
            <div class="form-field">
              <label for="href">Link URL</label>
              <input type="text" name="href" id="href" placeholder="/about or https://..." />
            </div>
            <label class="admin-check">
              <input type="checkbox" name="indent" value="1" />
              Indent in submenu
            </label>
            <label class="admin-check">
              <input type="checkbox" name="published" value="1" checked />
              Show in site navigation
            </label>
          </>
        }
        listTitle="Menu items"
        listCount={items.length}
        emptyMessage="No navigation items yet."
        hasItems={items.length > 0}
        tableHead={
          <tr>
            <th>Order</th>
            <th>Parent</th>
            <th>Label</th>
            <th>URL</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={items.map((item) => <NavListRow item={item} items={items} key={item.id} />)}
        afterTable={items.map((item) => <NavEditModal item={item} groups={groups} key={item.id} />)}
      />
    </AdminShell>
  )
}
