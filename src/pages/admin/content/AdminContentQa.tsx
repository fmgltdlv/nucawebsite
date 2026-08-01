import type { QaRecord } from '../../../lib/qa-db'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function qaSearchText(item: QaRecord): string {
  return [item.question, item.answer_md, item.published ? 'published' : 'draft', String(item.sort_order)]
    .join(' ')
    .toLowerCase()
}

function QaListRow({ item }: { item: QaRecord }) {
  const editModalId = `edit-qa-${item.id}`

  return (
    <tr data-admin-list-row data-search={qaSearchText(item)}>
      <td>{item.sort_order}</td>
      <td><strong>{item.question}</strong></td>
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

function QaEditModal({ item }: { item: QaRecord }) {
  const formId = `form-qa-${item.id}`

  return (
    <AdminModal
      id={`edit-qa-${item.id}`}
      title="Edit question"
      formAction={`/admin/content/qa/${item.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/qa/${item.id}`}
          deleteAction={`/admin/content/qa/${item.id}/delete`}
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
        <label for={`${formId}-question`}>Question</label>
        <input
          type="text"
          name="question"
          id={`${formId}-question`}
          value={item.question}
          required
        />
      </div>
      <div class="form-field">
        <label for={`${formId}-answer`}>Answer (markdown)</label>
        <textarea name="answer_md" id={`${formId}-answer`} rows={6} required>
          {item.answer_md}
        </textarea>
      </div>
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={item.published === 1} />
        Published on public Q &amp; A page
      </label>
    </AdminModal>
  )
}

export function AdminContentQaPage({
  ctx,
  items,
  flash,
  ...site
}: PageProps & { ctx: AdminContext; items: QaRecord[]; flash?: string }) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="FAQ"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · <a href="/about/faq">View public page</a>
          </p>
        }
        flash={flash}
        addButtonLabel="Add question"
        addModalId="add-qa-dialog"
        addModalTitle="Add question"
        addFormAction="/admin/content/qa"
        addSubmitLabel="Add question"
        addFormBody={
          <>
            <div class="form-field">
              <label for="question">Question</label>
              <input type="text" name="question" id="question" required />
            </div>
            <div class="form-field">
              <label for="answer_md">Answer (markdown)</label>
              <textarea name="answer_md" id="answer_md" rows={4} required></textarea>
            </div>
          </>
        }
        listTitle="Questions"
        listCount={items.length}
        emptyMessage="No questions yet."
        hasItems={items.length > 0}
        tableHead={
          <tr>
            <th>Order</th>
            <th>Question</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={items.map((item) => <QaListRow item={item} key={item.id} />)}
        afterTable={items.map((item) => <QaEditModal item={item} key={item.id} />)}
      />
    </AdminShell>
  )
}
