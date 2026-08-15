import { committeePublicPath } from '../lib/committee-pages'
import type { CommitteeRecord } from '../lib/committees-db'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import { getAssetUrl } from '../lib/r2-assets'
import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { renderPageContent } from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

function CommitteeCard({ committee }: { committee: CommitteeRecord }) {
  const initial = committee.name.trim().charAt(0).toUpperCase() || '?'
  const photoUrl = committee.photo_r2_key ? getAssetUrl(committee.photo_r2_key) : null

  return (
    <li class="committee-card">
      <a class="committee-card-link" href={committeePublicPath(committee.key)}>
        <div class="committee-card-media" aria-hidden="true">
          {photoUrl ? (
            <img src={photoUrl} alt="" class="committee-card-photo" loading="lazy" decoding="async" />
          ) : (
            <span class="committee-card-initial">{initial}</span>
          )}
        </div>
        <span class="committee-card-name">{committee.name}</span>
      </a>
    </li>
  )
}

export function CommitteesPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  page,
  calendarEvents,
  committees,
}: PageProps & {
  page: PageRecord | null
  calendarEvents?: ExpandedEventRecord[]
  committees: CommitteeRecord[]
}) {
  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })} title="Committees">
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
          {committees.length === 0 ? (
            <p class="prose">Committee listings coming soon.</p>
          ) : (
            <ul class="committee-grid">
              {committees.map((committee) => (
                <CommitteeCard committee={committee} key={committee.key} />
              ))}
            </ul>
          )}
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
