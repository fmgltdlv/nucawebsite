import type { PageRecord } from '../../../lib/pages-db'
import type { CommitteeRecord } from '../../../lib/committees-db'
import { blocksFromMarkdown, parsePageBlocks, serializePageBlocks } from '../../../lib/page-blocks'
import { pagePreviewDraftPath, pagePreviewPath, pagePublicPath } from '../../../lib/page-paths'
import { isCustomPage } from '../../../lib/pages-db'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function initialBlocksJson(page: PageRecord | null): string {
  const fromJson = parsePageBlocks(page?.body_json ?? null)
  if (fromJson) return serializePageBlocks(fromJson)
  const fromMd = blocksFromMarkdown(page?.body_md ?? '')
  if (fromMd.length > 0) return serializePageBlocks(fromMd)
  return '[]'
}

export function AdminContentPageEditPage({
  ctx,
  page,
  slug,
  pageLabel,
  committees,
  flash,
  ...site
}: PageProps & {
  ctx: AdminContext
  page: PageRecord | null
  slug: string
  pageLabel: string
  committees: CommitteeRecord[]
  flash?: string
}) {
  const label = pageLabel
  const publicPath = pagePublicPath(slug)
  const previewPath = pagePreviewPath(slug)
  const previewDraftPath = pagePreviewDraftPath(slug)
  const blocksJson = initialBlocksJson(page)
  const committeesJson = JSON.stringify(committees.map((committee) => ({
    key: committee.key,
    name: committee.name,
  })))

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title={`Edit: ${label}`}
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content/pages">← Pages</a>
        {' · '}
        <a href={previewPath} target="_blank" rel="noopener noreferrer">
          Saved preview
        </a>
        {page?.published !== 0 && (
          <>
            {' · '}
            <a href={publicPath}>View public page</a>
          </>
        )}
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      {page && isCustomPage(page) ? (
        <p class="admin-help">
          Public URL: <a href={publicPath}>{publicPath}</a>
          {' · '}
          <form
            method="post"
            action={`/admin/content/pages/${slug}/delete`}
            class="admin-inline-form"
            onsubmit="return confirm('Delete this page permanently?')"
          >
            <button type="submit" class="admin-link-button">Delete page</button>
          </form>
        </p>
      ) : null}
      <form
        class="form form-wide admin-form-section page-edit-form"
        method="post"
        action={`/admin/content/pages/${slug}`}
        data-preview-draft-url={previewDraftPath}
      >
        <div class="page-edit-layout">
          <div class="page-edit-panel page-edit-panel--editor">
            <div class="form-field">
              <label for="title">Page title</label>
              <input type="text" name="title" id="title" value={page?.title ?? label} required />
            </div>
            <div class="form-field">
              <label for="meta_description">Meta description (optional)</label>
              <input
                type="text"
                name="meta_description"
                id="meta_description"
                value={page?.meta_description ?? ''}
              />
            </div>

            <div class="form-field">
              <label>Page content</label>
              <p class="admin-help">
                {slug === 'home'
                  ? 'Build the home page with a hero banner, upcoming events list, and THE DIRT feed. Event and news items are pulled automatically from the calendar and THE DIRT content.'
                  : 'Build the page with sections, headings, paragraphs, lists, callout boxes, and event calendars. Style text color, fonts, and section backgrounds. The preview updates as you edit.'}
              </p>
              <div
                id="page-blocks-editor"
                class="page-blocks-editor"
                data-initial={blocksJson}
                data-committees={committeesJson}
                data-page-slug={slug}
              ></div>
              <input type="hidden" name="body_json" id="body_json" value={blocksJson} />
            </div>

            <details class="admin-advanced">
              <summary>Advanced: markdown fallback</summary>
              <div class="form-field">
                <label for="body_md">Body (markdown)</label>
                <p class="admin-help">
                  Used only when no blocks are saved. Saving with blocks above will auto-generate
                  this field.
                </p>
                <textarea name="body_md" id="body_md" rows={8}>
                  {page?.body_md ?? ''}
                </textarea>
              </div>
            </details>

            <label class="admin-check">
              <input type="checkbox" name="published" value="1" checked={page?.published !== 0} />
              Published
            </label>
            <button type="submit" class="btn btn-primary">Save page</button>
          </div>

          <aside class="page-edit-panel page-edit-panel--preview" aria-label="Live page preview">
            <div class="page-edit-preview-header">
              <div class="page-edit-preview-heading">
                <h2 class="page-edit-preview-title">Live preview</h2>
                <p class="admin-help">Updates automatically as you edit. Save to publish changes.</p>
              </div>
              <div
                class="page-edit-preview-modes"
                role="group"
                aria-label="Preview screen size"
                data-preview-mode-toggle
              >
                <button
                  type="button"
                  class="page-edit-preview-mode is-active"
                  data-preview-mode="desktop"
                  aria-pressed="true"
                >
                  Desktop
                </button>
                <button
                  type="button"
                  class="page-edit-preview-mode"
                  data-preview-mode="mobile"
                  aria-pressed="false"
                >
                  Mobile
                </button>
              </div>
            </div>
            <div
              class="page-edit-preview-viewport page-edit-preview-viewport--desktop"
              data-preview-viewport
            >
              <iframe
                id="page-live-preview"
                class="page-edit-preview-frame"
                title={`Live preview: ${label}`}
                sandbox="allow-same-origin allow-scripts"
              ></iframe>
            </div>
          </aside>
        </div>
      </form>
      <script src="/page-blocks-editor.js?v=7" defer></script>
    </AdminShell>
  )
}
