import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { demoEvents, site } from '../data/demo'
import type { PageProps } from '../types/page'

export function HomePage({ theme }: PageProps) {
  const upcoming = demoEvents.slice(0, 2)

  return (
    <Layout theme={theme} title="Home" description="NUCA of Las Vegas chapter — members, events, advocacy, and industry resources.">
      <DemoBanner />
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">National Utility Contractors Association</p>
            <h1>Building Southern Nevada’s utility construction community</h1>
            <p class="hero-lead">
              Connect with contractors, suppliers, and public partners. Advocate for the industry, sharpen safety
              practices, and grow your business through the local NUCA chapter.
            </p>
            <div class="hero-cta">
              <a class="btn btn-primary" href="/join">Join the chapter</a>
              <a class="btn btn-secondary" href="/members">View member list</a>
            </div>
          </div>
          <div class="hero-card">
            <p class="hero-card-label">Next on the calendar</p>
            {upcoming.map((event) => (
              <article class="hero-event" key={event.id}>
                <time dateTime={event.date}>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <h2>{event.title}</h2>
                <p>{event.location}</p>
              </article>
            ))}
            <a class="text-link" href="/events">All events →</a>
          </div>
        </div>
      </section>

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
            <a class="btn btn-secondary" href="/join">See membership types</a>
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
          <h2>Chapter contact</h2>
          <p class="section-lead">
            Questions about membership or events? Reach out to {site.name} staff.
          </p>
          <div class="contact-cards">
            <a class="contact-card" href="tel:7025778556">
              <span class="contact-card-label">Phone</span>
              <span>{site.phone}</span>
            </a>
            <a class="contact-card" href="mailto:info@nucalasvegas.com">
              <span class="contact-card-label">Email</span>
              <span>{site.email}</span>
            </a>
            <div class="contact-card">
              <span class="contact-card-label">Mail</span>
              <span>{site.address}</span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
