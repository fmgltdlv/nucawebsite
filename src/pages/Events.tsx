import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { demoEvents } from '../data/demo'

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

import type { PageProps } from '../types/page'

export function EventsPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Events">
      <DemoBanner />
      <PageHeader
        title="Events"
        lead="Chapter meetings, training, and member gatherings across Las Vegas."
      />
      <section class="section">
        <div class="container event-list">
          {demoEvents.map((event) => (
            <article class="event-card" key={event.id}>
              <div class="event-card-meta">
                <time dateTime={event.date}>{formatEventDate(event.date)}</time>
                <span>{event.location}</span>
              </div>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              {event.registrationUrl && (
                <a class="btn btn-secondary btn-sm" href={event.registrationUrl}>Registration (demo)</a>
              )}
            </article>
          ))}
        </div>
      </section>
    </Layout>
  )
}
