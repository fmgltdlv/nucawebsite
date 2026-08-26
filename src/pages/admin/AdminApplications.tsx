import { parseApplicationPayload, type ApplicationPayload, type ApplicationRecord } from '../../lib/applications-db'
import { getAssetUrl } from '../../lib/r2-assets'
import { AdminShell } from '../../views/AdminShell'
import { AdminEditButton, AdminListSection, AdminListSearch } from '../../views/admin/AdminListSection'
import { AdminInboxToolbar } from '../../views/admin/AdminInboxToolbar'
import { AdminEditModalFooter } from '../../views/admin/AdminEditActions'
import { AdminModal } from '../../views/admin/AdminModal'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

const STATUSES = ['new', 'reviewed', 'approved', 'rejected'] as const

function applicationSummary(payload: ApplicationPayload, memberType: string | null): string {
  return payload.company_name || payload.name || payload.contact_name || memberType || 'Application'
}

function applicationSearchText(app: ApplicationRecord): string {
  const payload = parseApplicationPayload(app.payload_json)
  return [
    payload.company_name,
    payload.name,
    payload.contact_name,
    app.member_type,
    app.status,
    app.submitted_at,
    ...Object.values(payload),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function ApplicationListRow({ app }: { app: ApplicationRecord }) {
  const payload = parseApplicationPayload(app.payload_json)
  const summary = applicationSummary(payload, app.member_type)
  const editModalId = `edit-app-${app.id}`

  return (
    <tr data-admin-list-row data-search={applicationSearchText(app)}>
      <td>
        <time dateTime={app.submitted_at}>
          {new Date(app.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
      </td>
      <td><strong>{summary}</strong></td>
      <td>{app.member_type ?? '—'}</td>
      <td>
        <span class={`admin-status-badge admin-status-app-${app.status}`}>{app.status}</span>
      </td>
      <td class="admin-list-actions">
        {app.status === 'new' && (
          <form method="post" action={`/admin/applications/${app.id}`} class="admin-inline-form">
            <input type="hidden" name="status" value="reviewed" />
            <button type="submit" class="btn btn-secondary btn-sm">Acknowledge</button>
          </form>
        )}
        <AdminEditButton modalId={editModalId} label="Review" />
      </td>
    </tr>
  )
}

function ApplicationEditModal({ app }: { app: ApplicationRecord }) {
  const payload = parseApplicationPayload(app.payload_json)
  const formId = `form-app-${app.id}`
  const summary = applicationSummary(payload, app.member_type)
  const pdfKey = payload.pdf_key
  const detailEntries = Object.entries(payload).filter(([key]) => key !== 'pdf_key')

  return (
    <AdminModal
      id={`edit-app-${app.id}`}
      title={`Review: ${summary}`}
      formAction={`/admin/applications/${app.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/applications/${app.id}`}
          deleteAction={`/admin/applications/${app.id}/delete`}
          saveLabel="Update status"
          deleteLabel="Delete"
        />
      }
    >
      {pdfKey ? (
        <p class="admin-detail-pdf-link">
          <a class="btn btn-secondary" href={getAssetUrl(pdfKey)} target="_blank" rel="noopener noreferrer">
            Download application PDF
          </a>
        </p>
      ) : null}
      <dl class="admin-detail-list admin-detail-list-modal">
        {detailEntries.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div class="form-field">
        <label for={`${formId}-status`}>Status</label>
        <select name="status" id={`${formId}-status`} class="admin-table-input">
          {STATUSES.map((s) => (
            <option value={s} selected={app.status === s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </AdminModal>
  )
}

export function AdminApplicationsPage({
  ctx,
  applications,
  flash,
  ...site
}: PageProps & { ctx: AdminContext; applications: ApplicationRecord[]; flash?: string }) {
  const newCount = applications.filter((app) => app.status === 'new').length

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Join applications"
      activePath="/admin/applications"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}

      <AdminInboxToolbar
        newCount={newCount}
        acknowledgeAction="/admin/applications/acknowledge-all"
        acknowledgeLabel="Mark all as reviewed"
      />

      <AdminListSection
        title="Queue"
        count={applications.length}
        emptyMessage="No applications yet."
        hasItems={applications.length > 0}
        toolbar={<AdminListSearch />}
        tableHead={
          <tr>
            <th>Submitted</th>
            <th>Summary</th>
            <th>Type</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={applications.map((app) => <ApplicationListRow app={app} key={app.id} />)}
        afterTable={applications.map((app) => <ApplicationEditModal app={app} key={app.id} />)}
      />
    </AdminShell>
  )
}
