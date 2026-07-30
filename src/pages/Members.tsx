import { Layout, PageHeader } from '../views/Layout'
import {
  memberTypeLabel,
  type Member,
  type MemberType,
} from '../data/demo'
import type { PageProps } from '../types/page'

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
        <button
          type="button"
          class="member-bubble-company-btn"
          data-member-id={member.id}
          aria-label={`View details for ${member.company}`}
        >
          {member.company}
        </button>
        <span class={`badge badge-${member.type}`}>{memberTypeLabel[member.type]}</span>
      </div>
    </li>
  )
}

function MemberDialog() {
  return (
    <dialog id="member-dialog" class="leader-dialog">
      <article class="leader-dialog-card">
        <button type="button" class="leader-dialog-close" aria-label="Close" data-modal-close>
          ×
        </button>
        <div class="leader-dialog-layout">
          <div class="leader-dialog-media">
            <img id="member-dialog-logo" class="leader-dialog-photo member-dialog-logo" alt="" hidden />
            <div id="member-dialog-initial" class="leader-dialog-initial" hidden />
          </div>
          <div class="leader-dialog-content">
            <h2 id="member-dialog-company" class="leader-dialog-name" />
            <p id="member-dialog-type" class="leader-dialog-role" />
            <div id="member-dialog-links" class="leader-dialog-links" hidden />
            <div id="member-dialog-description" class="leader-dialog-bio" hidden />
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
  filter,
  members,
}: PageProps & { filter?: MemberType; members: Member[] }) {
  const sorted = [...members].sort((a, b) =>
    a.company.localeCompare(b.company, undefined, { sensitivity: 'base' }),
  )

  const rosterJson = JSON.stringify(
    sorted.map((member) => ({
      id: member.id,
      company: member.company,
      typeLabel: memberTypeLabel[member.type],
      description: member.description ?? null,
      website: member.website ?? null,
      phone: member.phone ?? null,
      logoUrl: member.logoUrl ?? null,
    })),
  ).replace(/</g, '\\u003c')

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

          <script id="member-roster" type="application/json">
            {rosterJson}
          </script>
          <MemberDialog />
        </div>
      </section>
    </Layout>
  )
}
