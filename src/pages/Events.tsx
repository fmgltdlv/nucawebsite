import { Layout, PageHeader } from '../views/Layout'
import { EventCard } from '../views/EventCard'
import type { EventRecord } from '../lib/events'
import type { PageProps } from '../types/page'

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
            <EventCard event={event} key={event.id} />
          ))}
          {events.length === 0 && <p class="prose">No upcoming events scheduled.</p>}
        </div>
      </section>
    </Layout>
  )
}
