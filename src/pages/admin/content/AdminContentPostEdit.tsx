import { toDatetimeLocalValue } from '../../../lib/datetime'
import { renderMarkdown } from '../../../lib/markdown'
import { getAssetUrl } from '../../../lib/r2-assets'
import type { PostRecord } from '../../../lib/posts-db'
import { AdminShell } from '../../../views/AdminShell'
import { AdminAssetPickerField } from '../../../views/admin/AdminAssetPickerField'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function initialBodyHtml(post: PostRecord | null): string {
  if (post?.body_html?.trim()) return post.body_html
  if (post?.body_md?.trim()) return renderMarkdown(post.body_md)
  return '<p></p>'
}

export function AdminContentPostEditPage({
  ctx,
  post,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  post: PostRecord | null
  flash?: string
  error?: string
}) {
  const isNew = !post
  const formAction = isNew
    ? '/admin/content/the-dirt/posts/new'
    : `/admin/content/the-dirt/posts/${post.id}`
  const title = isNew ? 'New DIRT post' : `Edit: ${post.title}`
  const bodyHtml = initialBodyHtml(post)

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title={title}
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content/the-dirt">← THE DIRT</a>
        {!isNew && post.published === 1 && (
          <>
            {' · '}
            <a href={`/industry-updates/${post.slug}`} target="_blank" rel="noopener noreferrer">
              View public post
            </a>
          </>
        )}
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="admin-flash admin-flash-error">{error}</p>}

      <form method="post" action={formAction} enctype="multipart/form-data" class="admin-post-edit-form">
        <div class="form-field">
          <label for="post-title">Title</label>
          <input type="text" name="title" id="post-title" value={post?.title ?? ''} required />
        </div>
        <div class="form-field">
          <label for="post-slug">Slug {isNew ? '(optional)' : ''}</label>
          <input
            type="text"
            name="slug"
            id="post-slug"
            value={post?.slug ?? ''}
            placeholder={isNew ? 'auto-generated from title' : undefined}
            required={!isNew}
          />
        </div>
        <div class="form-field">
          <label for="post-published_at">Published date</label>
          <input
            type="datetime-local"
            name="published_at"
            id="post-published_at"
            value={post?.published_at ? toDatetimeLocalValue(post.published_at) : ''}
          />
        </div>
        <div class="form-field">
          <label for="post-excerpt">Excerpt</label>
          <textarea name="excerpt" id="post-excerpt" rows={3}>
            {post?.excerpt ?? ''}
          </textarea>
        </div>

        <AdminAssetPickerField
          label="Cover photo"
          kind="image"
          hiddenInputName="existing_cover_key"
          fileInputName="cover"
          fileInputId="post-cover"
          fileAccept="image/jpeg,image/png,image/webp,image/gif"
          currentKey={post?.cover_r2_key}
          currentUrl={post?.cover_r2_key ? getAssetUrl(post.cover_r2_key) : null}
          removeCheckboxName="remove_cover"
          hint="Optional. Shown on THE DIRT archive and at the top of the post."
        />
        <div class="form-field">
          <label for="post-cover-alt">Cover alt text</label>
          <input type="text" name="cover_alt" id="post-cover-alt" value={post?.cover_alt ?? ''} />
        </div>

        <div class="form-field">
          <span class="form-field-label">Body</span>
          <div class="dirt-post-editor" data-dirt-post-editor>
            <div class="dirt-editor-toolbar" data-dirt-editor-toolbar></div>
            <div class="dirt-editor-mount prose" data-dirt-editor-mount></div>
            <textarea name="body_html" data-dirt-editor-input class="visually-hidden" required>
              {bodyHtml}
            </textarea>
          </div>
          <p class="muted admin-help">
            Use the toolbar for formatting, images (presets or custom %), image+text layouts, and carousels.
            Images come from the asset library.
          </p>
        </div>

        <label class="admin-check">
          <input
            type="checkbox"
            name="published"
            value="1"
            checked={isNew ? false : post.published === 1}
          />
          Published on THE DIRT
        </label>

        <div class="admin-post-edit-actions">
          <button type="submit" class="btn btn-primary">
            {isNew ? 'Create post' : 'Save post'}
          </button>
        </div>
      </form>
      {!isNew && (
        <form
          method="post"
          action={`/admin/content/the-dirt/posts/${post.id}/delete`}
          class="admin-post-edit-actions"
          onsubmit="return confirm('Delete this post?')"
        >
          <button type="submit" class="btn btn-danger">
            Delete
          </button>
        </form>
      )}

      <link rel="stylesheet" href="/admin-post-editor.css" />
      <script src="/admin-post-editor.js" defer></script>
    </AdminShell>
  )
}
