import { Layout, PageHeader } from '../views/Layout'
import { demoLeadership, site } from '../data/demo'

import type { PageProps } from '../types/page'

export function LeadershipPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Leadership">
      <PageHeader
        title="Leadership"
        lead="Sample roster for demo — will be managed in admin (same as member list workflow)."
      />
      <section class="section">
        <div class="container">
          <ul class="leader-list">
            {demoLeadership.map((person) => (
              <li key={person.role}>
                <span class="leader-name">{person.name}</span>
                <span class="leader-role">{person.role}</span>
              </li>
            ))}
          </ul>
          <p class="prose">
            Chapter contact: <a href="mailto:info@nucalasvegas.com">{site.email}</a>
          </p>
        </div>
      </section>
    </Layout>
  )
}
