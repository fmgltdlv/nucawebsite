import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { JoinApplicationAside, JoinApplicationForm } from '../views/JoinApplicationForm'
import { StatusPage } from '../views/StatusPage'
import { joinBenefits, memberTypes } from '../data/demo'

import type { PageProps } from '../types/page'

export function JoinPage({ theme, contact, footer, breakingNews, logoUrl }: PageProps) {
  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl })} title="Join">
      <PageHeader
        title="Join NUCA of Las Vegas"
        lead="Membership connects your firm to advocacy, safety resources, events, and a network of industry peers."
      />
      <section class="section">
        <div class="container split">
          <div>
            <h2>Why members join</h2>
            <p class="section-lead">
              From Washington advocacy to local networking, NUCA gives utility and excavation firms a voice and a
              playbook.
            </p>
            <ul class="check-list">
              <li>Member pricing on chapter events</li>
              <li>Committee leadership and board pathways</li>
              <li>Safety and training resources</li>
              <li>Full national NUCA member benefits</li>
            </ul>
          </div>
          <div class="stat-panel">
            <div class="stat">
              <span class="stat-value">50+</span>
              <span class="stat-label">Years of national NUCA safety leadership</span>
            </div>
            <div class="stat">
              <span class="stat-value">Local</span>
              <span class="stat-label">Las Vegas chapter focused on Nevada projects &amp; policy</span>
            </div>
            <div class="stat">
              <span class="stat-value">Industry</span>
              <span class="stat-label">Contractors, associates, and institutional partners</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-muted">
        <div class="container">
          <h2>Member benefits</h2>
          <ul class="benefit-grid">
            {joinBenefits.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h2>Membership types</h2>
          <div class="type-cards">
            {memberTypes.map((type) => (
              <article class="type-card" key={type.id}>
                <h3>{type.name}</h3>
                <p>{type.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container join-grid join-grid--application">
          <div>
            <h2>Apply online</h2>
            <p class="section-lead">
              Complete the same information as the chapter membership application. You can also download the PDF and
              return it by email.
            </p>
            <JoinApplicationForm />
          </div>
          <JoinApplicationAside />
        </div>
      </section>
    </Layout>
  )
}

export function JoinThanksPage(props: PageProps) {
  return (
    <StatusPage
      {...props}
      title="Application received"
      heading="Thank you"
      lead="Your membership application has been received. Chapter staff will follow up with next steps."
      prose
    >
      <p>Questions? Contact the chapter through the <a href="/contact">Contact page</a>.</p>
      <a class="btn btn-primary" href="/">Back to home</a>
    </StatusPage>
  )
}
