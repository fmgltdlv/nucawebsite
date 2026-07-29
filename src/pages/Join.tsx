import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { joinBenefits, memberTypes, site } from '../data/demo'

import type { PageProps } from '../types/page'

export function JoinPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Join">
      <DemoBanner />
      <PageHeader
        title="Join NUCA of Las Vegas"
        lead="Membership connects your firm to advocacy, safety resources, events, and a network of industry peers."
      />
      <section class="section">
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

      <section class="section section-muted">
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
        <div class="container join-grid">
          <div>
            <h2>Apply online</h2>
            <p class="section-lead">
              Demo form — submissions are not stored yet. Production will email {site.email} and save to D1.
            </p>
            <form class="form" method="post" action="/join" id="join-form">
              <div class="form-field">
                <label for="member_type">Membership type</label>
                <select name="member_type" id="member_type" required>
                  <option value="">Select…</option>
                  {memberTypes.map((t) => (
                    <option value={t.id} key={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div class="form-field">
                <label for="company">Company name</label>
                <input type="text" name="company" id="company" required />
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label for="contact_name">Contact name</label>
                  <input type="text" name="contact_name" id="contact_name" required />
                </div>
                <div class="form-field">
                  <label for="contact_email">Email</label>
                  <input type="email" name="contact_email" id="contact_email" required />
                </div>
              </div>
              <div class="form-field">
                <label for="phone">Phone</label>
                <input type="tel" name="phone" id="phone" />
              </div>
              <div class="form-field">
                <label for="notes">Notes</label>
                <textarea name="notes" id="notes" rows={4} placeholder="Optional details about your firm or application"></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Submit application (demo)</button>
            </form>
          </div>
          <aside class="join-aside">
            <h3>PDF application</h3>
            <p>
              Prefer a paper form? Download the application, complete it, and email to{' '}
              <a href="mailto:info@nucalasvegas.com">{site.email}</a>.
            </p>
            <a class="btn btn-secondary" href="#">Download PDF (placeholder)</a>
            <p class="aside-note">
              For questions, contact Jennifer Bott at <a href="tel:7025778556">{site.phone}</a>.
            </p>
          </aside>
        </div>
      </section>
    </Layout>
  )
}

export function JoinThanksPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Application received">
      <PageHeader
        title="Thank you"
        lead="This demo showed a success state. No data was saved."
      />
      <section class="section">
        <div class="container prose">
          <p>
            On the production site, staff would receive an email via Cloudflare Email Service and the application would
            appear in the admin queue.
          </p>
          <a class="btn btn-primary" href="/">Back to home</a>
        </div>
      </section>
    </Layout>
  )
}
