import type { EventRecord } from '../lib/events'
import { formatEventDate } from '../lib/format'

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <article class="event-card">
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
  )
}
