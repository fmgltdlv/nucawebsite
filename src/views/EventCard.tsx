import type { EventThumbnail } from '../lib/events'
import { eventThumbnail } from '../lib/events'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import { eventPublicHref } from '../lib/events'
import { formatEventDate } from '../lib/format'

export function EventMapThumbAssets() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossorigin=""
      />
      <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""
        defer
      ></script>
      <script src="/event-map-thumbs.js?v=1" defer></script>
    </>
  )
}

function EventCardThumb({ thumbnail }: { thumbnail: EventThumbnail | null }) {
  if (thumbnail?.kind === 'image') {
    return <img class="event-card-thumb" src={thumbnail.url} alt="" loading="lazy" decoding="async" />
  }

  if (thumbnail?.kind === 'map') {
    return (
      <div
        class="event-card-thumb event-card-map-thumb"
        data-event-map-thumb
        data-lat={String(thumbnail.latitude)}
        data-lng={String(thumbnail.longitude)}
        aria-hidden="true"
      />
    )
  }

  return <div class="event-card-thumb event-card-thumb-fallback" aria-hidden="true" />
}

export function EventCard({ event }: { event: ExpandedEventRecord }) {
  const thumbnail = eventThumbnail(event)
  const href = eventPublicHref(event)

  return (
    <article class="event-card">
      <a class="event-card-link" href={href}>
        <EventCardThumb thumbnail={thumbnail} />
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
