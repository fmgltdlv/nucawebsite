import { CHAPTER_COMMITTEES } from '../data/committees'
import { Layout, PageHeader, DemoBanner } from '../views/Layout'

import type { PageProps } from '../types/page'

export function CommitteesPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Committees">
      <DemoBanner />
      <PageHeader
        title="Committees"
        lead="Chapter committees—including legislative affairs and advocacy—coordinate member engagement and chapter programs."
      />
      <section class="section">
        <div class="container">
          <h2>Chapter committees</h2>
          <ul class="leader-list committee-list">
            {CHAPTER_COMMITTEES.map((committee) => (
              <li key={committee.key} id={committee.key}>
                <span class="leader-name">{committee.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section class="section section-muted">
        <div class="container prose">
          <p>
            On the current site, much of this content lived under <strong>Advocacy</strong>. This page will combine
            committee information with advocacy messaging: federal policy updates, local Legislative Affairs work, and
            how members can participate.
          </p>
          <h2>Advocacy</h2>
          <p>
            National NUCA monitors Congress and federal agencies, partners with allied groups, and activates members
            when legislation or rulemaking affects underground utility construction.
          </p>
          <p>
            Las Vegas members stay informed on issues that shape bidding, safety compliance, and workforce
            development—then connect with national staff when their voices need to be heard.
          </p>
          <h2>Scholarships</h2>
          <p>
            NUCA Las Vegas scholarship information is grouped under Committees in the site menu. See{' '}
            <a href="/scholarships">NUCA Las Vegas Scholarships</a> for application details (to be copied from the live
            site).
          </p>
          <p>
            <em>Editable in admin:</em> committee roster, chairs, and page body (markdown).
          </p>
        </div>
      </section>
    </Layout>
  )
}