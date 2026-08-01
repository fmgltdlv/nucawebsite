import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import {
  resolveMemberTypeLabel,
  type MemberSummary,
  type MemberType,
} from '../data/demo'
import type { MembershipTypeRecord } from '../lib/membership-types-db'
import type { PageProps } from '../types/page'

function MemberBubble({
  member,
  labels,
}: {
  member: MemberSummary
  labels: Record<string, string>
}) {
  const initial = member.company.trim().charAt(0).toUpperCase() || '?'

  return (
    <li class="member-bubble" data-member-type={member.type}>
      <button
        type="button"
        class="bubble-card-btn"
        data-member-id={member.id}
        aria-label={`View details for ${member.company}`}
      >
        <div class="member-bubble-avatar" aria-hidden="true">
          {member.logoUrl ? (
            <img src={member.logoUrl} alt="" class="member-bubble-logo" loading="lazy" />
          ) : (
            initial
          )}
        </div>
        <div class="member-bubble-body">
          <span class="member-bubble-company">{member.company}</span>
          <span class={`badge badge-${member.type}`}>
            {resolveMemberTypeLabel(member.type, labels)}
          </span>
        </div>
      </button>
    </li>
  )
}

function MemberDialog() {
  return (
    <dialog id="member-dialog" class="leader-dialog member-dialog">
      <article class="leader-dialog-card">
        <button type="button" class="leader-dialog-close" aria-label="Close" data-modal-close>
          ×
        </button>
        <p id="member-dialog-loading" class="member-dialog-loading" hidden>Loading member details…</p>
        <p id="member-dialog-error" class="member-dialog-error" hidden>
          Could not load member details. Please try again.
        </p>
        <div id="member-dialog-body" class="leader-dialog-layout">
          <div class="leader-dialog-media">
            <img id="member-dialog-logo" class="member-dialog-logo" alt="" hidden />
            <div id="member-dialog-initial" class="member-dialog-initial" hidden />
          </div>
          <div class="leader-dialog-content">
            <h2 id="member-dialog-company" class="leader-dialog-name" />
            <p id="member-dialog-type" class="leader-dialog-role" />
            <div id="member-dialog-links" class="leader-dialog-links" hidden />
            <div id="member-dialog-description" class="leader-dialog-bio" hidden />
            <div id="member-dialog-contacts" class="member-dialog-contacts" hidden>
              <h3 class="member-dialog-contacts-title">Points of Contact</h3>
              <ul id="member-dialog-contacts-list" class="member-dialog-contacts-list" />
            </div>
          </div>
        </div>
      </article>
    </dialog>
  )
}

export function MembersPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  staffInboxCount,
  filter,
  members,
  membershipTypes = [],
}: PageProps & {
  filter?: MemberType
  members: MemberSummary[]
  membershipTypes?: MembershipTypeRecord[]
}) {
  const sorted = [...members].sort((a, b) =>
    a.company.localeCompare(b.company, undefined, { sensitivity: 'base' }),
  )

  const labels: Record<string, string> = {}
  for (const t of membershipTypes) labels[t.key] = t.name

  const filters: { id: MemberType | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    ...(membershipTypes.length > 0
      ? membershipTypes.map((t) => ({ id: t.key, label: t.name }))
      : [
          { id: 'contractor', label: 'Contractors' },
          { id: 'associate', label: 'Associates' },
          { id: 'institutional', label: 'Institutional' },
        ]),
  ]

  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation, staffInboxCount })} title="Members">
      <PageHeader title="Members" />
      <section class="section">
        <div class="container">
          <div class="members-toolbar">
            <label class="search-field">
              <span class="visually-hidden">Search members</span>
              <input
                type="search"
                id="member-search"
                placeholder="Search by company name…"
                autocomplete="organization"
              />
            </label>
            <div class="filter-pills" id="member-type-filters" role="tablist" aria-label="Member type">
              {filters.map((f) => {
                const active = (filter ?? 'all') === f.id
                return (
                  <button
                    type="button"
                    key={f.id}
                    class={`pill ${active ? 'pill-active' : ''}`}
                    data-filter={f.id}
                    role="tab"
                    aria-selected={active}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          <ul class="member-grid" id="member-grid">
            {sorted.map((member) => (
              <MemberBubble key={member.id} member={member} labels={labels} />
            ))}
          </ul>
          <p class="table-note" id="member-search-empty" hidden>
            No members match your search.
          </p>

          <nav
            class="member-pagination"
            id="member-pagination"
            hidden
            aria-label="Members pagination"
          >
            <button type="button" class="btn btn-secondary btn-sm" id="member-page-prev" disabled>
              Previous
            </button>
            <span class="member-page-info" id="member-page-info" />
            <button type="button" class="btn btn-secondary btn-sm" id="member-page-next" disabled>
              Next
            </button>
          </nav>

          <MemberDialog />
        </div>
      </section>
    </Layout>
  )
}
