import { committeePublicPath } from '../lib/committee-pages'
import type { CommitteeRecord } from '../lib/committees-db'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { renderPageContent } from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

export function CommitteesPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  staffInboxCount,
  page,
  calendarEvents,
  committees,
}: PageProps & {
  page: PageRecord | null
  calendarEvents?: ExpandedEventRecord[]
  committees: CommitteeRecord[]
}) {  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation, staffInboxCount })} title="Committees">
      <PageHeader
        title={page?.title ?? 'Committees'}
        lead={
          page?.meta_description ??
          'Chapter committees coordinate member engagement, advocacy, and chapter programs.'
        }
      />
      <section class="section">
        <div class="container">
          <h2>Chapter committees</h2>
          <ul class="leader-list committee-list">
            {committees.map((committee) => (
              <li key={committee.key}>
                <a class="leader-name" href={committeePublicPath(committee.key)}>
                  {committee.name}
                </a>
              </li>
            ))}
          </ul>
          <p class="committee-scholarships-link">
            See also <a href="/scholarships">NUCA Las Vegas Scholarships</a>.
          </p>
        </div>
      </section>
      {page && (page.body_json || page.body_md?.trim()) && (
        <section class="section section-muted">
          <div class="container prose">
            {renderPageContent(page.body_md, page.body_json, { calendarEvents })}
          </div>
        </section>
      )}
    </Layout>
  )
}
