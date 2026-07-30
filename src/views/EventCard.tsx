import type { ExpandedEventRecord } from '../lib/event-repeat'
import { eventPublicHref, eventThumbnailUrl } from '../lib/events'
import { formatEventDate } from '../lib/format'

export function EventCard({ event }: { event: ExpandedEventRecord }) {
  const thumbnailUrl = eventThumbnailUrl(event)
  const href = eventPublicHref(event)

  return (
    <article class="event-card">
      <a class="event-card-link" href={href}>
        {thumbnailUrl ? (
          <img class="event-card-thumb" src={thumbnailUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <div class="event-card-thumb event-card-thumb-fallback" aria-hidden="true" />
        )}
        <div class="event-card-body">
          <div class="event-card-meta">
            <time dateTime={event.starts_at}>{formatEventDate(event.starts_at)}</time>
            {event.location && <span>{event.location}</span>}
          </div>
          <h2>{event.title}</h2>
          {event.description && <p>{event.description}</p>}
          <span class="event-card-cta">View event →</span>
        </div>
      </a>
    </article>
  )
}
