import { Layout, PageHeader } from '../views/Layout'
import type { EventRecord } from '../lib/events'
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

export function EventsPage({ theme, contact, footer, breakingNews, events }: PageProps & { events: EventRecord[] }) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Events">
      <PageHeader
        title="Events"
        lead="Chapter meetings, training, and member gatherings across Las Vegas."
      />
      <section class="section">
        <div class="container event-list">
          {events.map((event) => (
            <article class="event-card" key={event.id}>
              <div class="event-card-meta">
                <time dateTime={event.starts_at}>{formatEventDate(event.starts_at)}</time>
                {event.location && <span>{event.location}</span>}
              </div>
              <h2>{event.title}</h2>
              {event.description && <p>{event.description}</p>}
              {event.registration_url && (
                <a class="btn btn-secondary btn-sm" href={event.registration_url}>
                  Registration
                </a>
              )}
            </article>
          ))}
          {events.length === 0 && <p class="prose">No upcoming events scheduled.</p>}
        </div>
      </section>
    </Layout>
  )
}
