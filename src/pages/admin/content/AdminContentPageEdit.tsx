import { PAGE_LABELS, type PageRecord } from '../../../lib/pages-db'
import { blocksFromMarkdown, parsePageBlocks, serializePageBlocks } from '../../../lib/page-blocks'
import { committeeKeyFromSlug, committeePublicPath } from '../../../lib/committee-pages'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

const publicPaths: Record<string, string> = {
  about: '/about',
  resources: '/resources',
  scholarships: '/scholarships',
  committees: '/about/committees',
  'committee-legislative': '/about/committees/legislative',
  'committee-safety': '/about/committees/safety',
  'committee-standards': '/about/committees/standards',
  'committee-damage_prevention': '/about/committees/damage_prevention',
}

function initialBlocksJson(page: PageRecord | null): string {
  const fromJson = parsePageBlocks(page?.body_json ?? null)
  if (fromJson) return serializePageBlocks(fromJson)
  const fromMd = blocksFromMarkdown(page?.body_md ?? '')
  if (fromMd.length > 0) return serializePageBlocks(fromMd)
  return '[]'
}

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
  const publicPath =
    publicPaths[slug] ??
    (committeeKeyFromSlug(slug) ? committeePublicPath(committeeKeyFromSlug(slug)!) : `/${slug}`)
  const blocksJson = initialBlocksJson(page)

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
        {' · '}
        <a href={publicPath}>View public page</a>
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
          <label>Page content</label>
          <p class="admin-help">
            Build the page with sections, headings, paragraphs, lists, and callout boxes. Use move
            buttons to reorder blocks.
          </p>
          <div id="page-blocks-editor" class="page-blocks-editor" data-initial={blocksJson}></div>
          <input type="hidden" name="body_json" id="body_json" value={blocksJson} />
        </div>

        <details class="admin-advanced">
          <summary>Advanced: markdown fallback</summary>
          <div class="form-field">
            <label for="body_md">Body (markdown)</label>
            <p class="admin-help">
              Used only when no blocks are saved. Saving with blocks above will auto-generate this
              field.
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
      </form>
      <script src="/page-blocks-editor.js?v=1" defer></script>
    </AdminShell>
  )
}
