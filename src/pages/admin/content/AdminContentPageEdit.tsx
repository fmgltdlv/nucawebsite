import { PAGE_LABELS, type PageRecord } from '../../../lib/pages-db'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

export function AdminContentPageEditPage({
  theme,
  ctx,
  page,
  slug,
  flash,
}: PageProps & {
  ctx: AdminContext
  page: PageRecord | null
  slug: string
  flash?: string
}) {
  const label = PAGE_LABELS[slug as keyof typeof PAGE_LABELS] ?? slug

  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title={`Edit: ${label}`}
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content/pages">← Pages</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      <form class="form admin-form-section" method="post" action={`/admin/content/pages/${slug}`}>
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
          <label for="body_md">Body (markdown)</label>
          <textarea name="body_md" id="body_md" rows={16} required>
            {page?.body_md ?? ''}
          </textarea>
        </div>
        <label class="admin-check">
          <input type="checkbox" name="published" value="1" checked={page?.published !== 0} />
          Published
        </label>
        <button type="submit" class="btn btn-primary">Save page</button>
      </form>
    </AdminShell>
  )
}
