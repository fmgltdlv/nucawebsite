import { Layout, PageHeader } from '../views/Layout'
import { groupLeadership } from '../lib/leadership-groups'
import { getAssetUrl } from '../lib/r2-assets'
import type { LeadershipRecord } from '../lib/leadership-db'
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
        {(person.website || person.linkedin_url) && (
          <div class="member-bubble-links">
            {person.website && (
              <a href={person.website} rel="noopener noreferrer" target="_blank">
                Website
              </a>
            )}
            {person.linkedin_url && (
              <a href={person.linkedin_url} rel="noopener noreferrer" target="_blank">
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
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

export function LeadershipPage({
  theme,
  contact,
  footer,
  breakingNews,
  leaders,
}: PageProps & { contact: ContactInfo; leaders: LeadershipRecord[] }) {
  const groups = groupLeadership(leaders)
  const officerRoster = [...groups.officers, ...groups.other]

  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Leadership">
      <PageHeader title="Leadership" lead="Chapter officers and leadership team." />
      <section class="section">
        <div class="container">
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
            </>
          )}

          <p class="prose leadership-contact">
            Chapter contact: <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </div>
      </section>
    </Layout>
  )
}
