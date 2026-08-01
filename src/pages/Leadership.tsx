import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { JsonScript } from '../views/JsonScript'
import { groupLeadership } from '../lib/leadership-groups'
import {
  serializeLeadershipRoster,
  toLeadershipPublicProfile,
} from '../lib/leadership-public'
import { getAssetUrl } from '../lib/r2-assets'
import { renderPageContent } from '../lib/page-blocks'
import type { LeadershipRecord } from '../lib/leadership-db'
import type { PageRecord } from '../lib/pages-db'
import type { ContactInfo } from '../lib/site-settings'
import type { PageProps } from '../types/page'

function LeaderBubble({
  person,
  featured = false,
  detailed = false,
}: {
  person: LeadershipRecord
  featured?: boolean
  detailed?: boolean
}) {
  const initial = person.name.trim().charAt(0).toUpperCase() || '?'
  const photoUrl = person.photo_r2_key ? getAssetUrl(person.photo_r2_key) : null
  const bubbleClass = [
    'member-bubble',
    'leader-bubble',
    featured ? 'leader-bubble-featured' : '',
    detailed ? 'leader-bubble-detailed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li class={bubbleClass}>
      <button
        type="button"
        class="bubble-card-btn"
        data-leader-id={person.id}
        aria-label={`View profile for ${person.name}`}
      >
        <div class="member-bubble-avatar" aria-hidden="true">
          {photoUrl ? (
            <img src={photoUrl} alt="" class="member-bubble-logo leader-bubble-photo" />
          ) : (
            initial
          )}
        </div>
        <div class="member-bubble-body">
          <span class="member-bubble-company">{person.name}</span>
          <span class="leader-bubble-role">{person.role_title}</span>
          {person.chair_title && <span class="leader-bubble-chair">{person.chair_title}</span>}
          {person.company && <span class="leader-bubble-company">{person.company}</span>}
        </div>
      </button>
    </li>
  )
}

function LeaderGrid({
  leaders,
  featured = false,
  detailed = false,
  className = 'member-grid',
}: {
  leaders: LeadershipRecord[]
  featured?: boolean
  detailed?: boolean
  className?: string
}) {
  return (
    <ul class={className}>
      {leaders.map((person) => (
        <LeaderBubble key={person.id} person={person} featured={featured} detailed={detailed} />
      ))}
    </ul>
  )
}

function LeaderDialog() {
  return (
    <dialog id="leader-dialog" class="leader-dialog">
      <article class="leader-dialog-card">
        <button type="button" class="leader-dialog-close" aria-label="Close" data-modal-close>
          ×
        </button>
        <div class="leader-dialog-layout">
          <div class="leader-dialog-media">
            <img id="leader-dialog-photo" class="leader-dialog-photo" alt="" hidden />
            <div id="leader-dialog-initial" class="leader-dialog-initial" hidden />
          </div>
          <div class="leader-dialog-content">
            <h2 id="leader-dialog-name" class="leader-dialog-name" />
            <p id="leader-dialog-role" class="leader-dialog-role" />
            <p id="leader-dialog-chair" class="leader-dialog-chair" hidden />
            <p id="leader-dialog-company" class="leader-dialog-company" hidden />
            <div id="leader-dialog-links" class="leader-dialog-links" hidden />
            <div id="leader-dialog-bio" class="leader-dialog-bio" hidden />
          </div>
        </div>
      </article>
    </dialog>
  )
}

export function LeadershipPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  staffInboxCount,
  leaders,
  page,
}: PageProps & { contact?: ContactInfo; leaders: LeadershipRecord[]; page?: PageRecord | null }) {
  const groups = groupLeadership(leaders)
  const officerRoster = [...groups.officers, ...groups.other]
  const rosterJson = serializeLeadershipRoster(leaders.map(toLeadershipPublicProfile))
  const title = page?.title ?? 'Leadership'
  const lead = page?.meta_description ?? 'Chapter officers and leadership team.'
  const intro = page?.body_json || page?.body_md?.trim()

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation, staffInboxCount })}
      title={title}
      description={page?.meta_description ?? undefined}
    >
      <PageHeader title={title} lead={lead} />
      <section class="section">
        <div class="container">
          {intro && (
            <div class="prose">{renderPageContent(page?.body_md ?? '', page?.body_json)}</div>
          )}
          {leaders.length === 0 ? (
            <p class="prose">Leadership roster coming soon.</p>
          ) : (
            <>
              {groups.featured.length > 0 && (
                <LeaderGrid
                  leaders={groups.featured}
                  featured
                  className="leadership-featured-grid"
                />
              )}

              {officerRoster.length > 0 && (
                <LeaderGrid leaders={officerRoster} className="leadership-officers-grid" />
              )}

              {groups.board.length > 0 && (
                <div class="leadership-group">
                  <h2 class="leadership-group-title">Board Members</h2>
                  <LeaderGrid
                    leaders={groups.board}
                    detailed
                    className="member-grid leadership-board-grid"
                  />
                </div>
              )}

              {groups.nonVoting.length > 0 && (
                <div class="leadership-group">
                  <h2 class="leadership-group-title">Non-Voting Board Members</h2>
                  <LeaderGrid
                    leaders={groups.nonVoting}
                    detailed
                    className="member-grid leadership-board-grid"
                  />
                </div>
              )}

              <JsonScript id="leadership-roster" json={rosterJson} />
              <LeaderDialog />
            </>
          )}

          <p class="prose leadership-contact">
            Chapter contact:{' '}
            {contact?.email ? (
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            ) : (
              <a href="/contact">Contact page</a>
            )}
          </p>
        </div>
      </section>
    </Layout>
  )
}
