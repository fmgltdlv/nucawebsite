import { Layout, PageHeader } from '../views/Layout'
import {
  memberTypeLabel,
  type Member,
  type MemberType,
} from '../data/demo'

function MemberBubble({ member }: { member: Member }) {
  const initial = member.company.trim().charAt(0).toUpperCase() || '?'

  return (
    <li class="member-bubble" data-member-type={member.type}>
      <div class="member-bubble-avatar" aria-hidden="true">
        {member.logoUrl ? (
          <img src={member.logoUrl} alt="" class="member-bubble-logo" />
        ) : (
          initial
        )}
      </div>
      <div class="member-bubble-body">
        <span class="member-bubble-company">{member.company}</span>
        {member.description && <p class="member-bubble-desc">{member.description}</p>}
        <span class={`badge badge-${member.type}`}>{memberTypeLabel[member.type]}</span>
        {(member.website || member.phone) && (
          <div class="member-bubble-links">
            {member.website && (
              <a href={member.website} rel="noopener noreferrer" target="_blank">
                Website
              </a>
            )}
            {member.phone && (
              <a href={`tel:${member.phone.replace(/\D/g, '')}`}>{member.phone}</a>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

import type { PageProps } from '../types/page'

export function MembersPage({
  theme,
  contact,
  footer,
  breakingNews,
  filter,
  members,
}: PageProps & { filter?: MemberType; members: Member[] }) {
  const sorted = [...members].sort((a, b) =>
    a.company.localeCompare(b.company, undefined, { sensitivity: 'base' }),
  )

  const filters: { id: MemberType | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'contractor', label: 'Contractors' },
    { id: 'associate', label: 'Associates' },
    { id: 'institutional', label: 'Institutional' },
  ]

  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Members">
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
              <MemberBubble key={member.id} member={member} />
            ))}
          </ul>
          <p class="table-note" id="member-search-empty" hidden>
            No members match your search.
          </p>
        </div>
      </section>
    </Layout>
  )
}
