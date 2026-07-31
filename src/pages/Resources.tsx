import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { renderPageContent } from '../lib/page-blocks'
import { groupResourceItems, type ResourceItemRecord } from '../lib/resource-items-db'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

export function ResourcesPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  page,
  items,
}: PageProps & { page: PageRecord | null; items: ResourceItemRecord[] }) {
  const groups = groupResourceItems(items)
  const intro = page?.body_json || page?.body_md?.trim()

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation })}
      title="Resources"
      description={page?.meta_description ?? undefined}
    >
      <PageHeader
        title={page?.title ?? 'Resources'}
        lead={page?.meta_description ?? 'Reference links and documents for NUCA members.'}
      />
      <section class="section">
        <div class="container prose">
          {intro && <div>{renderPageContent(page?.body_md ?? '', page?.body_json)}</div>}
          {groups.map((group) => (
            <div class="resource-section" key={group.category}>
              <h3>{group.category}</h3>
              <ul class="resource-link-list">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <a href={item.url} rel="noopener noreferrer" target="_blank">
                      {item.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {groups.length === 0 && !intro && <p>No resources have been added yet.</p>}
        </div>
      </section>
    </Layout>
  )
}
