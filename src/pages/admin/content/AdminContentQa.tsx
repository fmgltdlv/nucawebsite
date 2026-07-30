import type { QaRecord } from '../../../lib/qa-db'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function QaEditRow({ item }: { item: QaRecord }) {
  const formId = `qa-${item.id}`
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
        <input
          form={formId}
          type="text"
          name="question"
          class="admin-table-input"
          value={item.question}
          required
        />
      </td>
      <td>
        <textarea form={formId} name="answer_md" class="admin-table-input" rows={3} required>
          {item.answer_md}
        </textarea>
      </td>
      <td>
        <label class="admin-check-inline">
          <input form={formId} type="checkbox" name="published" value="1" checked={item.published === 1} />
          Published
        </label>
      </td>
      <td>
        <form id={formId} method="post" action={`/admin/content/qa/${item.id}`}>
          <button type="submit" class="btn btn-secondary btn-sm">Save</button>
        </form>
        <form method="post" action={`/admin/content/qa/${item.id}/delete`} class="admin-inline-form">
          <button type="submit" class="btn btn-secondary btn-sm">Delete</button>
        </form>
      </td>
    </tr>
  )
}

export function AdminContentQaPage({
  theme,
  ctx,
  items,
  flash,
}: PageProps & { ctx: AdminContext; items: QaRecord[]; flash?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Q & A"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a> · <a href="/about/q-and-a">View public page</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      <section class="admin-form-section">
        <h2>Add question</h2>
        <form class="form" method="post" action="/admin/content/qa">
          <div class="form-field">
            <label for="question">Question</label>
            <input type="text" name="question" id="question" required />
          </div>
          <div class="form-field">
            <label for="answer_md">Answer (markdown)</label>
            <textarea name="answer_md" id="answer_md" rows={4} required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Add question</button>
        </form>
      </section>
      <section class="section">
        <h2>Questions ({items.length})</h2>
        {items.length > 0 ? (
          <table class="admin-members-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <QaEditRow item={item} key={item.id} />
              ))}
            </tbody>
          </table>
        ) : (
          <p class="muted">No questions yet.</p>
        )}
      </section>
    </AdminShell>
  )
}
