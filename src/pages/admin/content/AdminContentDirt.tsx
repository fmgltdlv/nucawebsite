import type { DirtReleaseRecord } from '../../../lib/dirt-db'
import { getAssetUrl } from '../../../lib/r2-assets'
import { formatArchiveDate } from '../../../lib/format'
import { AdminShell } from '../../../views/AdminShell'
import { AdminAssetPickerField } from '../../../views/admin/AdminAssetPickerField'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function dirtSearchText(release: DirtReleaseRecord): string {
  return [
    release.title,
    release.summary,
    release.published ? 'published' : 'draft',
    formatArchiveDate(release.published_at),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function DirtListRow({ release }: { release: DirtReleaseRecord }) {
  const editModalId = `edit-dirt-${release.id}`

  return (
    <tr data-admin-list-row data-search={dirtSearchText(release)}>
      <td><strong>{release.title}</strong></td>
      <td>{formatArchiveDate(release.published_at)}</td>
      <td>
        {release.published === 1 ? (
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

function DirtEditModal({ release }: { release: DirtReleaseRecord }) {
  const formId = `form-dirt-${release.id}`

  return (
    <AdminModal
      id={`edit-dirt-${release.id}`}
      title={`Edit ${release.title}`}
      formAction={`/admin/content/the-dirt/${release.id}`}
      formEncType="multipart/form-data"
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/the-dirt/${release.id}`}
          deleteAction={`/admin/content/the-dirt/${release.id}/delete`}
        />
      }
    >
      <div class="form-field">
        <label for={`${formId}-title`}>Title</label>
        <input type="text" name="title" id={`${formId}-title`} value={release.title} required />
      </div>
      <div class="form-field">
        <label for={`${formId}-date`}>Published date</label>
        <input
          type="date"
          name="published_at"
          id={`${formId}-date`}
          value={release.published_at.slice(0, 10)}
          required
        />
      </div>
      <div class="form-field">
        <label for={`${formId}-summary`}>Summary</label>
        <textarea name="summary" id={`${formId}-summary`} rows={3}>
          {release.summary ?? ''}
        </textarea>
      </div>
      <AdminAssetPickerField
        label="PDF"
        kind="pdf"
        hiddenInputName="existing_pdf_key"
        fileInputName="pdf"
        fileInputId={`${formId}-pdf`}
        fileAccept="application/pdf"
        currentKey={release.pdf_r2_key}
        currentUrl={getAssetUrl(release.pdf_r2_key)}
        hint="Upload a replacement PDF or choose an existing PDF from the library."
      />
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={release.published === 1} />
        Published in THE DIRT
      </label>
    </AdminModal>
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
      inboxCounts={ctx.inboxCounts}
      title="THE DIRT"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · <a href="/the-dirt">View public listing</a>
          </p>
        }
        flash={flash}
        error={error}
        addButtonLabel="Upload release"
        addModalId="add-dirt-dialog"
        addModalTitle="Upload release"
        addFormAction="/admin/content/the-dirt"
        addFormEncType="multipart/form-data"
        addSubmitLabel="Upload & publish"
        addFormBody={
          <>
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
            <AdminAssetPickerField
              label="PDF file"
              kind="pdf"
              hiddenInputName="existing_pdf_key"
              fileInputName="pdf"
              fileInputId="pdf"
              fileAccept="application/pdf"
              hint="Upload a new PDF or choose an existing PDF from the library."
            />
          </>
        }
        listTitle="Releases"
        listCount={releases.length}
        emptyMessage="No releases yet."
        hasItems={releases.length > 0}
        tableHead={
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={releases.map((release) => <DirtListRow release={release} key={release.id} />)}
        afterTable={releases.map((release) => <DirtEditModal release={release} key={release.id} />)}
      />
    </AdminShell>
  )
}
