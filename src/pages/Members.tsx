import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import {
  memberTypeLabel,
  type Member,
  type MemberType,
} from '../data/demo'

function MemberRow({ member }: { member: Member }) {
  return (
    <tr>
      <td>
        <span class="member-company">{member.company}</span>
      </td>
      <td>
        <span class={`badge badge-${member.type}`}>{memberTypeLabel[member.type]}</span>
      </td>
      <td>
        {member.website ? (
          <a href={member.website} rel="noopener noreferrer" target="_blank">Website</a>
        ) : (
          <span class="muted">—</span>
        )}
      </td>
      <td>
        {member.phone ? (
          <a href={`tel:${member.phone.replace(/\D/g, '')}`}>{member.phone}</a>
        ) : (
          <span class="muted">—</span>
        )}
      </td>
    </tr>
  )
}

import type { PageProps } from '../types/page'

export function MembersPage({
  theme,
  filter,
  members,
}: PageProps & { filter?: MemberType; members: Member[] }) {
  const filtered = filter ? members.filter((m) => m.type === filter) : members

  const filters: { id: MemberType | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'contractor', label: 'Contractors' },
    { id: 'associate', label: 'Associates' },
    { id: 'institutional', label: 'Institutional' },
  ]

  return (
    <Layout theme={theme} title="Member List">
      <DemoBanner />
      <PageHeader
        title="Member list"
        lead="Directory of chapter members. Search and filters are front-end only in this demo."
      />
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
            <div class="filter-pills" role="tablist" aria-label="Member type">
              {filters.map((f) => {
                const href = f.id === 'all' ? '/members' : `/members?type=${f.id}`
                const active = (filter ?? 'all') === f.id
                return (
                  <a
                    key={f.id}
                    class={`pill ${active ? 'pill-active' : ''}`}
                    href={href}
                    role="tab"
                    aria-selected={active}
                  >
                    {f.label}
                  </a>
                )
              })}
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table" id="member-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Website</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </div>
          <p class="table-note" id="member-search-empty" hidden>
            No members match your search.
          </p>
        </div>
      </section>
    </Layout>
  )
}
