import type { ContactSubmission } from '../../lib/contact-db'
import { AdminShell } from '../../views/AdminShell'
import { AdminEditButton, AdminListSection, AdminListSearch } from '../../views/admin/AdminListSection'
import { AdminInboxToolbar } from '../../views/admin/AdminInboxToolbar'
import { AdminEditModalFooter } from '../../views/admin/AdminEditActions'
import { AdminModal } from '../../views/admin/AdminModal'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

const STATUSES = ['new', 'read', 'archived'] as const

function messageSearchText(submission: ContactSubmission): string {
  return [submission.name, submission.email, submission.message, submission.status, submission.submitted_at]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function messagePreview(message: string): string {
  const trimmed = message.trim()
  if (trimmed.length <= 80) return trimmed
  return `${trimmed.slice(0, 77)}…`
}

function ContactMessageListRow({ submission }: { submission: ContactSubmission }) {
  const editModalId = `view-contact-${submission.id}`

  return (
    <tr data-admin-list-row data-search={messageSearchText(submission)}>
      <td>
        <time dateTime={submission.submitted_at}>
          {new Date(submission.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
      </td>
      <td><strong>{submission.name}</strong></td>
      <td>
        <a href={`mailto:${submission.email}`}>{submission.email}</a>
      </td>
      <td>{messagePreview(submission.message)}</td>
      <td>
        <span class={`admin-status-badge admin-status-contact-${submission.status}`}>{submission.status}</span>
      </td>
      <td class="admin-list-actions">
        {submission.status === 'new' && (
          <form method="post" action={`/admin/contact-messages/${submission.id}`} class="admin-inline-form">
            <input type="hidden" name="status" value="read" />
            <button type="submit" class="btn btn-secondary btn-sm">Acknowledge</button>
          </form>
        )}
        <AdminEditButton modalId={editModalId} label="View" />
      </td>
    </tr>
  )
}

function ContactMessageModal({ submission }: { submission: ContactSubmission }) {
  const formId = `form-contact-${submission.id}`

  return (
    <AdminModal
      id={`view-contact-${submission.id}`}
      title={`Message from ${submission.name}`}
      formAction={`/admin/contact-messages/${submission.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/contact-messages/${submission.id}`}
          deleteAction={`/admin/contact-messages/${submission.id}/delete`}
          saveLabel="Update status"
          deleteLabel="Delete"
        />
      }
    >
      <dl class="admin-detail-list admin-detail-list-modal">
        <div>
          <dt>Submitted</dt>
          <dd>
            <time dateTime={submission.submitted_at}>
              {new Date(submission.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </time>
          </dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>{submission.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${submission.email}`}>{submission.email}</a>
          </dd>
        </div>
        <div>
          <dt>Message</dt>
          <dd class="admin-message-body">{submission.message}</dd>
        </div>
      </dl>
      <div class="form-field">
        <label for={`${formId}-status`}>Status</label>
        <select name="status" id={`${formId}-status`} class="admin-table-input">
          {STATUSES.map((status) => (
            <option value={status} selected={submission.status === status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </AdminModal>
  )
}

export function AdminContactMessagesPage({
  ctx,
  submissions,
  flash,
  ...site
}: PageProps & { ctx: AdminContext; submissions: ContactSubmission[]; flash?: string }) {
  const newCount = submissions.filter((submission) => submission.status === 'new').length

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      inboxCounts={ctx.inboxCounts}
      title="Contact messages"
      activePath="/admin/contact-messages"
    >
      <p class="admin-note">
        Messages submitted through the public Contact form. Email notifications are sent when configured; all
        submissions are stored here regardless.
      </p>
      {flash && <p class="admin-flash">{flash}</p>}

      <AdminInboxToolbar
        newCount={newCount}
        acknowledgeAction="/admin/contact-messages/acknowledge-all"
        acknowledgeLabel="Mark all as read"
      />

      <AdminListSection
        title="Inbox"
        count={submissions.length}
        emptyMessage="No contact messages yet."
        hasItems={submissions.length > 0}
        toolbar={<AdminListSearch />}
        tableHead={
          <tr>
            <th>Submitted</th>
            <th>Name</th>
            <th>Email</th>
            <th>Message</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={submissions.map((submission) => (
          <ContactMessageListRow submission={submission} key={submission.id} />
        ))}
        afterTable={submissions.map((submission) => (
          <ContactMessageModal submission={submission} key={submission.id} />
        ))}
      />
    </AdminShell>
  )
}
