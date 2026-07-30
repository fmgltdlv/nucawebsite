import { Layout, PageHeader } from '../views/Layout'
import { getAssetUrl } from '../lib/r2-assets'
import type { LeadershipRecord } from '../lib/leadership-db'
import type { ContactInfo } from '../lib/site-settings'
import type { PageProps } from '../types/page'

export function LeadershipPage({
  theme,
  contact,
  footer,
  breakingNews,
  leaders,
}: PageProps & { contact: ContactInfo; leaders: LeadershipRecord[] }) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Leadership">
      <PageHeader title="Leadership" lead="Chapter officers and leadership team." />
      <section class="section">
        <div class="container">
          <ul class="leader-list">
            {leaders.map((person) => (
              <li key={person.id}>
                {person.photo_r2_key && (
                  <img
                    class="leader-photo"
                    src={getAssetUrl(person.photo_r2_key)}
                    alt=""
                    width={80}
                    height={80}
                  />
                )}
                <span class="leader-name">{person.name}</span>
                <span class="leader-role">{person.role_title}</span>
              </li>
            ))}
          </ul>
          {leaders.length === 0 && <p class="prose">Leadership roster coming soon.</p>}
          <p class="prose">
            Chapter contact: <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </div>
      </section>
    </Layout>
  )
}
