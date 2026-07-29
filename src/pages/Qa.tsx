import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { demoQaItems } from '../data/qa'

import type { PageProps } from '../types/page'

export function QaPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Q & A">
      <DemoBanner />
      <PageHeader
        title="Q & A"
        lead="Frequently asked questions about NUCA and the Las Vegas chapter. Secretary will manage these in the admin panel."
      />
      <section class="section">
        <div class="container">
          <dl class="qa-list">
            {demoQaItems.map((item) => (
              <div class="qa-item" key={item.id}>
                <dt>{item.question}</dt>
                <dd>{item.answer}</dd>
              </div>
            ))}
          </dl>
          <p class="qa-admin-note">
            <em>Planned:</em> each question and answer will be stored in D1 and editable without a code deploy.
          </p>
        </div>
      </section>
    </Layout>
  )
}
