import { Layout, PageHeader } from '../views/Layout'
import type { ContactInfo } from '../lib/site-settings'
import { phoneTelHref } from '../lib/site-settings'
import type { PageProps } from '../types/page'

export function ContactPage({
  theme,
  contact,
  footer,
  breakingNews,
}: PageProps & { contact: ContactInfo }) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Contact">
      <PageHeader title="Contact us" lead="Reach the Las Vegas chapter by phone, email, or the form below." />
      <section class="section">
        <div class="container contact-layout">
          <div class="prose">
            <p>
              <strong>{contact.name}</strong>
              <br />
              {contact.address}
            </p>
            <p>
              Phone: <a href={phoneTelHref(contact.phone)}>{contact.phone}</a>
              <br />
              Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
            {contact.hours && <p>Hours: {contact.hours}</p>}
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
              <button type="submit" class="btn btn-primary">Send message</button>
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
              <button type="submit" class="btn btn-secondary">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export function ContactThanksPage({ theme, contact, footer, breakingNews }: PageProps) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Message sent">
      <PageHeader title="Thank you" lead="Your message has been sent to the chapter." />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/">Back to home</a>
        </div>
      </section>
    </Layout>
  )
}

export function ContactErrorPage({
  theme,
  contact,
  footer,
  breakingNews,
  error,
}: PageProps & { error: string }) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Contact">
      <PageHeader title="Contact us" lead={error} />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/contact">Try again</a>
        </div>
      </section>
    </Layout>
  )
}
