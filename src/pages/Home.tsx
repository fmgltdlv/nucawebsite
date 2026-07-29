import { Layout, DemoBanner } from '../views/Layout'
import { demoEvents } from '../data/demo'
import { demoDirtReleases } from '../data/the-dirt'
import type { PageProps } from '../types/page'

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatUpdateDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HomePage({ theme }: PageProps) {
  const industryUpdates = demoDirtReleases.slice(0, 3)

  return (
    <Layout theme={theme} title="Home" description="NUCA of Las Vegas chapter — members, events, advocacy, and industry resources.">
      <DemoBanner />
      <section class="hero">
        <div class="container hero-copy">
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
      </section>

      <section class="section" id="events">
        <div class="container">
          <h2>Calendar events</h2>
          <p class="section-lead">Chapter meetings, training, and member gatherings across Las Vegas.</p>
          <div class="event-list">
            {demoEvents.map((event) => (
              <article class="event-card" key={event.id}>
                <div class="event-card-meta">
                  <time dateTime={event.date}>{formatEventDate(event.date)}</time>
                  <span>{event.location}</span>
                </div>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                {event.registrationUrl && (
                  <a class="btn btn-secondary btn-sm" href={event.registrationUrl}>
                    Registration (demo)
                  </a>
                )}
              </article>
            ))}
          </div>
          <p class="section-footer-link">
            <a class="text-link" href="/events">Full events calendar →</a>
          </p>
        </div>
      </section>

      <section class="section section-muted" id="industry-updates">
        <div class="container">
          <h2>Industry updates</h2>
          <p class="section-lead">
            News, policy, and chapter announcements. See also{' '}
            <a href="/about/the-dirt">THE DIRT</a> archive.
          </p>
          <ul class="dirt-archive">
            {industryUpdates.map((release) => (
              <li key={release.id}>
                <article class="dirt-card">
                  <div class="dirt-card-meta">
                    <time dateTime={release.publishedAt}>{formatUpdateDate(release.publishedAt)}</time>
                  </div>
                  <h2>
                    <a href={`/about/the-dirt/${release.id}`}>{release.title}</a>
                  </h2>
                  {release.summary && <p>{release.summary}</p>}
                  <a class="text-link" href={`/about/the-dirt/${release.id}`}>
                    Read update →
                  </a>
                </article>
              </li>
            ))}
          </ul>
          <p class="section-footer-link">
            <a class="text-link" href="/industry-updates">All industry updates →</a>
          </p>
        </div>
      </section>
    </Layout>
  )
}
