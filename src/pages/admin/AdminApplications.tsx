import { parseApplicationPayload, type ApplicationRecord } from '../../lib/applications-db'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

const STATUSES = ['new', 'reviewed', 'approved', 'rejected'] as const

function ApplicationRow({ app }: { app: ApplicationRecord }) {
  const payload = parseApplicationPayload(app.payload_json)
  const summary = payload.company_name || payload.name || app.member_type || 'Application'
  const formId = `app-${app.id}`

  return (
    <tr>
      <td>
        <time dateTime={app.submitted_at}>
          {new Date(app.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
      </td>
      <td>{summary}</td>
      <td>{app.member_type ?? '—'}</td>
      <td>
        <select form={formId} name="status" class="admin-table-input">
          {STATUSES.map((s) => (
            <option value={s} selected={app.status === s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td>
        <details>
          <summary>Details</summary>
          <dl class="admin-detail-list">
            {Object.entries(payload).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      </td>
      <td>
        <form id={formId} method="post" action={`/admin/applications/${app.id}`}>
          <button type="submit" class="btn btn-secondary btn-sm">Update</button>
        </form>
      </td>
    </tr>
  )
}

export function AdminApplicationsPage({
  theme,
  ctx,
  applications,
  flash,
}: PageProps & { ctx: AdminContext; applications: ApplicationRecord[]; flash?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Join applications"
      activePath="/admin/applications"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      <section class="section">
        <h2>Queue ({applications.length})</h2>
        {applications.length > 0 ? (
          <table class="admin-members-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Summary</th>
                <th>Type</th>
                <th>Status</th>
                <th>Payload</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <ApplicationRow app={app} key={app.id} />
              ))}
            </tbody>
          </table>
        ) : (
          <p class="muted">No applications yet.</p>
        )}
      </section>
    </AdminShell>
  )
}
