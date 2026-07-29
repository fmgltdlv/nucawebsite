import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { site } from '../data/demo'

import type { PageProps } from '../types/page'

export function ContactPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Contact">
      <DemoBanner />
      <PageHeader title="Contact us" lead="Reach the Las Vegas chapter by phone, email, or the form below." />
      <section class="section">
        <div class="container contact-layout">
          <div class="prose">
            <p>
              <strong>{site.name}</strong>
              <br />
              {site.address}
            </p>
            <p>
              Phone: <a href="tel:7025778556">{site.phone}</a>
              <br />
              Email: <a href="mailto:info@nucalasvegas.com">{site.email}</a>
            </p>
            <form class="form" method="post" action="/contact">
              <div class="form-field">
                <label for="name">Name</label>
                <input type="text" name="name" id="name" required />
              </div>
              <div class="form-field">
                <label for="email">Email</label>
                <input type="email" name="email" id="email" required />
              </div>
              <div class="form-field">
                <label for="message">Message</label>
                <textarea name="message" id="message" rows={5} required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Send message (demo)</button>
            </form>
          </div>
          <div class="newsletter-panel" id="newsletter">
            <h2>Newsletter — THE DIRT</h2>
            <p>Join the mailing list for chapter news and upcoming events.</p>
            <form class="form" method="post" action="/newsletter/subscribe">
              <div class="form-field">
                <label for="newsletter_email">Email</label>
                <input type="email" name="newsletter_email" id="newsletter_email" required />
              </div>
              <p class="form-hint">
                By subscribing you agree to receive chapter emails. We will not sell your information.
              </p>
              <p class="form-hint form-hint-warn">Not wired yet — see TODO.md (newsletter submission).</p>
              <button type="submit" class="btn btn-secondary">Subscribe (demo)</button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export function ContactThanksPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Message sent">
      <PageHeader title="Thank you" lead="Demo only — your message was not sent." />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/">Back to home</a>
        </div>
      </section>
    </Layout>
  )
}
