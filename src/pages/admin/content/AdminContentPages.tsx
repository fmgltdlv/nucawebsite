import {
  PAGE_LABELS,
  PAGE_SLUGS,
  type PageRecord,
} from '../../../lib/pages-db'
import type { CommitteeRecord } from '../../../lib/committees-db'
import { committeePageSlug } from '../../../lib/committee-pages'
import { pagePreviewPath, pagePublicPath } from '../../../lib/page-paths'
import { AdminShell } from '../../../views/AdminShell'
import { AdminAddButton } from '../../../views/admin/AdminListSection'
import { AdminModal, AdminModalCancelButton } from '../../../views/admin/AdminModal'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

function PageListItem({
  slug,
  label,
  page,
  deletable = false,
}: {
  slug: string
  label: string
  page: PageRecord | undefined
  deletable?: boolean
}) {
  const publicPath = pagePublicPath(slug)
  const previewPath = pagePreviewPath(slug)

  return (
    <li>
      <a href={`/admin/content/pages/${slug}`}>{label}</a>
      {page ? (
        <span>
          {' '}
          — {page.published ? 'published' : 'draft'} ·{' '}
          <a href={previewPath}>preview</a>
          {page.published ? (
            <>
              {' · '}
              <a href={publicPath}>view</a>
            </>
          ) : null}
          {deletable ? (
            <>
              {' · '}
              <form
                method="post"
                action={`/admin/content/pages/${slug}/delete`}
                class="admin-inline-form"
                onsubmit="return confirm('Delete this page permanently?')"
              >
                <button type="submit" class="admin-link-button">delete</button>
              </form>
            </>
          ) : null}
        </span>
      ) : (
        <span> — not created yet</span>
      )}
    </li>
  )
}

export function AdminContentPagesPage({
  ctx,
  pages,
  customPages,
  committees,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  pages: PageRecord[]
  customPages: PageRecord[]
  committees: CommitteeRecord[]
  flash?: string
  error?: string
}) {
  const bySlug = Object.fromEntries(pages.map((page) => [page.slug, page]))

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Editable pages"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="admin-flash admin-flash-error">{error}</p>}

      <div class="admin-list-toolbar">
        <AdminAddButton modalId="add-page-dialog" label="New page" />
      </div>

      <section class="admin-page-group">
        <h2 class="admin-page-group-title">Built-in pages</h2>
        <ul class="admin-link-list">
          {PAGE_SLUGS.map((slug) => (
            <PageListItem
              key={slug}
              slug={slug}
              label={PAGE_LABELS[slug]}
              page={bySlug[slug]}
            />
          ))}
        </ul>
      </section>

      {committees.length > 0 ? (
        <section class="admin-page-group">
          <h2 class="admin-page-group-title">Committee pages</h2>
          <ul class="admin-link-list">
            {committees.map((committee) => {
              const slug = committeePageSlug(committee.key)
              return (
                <PageListItem
                  key={slug}
                  slug={slug}
                  label={committee.name}
                  page={bySlug[slug]}
                />
              )
            })}
          </ul>
        </section>
      ) : null}

      <section class="admin-page-group">
        <h2 class="admin-page-group-title">Custom pages</h2>
        {customPages.length === 0 ? (
          <p class="admin-help">
            No custom pages yet. Use “New page” to add one at a URL like /your-page-name.
          </p>
        ) : (
          <ul class="admin-link-list">
            {customPages.map((page) => (
              <PageListItem
                key={page.slug}
                slug={page.slug}
                label={page.title}
                page={page}
                deletable
              />
            ))}
          </ul>
        )}
      </section>

      <AdminModal
        id="add-page-dialog"
        title="New page"
        formAction="/admin/content/pages"
        formId="add-page-form"
        footer={
          <>
            <AdminModalCancelButton />
            <button type="submit" class="btn btn-primary" form="add-page-form">
              Create page
            </button>
          </>
        }
      >
        <div class="form-field">
          <label for="add-page-title">Page title</label>
          <input type="text" name="title" id="add-page-title" required />
        </div>
        <div class="form-field">
          <label for="add-page-slug">URL slug</label>
          <input
            type="text"
            name="slug"
            id="add-page-slug"
            placeholder="auto-generated from title"
            pattern="[a-z][a-z0-9-]*"
            spellcheck={false}
          />
          <p class="admin-help">Published at /your-slug (lowercase letters, numbers, hyphens).</p>
        </div>
        <div class="form-field">
          <label for="add-page-meta">Meta description (optional)</label>
          <input type="text" name="meta_description" id="add-page-meta" />
        </div>
        <label class="admin-check">
          <input type="checkbox" name="published" value="1" />
          Publish immediately
        </label>
      </AdminModal>
    </AdminShell>
  )
}
