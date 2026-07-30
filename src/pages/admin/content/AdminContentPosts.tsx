import type { PostRecord } from '../../../lib/posts-db'
import { toDatetimeLocalValue } from '../../../lib/datetime'
import { formatArchiveDate } from '../../../lib/format'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../../views/admin/AdminListSection'
import { AdminModal } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function postSearchText(post: PostRecord): string {
  return [
    post.title,
    post.slug,
    post.excerpt,
    post.published ? 'published' : 'draft',
    post.published_at ? formatArchiveDate(post.published_at) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function PostListRow({ post }: { post: PostRecord }) {
  const editModalId = `edit-post-${post.id}`

  return (
    <tr data-admin-list-row data-search={postSearchText(post)}>
      <td><strong>{post.title}</strong></td>
      <td><code class="admin-id">{post.slug}</code></td>
      <td>{post.published_at ? formatArchiveDate(post.published_at) : '—'}</td>
      <td>
        {post.published === 1 ? (
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

function PostEditModal({ post }: { post: PostRecord }) {
  const formId = `form-post-${post.id}`

  return (
    <AdminModal
      id={`edit-post-${post.id}`}
      title={`Edit ${post.title}`}
      formAction={`/admin/content/posts/${post.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/content/posts/${post.id}`}
          deleteAction={`/admin/content/posts/${post.id}/delete`}
        />
      }
    >
      <div class="form-field">
        <label for={`${formId}-title`}>Title</label>
        <input type="text" name="title" id={`${formId}-title`} value={post.title} required />
      </div>
      <div class="form-field">
        <label for={`${formId}-slug`}>Slug</label>
        <input type="text" name="slug" id={`${formId}-slug`} value={post.slug} required />
      </div>
      <div class="form-field">
        <label for={`${formId}-date`}>Published date</label>
        <input
          type="datetime-local"
          name="published_at"
          id={`${formId}-date`}
          value={post.published_at ? toDatetimeLocalValue(post.published_at) : ''}
        />
      </div>
      <div class="form-field">
        <label for={`${formId}-excerpt`}>Excerpt</label>
        <textarea name="excerpt" id={`${formId}-excerpt`} rows={3}>
          {post.excerpt ?? ''}
        </textarea>
      </div>
      <div class="form-field">
        <label for={`${formId}-body`}>Body (markdown)</label>
        <textarea name="body_md" id={`${formId}-body`} rows={10} required>
          {post.body_md}
        </textarea>
      </div>
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={post.published === 1} />
        Published on industry updates
      </label>
    </AdminModal>
  )
}

export function AdminContentPostsPage({
  theme,
  ctx,
  posts,
  flash,
}: PageProps & { ctx: AdminContext; posts: PostRecord[]; flash?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Industry updates"
      activePath="/admin/content"
    >
      <AdminCrudSections
        breadcrumb={
          <p class="admin-note">
            <a href="/admin/content">← Content</a> · <a href="/industry-updates">View public listing</a>
          </p>
        }
        flash={flash}
        addButtonLabel="New post"
        addModalId="add-post-dialog"
        addModalTitle="New post"
        addFormAction="/admin/content/posts"
        addSubmitLabel="Create post"
        addFormBody={
          <>
            <div class="form-field">
              <label for="title">Title</label>
              <input type="text" name="title" id="title" required />
            </div>
            <div class="form-field">
              <label for="slug">Slug (optional)</label>
              <input type="text" name="slug" id="slug" placeholder="auto-generated from title" />
            </div>
            <div class="form-field">
              <label for="excerpt">Excerpt</label>
              <textarea name="excerpt" id="excerpt" rows={2}></textarea>
            </div>
            <div class="form-field">
              <label for="body_md">Body (markdown)</label>
              <textarea name="body_md" id="body_md" rows={8} required></textarea>
            </div>
            <label class="admin-check">
              <input type="checkbox" name="published" value="1" />
              Publish immediately
            </label>
          </>
        }
        listTitle="Posts"
        listCount={posts.length}
        emptyMessage="No posts yet."
        hasItems={posts.length > 0}
        tableHead={
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={posts.map((post) => <PostListRow post={post} key={post.id} />)}
        afterTable={posts.map((post) => <PostEditModal post={post} key={post.id} />)}
      />
    </AdminShell>
  )
}
