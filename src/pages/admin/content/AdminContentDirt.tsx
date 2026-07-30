import type { DirtReleaseRecord } from '../../../lib/dirt-db'
import { getAssetUrl } from '../../../lib/r2-assets'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' })
}

function DirtEditRow({ release }: { release: DirtReleaseRecord }) {
  const formId = `dirt-${release.id}`
  return (
    <tr>
      <td>
        <input form={formId} type="text" name="title" class="admin-table-input" value={release.title} required />
      </td>
      <td>
        <input
          form={formId}
          type="date"
          name="published_at"
          class="admin-table-input"
          value={release.published_at.slice(0, 10)}
          required
        />
      </td>
      <td>
        <input
          form={formId}
          type="text"
          name="summary"
          class="admin-table-input"
          value={release.summary ?? ''}
        />
      </td>
      <td>
        <a href={getAssetUrl(release.pdf_r2_key)} target="_blank" rel="noopener noreferrer">
          PDF
        </a>
        <input form={formId} type="file" name="pdf" accept="application/pdf" class="admin-table-file" />
      </td>
      <td>
        <label class="admin-check-inline">
          <input form={formId} type="checkbox" name="published" value="1" checked={release.published === 1} />
          Published
        </label>
      </td>
      <td>
        <form id={formId} method="post" action={`/admin/content/the-dirt/${release.id}`} encType="multipart/form-data">
          <button type="submit" class="btn btn-secondary btn-sm">Save</button>
        </form>
        <form method="post" action={`/admin/content/the-dirt/${release.id}/delete`} class="admin-inline-form">
          <button type="submit" class="btn btn-secondary btn-sm">Delete</button>
        </form>
      </td>
    </tr>
  )
}

export function AdminContentDirtPage({
  theme,
  ctx,
  releases,
  flash,
  error,
}: PageProps & {
  ctx: AdminContext
  releases: DirtReleaseRecord[]
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="THE DIRT"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a> · <a href="/about/the-dirt">View archive</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="admin-flash admin-flash-error">{error}</p>}
      <section class="admin-form-section">
        <h2>Upload release</h2>
        <form class="form" method="post" action="/admin/content/the-dirt" encType="multipart/form-data">
          <div class="form-field">
            <label for="title">Title</label>
            <input type="text" name="title" id="title" required />
          </div>
          <div class="form-field">
            <label for="published_at">Published date</label>
            <input type="date" name="published_at" id="published_at" required />
          </div>
          <div class="form-field">
            <label for="summary">Summary (optional)</label>
            <input type="text" name="summary" id="summary" />
          </div>
          <div class="form-field">
            <label for="pdf">PDF file</label>
            <input type="file" name="pdf" id="pdf" accept="application/pdf" required />
          </div>
          <button type="submit" class="btn btn-primary">Upload & publish</button>
        </form>
      </section>
      <section class="section">
        <h2>Releases ({releases.length})</h2>
        {releases.length > 0 ? (
          <table class="admin-members-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Summary</th>
                <th>PDF</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => (
                <DirtEditRow release={release} key={release.id} />
              ))}
            </tbody>
          </table>
        ) : (
          <p class="muted">No releases yet.</p>
        )}
      </section>
    </AdminShell>
  )
}
