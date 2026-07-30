import type { PostRecord } from '../../../lib/posts-db'
import { toDatetimeLocalValue } from '../../../lib/datetime'
import { AdminShell } from '../../../views/AdminShell'
import { AdminCrudSections } from '../../../views/admin/AdminCrudSections'
import { AdminEditActions } from '../../../views/admin/AdminEditActions'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function PostEditRow({ post }: { post: PostRecord }) {
  const formId = `post-${post.id}`
  return (
    <tr>
      <td>
        <input form={formId} type="text" name="title" class="admin-table-input" value={post.title} required />
      </td>
      <td>
        <input form={formId} type="text" name="slug" class="admin-table-input" value={post.slug} required />
      </td>
      <td>
        <input
          form={formId}
          type="datetime-local"
          name="published_at"
          class="admin-table-input"
          value={post.published_at ? toDatetimeLocalValue(post.published_at) : ''}
        />
      </td>
      <td>
        <label class="admin-check-inline">
          <input form={formId} type="checkbox" name="published" value="1" checked={post.published === 1} />
          Published
        </label>
      </td>
      <td>
        <textarea form={formId} name="excerpt" class="admin-table-input" rows={2}>
          {post.excerpt ?? ''}
        </textarea>
      </td>
      <td>
        <textarea form={formId} name="body_md" class="admin-table-input" rows={4} required>
          {post.body_md}
        </textarea>
      </td>
      <td>
        <AdminEditActions
          formId={formId}
          saveAction={`/admin/content/posts/${post.id}`}
          deleteAction={`/admin/content/posts/${post.id}/delete`}
        />
      </td>
    </tr>
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
        addTitle="New post"
        addForm={
          <form class="form" method="post" action="/admin/content/posts">
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
            <button type="submit" class="btn btn-primary">Create post</button>
          </form>
        }
        listTitle="Posts"
        listCount={posts.length}
        emptyMessage="No posts yet."
        hasItems={posts.length > 0}
        table={
          <table class="admin-members-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Date</th>
                <th>Status</th>
                <th>Excerpt</th>
                <th>Body</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <PostEditRow post={post} key={post.id} />
              ))}
            </tbody>
          </table>
        }
      />
    </AdminShell>
  )
}
