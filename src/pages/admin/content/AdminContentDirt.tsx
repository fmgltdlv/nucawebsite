import type { DirtReleaseRecord } from '../../../lib/dirt-db'
import { mergeDirtFeed, type DirtFeedItem } from '../../../lib/dirt-feed'
import { formatArchiveDate } from '../../../lib/format'
import type { PostRecord } from '../../../lib/posts-db'
import { getAssetUrl } from '../../../lib/r2-assets'
import { AdminShell } from '../../../views/AdminShell'
import { AdminAssetPickerField } from '../../../views/admin/AdminAssetPickerField'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function dirtItemSearchText(item: DirtFeedItem): string {
  if (item.kind === 'post') {
    const post = item.post
    return [
      post.title,
      post.slug,
      post.excerpt,
      'post',
      'web post',
      post.published ? 'published' : 'draft',
      post.published_at ? formatArchiveDate(post.published_at) : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  }

  const release = item.release
  return [
    release.title,
    release.summary,
    'pdf',
    'release',
    release.published ? 'published' : 'draft',
    formatArchiveDate(release.published_at),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function DirtReleaseListRow({ release }: { release: DirtReleaseRecord }) {
  const editModalId = `edit-dirt-${release.id}`

  return (
    <tr data-admin-list-row data-search={dirtItemSearchText({ kind: 'release', release })}>
      <td><strong>{release.title}</strong></td>
      <td><span class="admin-asset-type-badge">PDF</span></td>
      <td>{formatArchiveDate(release.published_at)}</td>
      <td>
        {release.published === 1 ? (
          <span class="admin-status-badge admin-status-listed">Published</span>
        ) : (
          <span class="admin-status-badge admin-status-hidden">Draft</span>
        )}
      </td>
      <td class="admin-list-actions">
        <button type="button" class="btn btn-secondary btn-sm" data-admin-modal-open={editModalId}>
          Edit
        </button>
      </td>
    </tr>
  )
}

function DirtPostListRow({ post }: { post: PostRecord }) {
  return (
    <tr data-admin-list-row data-search={dirtItemSearchText({ kind: 'post', post })}>
      <td>
        <strong>{post.title}</strong>
        <div class="muted"><code class="admin-id">{post.slug}</code></div>
      </td>
      <td><span class="admin-asset-type-badge">Post</span></td>
      <td>{post.published_at ? formatArchiveDate(post.published_at) : '—'}</td>
      <td>
        {post.published === 1 ? (
          <span class="admin-status-badge admin-status-listed">Published</span>
        ) : (
          <span class="admin-status-badge admin-status-hidden">Draft</span>
        )}
      </td>
      <td class="admin-list-actions">
        <a class="btn btn-secondary btn-sm" href={`/admin/content/the-dirt/posts/${post.id}`}>
          Edit
        </a>
      </td>
    </tr>
  )
}

function DirtReleaseEditModal({ release }: { release: DirtReleaseRecord }) {
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
  ctx,
  releases,
  posts,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  releases: DirtReleaseRecord[]
  posts: PostRecord[]
  flash?: string
  error?: string
}) {
  const items = mergeDirtFeed(posts, releases)

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="THE DIRT"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · <a href="/the-dirt">View public listing</a>
            {' · '}
            <a href="/admin/content/pages/the-dirt">Edit page shell</a>
            {' · '}
            <a href="/admin/newsletter">Newsletter subscribers</a>
          </p>
        }
        flash={flash}
        error={error}
        addButtonLabel="Upload PDF"
        addModalId="add-dirt-dialog"
        addModalTitle="Upload PDF release"
        addFormAction="/admin/content/the-dirt"
        addFormEncType="multipart/form-data"
        addSubmitLabel="Upload & publish"
        addFormBody={
          <>
            <div class="form-field">
              <label for="dirt-title">Title</label>
              <input type="text" name="title" id="dirt-title" required />
            </div>
            <div class="form-field">
              <label for="dirt-published_at">Published date</label>
              <input type="date" name="published_at" id="dirt-published_at" required />
            </div>
            <div class="form-field">
              <label for="dirt-summary">Summary (optional)</label>
              <input type="text" name="summary" id="dirt-summary" />
            </div>
            <AdminAssetPickerField
              label="PDF file"
              kind="pdf"
              hiddenInputName="existing_pdf_key"
              fileInputName="pdf"
              fileInputId="dirt-pdf"
              fileAccept="application/pdf"
              hint="Upload a new PDF or choose an existing PDF from the library."
            />
          </>
        }
        secondaryAddLink={{
          buttonLabel: 'New post',
          href: '/admin/content/the-dirt/posts/new',
        }}
        listTitle="Feed"
        listCount={items.length}
        emptyMessage="No PDF releases or posts yet."
        hasItems={items.length > 0}
        tableHead={
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={items.map((item) =>
          item.kind === 'post' ? (
            <DirtPostListRow post={item.post} key={`post-${item.post.id}`} />
          ) : (
            <DirtReleaseListRow release={item.release} key={`release-${item.release.id}`} />
          ),
        )}
        afterTable={
          <>
            {releases.map((release) => (
              <DirtReleaseEditModal release={release} key={release.id} />
            ))}
          </>
        }
      />
    </AdminShell>
  )
}
