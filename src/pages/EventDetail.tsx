import type { EventOccurrenceView } from '../lib/events'
import { eventFlyerUrl } from '../lib/events'
import { formatEventDate } from '../lib/format'
import type { PageProps } from '../types/page'
import { Layout, pickLayoutSite } from '../views/Layout'
import { StatusPage } from '../views/StatusPage'

function formatEventDateRange(startsAt: string, endsAt: string | null): string {
  if (!endsAt) return formatEventDate(startsAt)
  const start = formatEventDate(startsAt)
  const end = formatEventDate(endsAt)
  return `${start} – ${end}`
}

function mapEmbedUrl(lat: number, lng: number): string {
  const delta = 0.01
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

function mapExternalUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
}

export function EventDetailPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  occurrence,
}: PageProps & { occurrence: EventOccurrenceView }) {
  const { master, starts_at, ends_at } = occurrence
  const flyerUrl = eventFlyerUrl(master)
  const hasMap = master.latitude != null && master.longitude != null

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl })}
      title={master.title}
      description={master.description ?? undefined}
    >
      <article class="event-detail">
        {flyerUrl ? (
          <div class="event-detail-hero">
            <img src={flyerUrl} alt="" class="event-detail-flyer" />
          </div>
        ) : (
          <div class="event-detail-hero event-detail-hero-fallback" aria-hidden="true" />
        )}

        <div class="container event-detail-body">
          <p class="event-detail-back">
            <a class="text-link" href="/events">
              ← Back to events
            </a>
          </p>

          <div class="event-detail-grid">
            <div class="event-detail-main">
              <h1 class="event-detail-title">{master.title}</h1>

              <div class="event-detail-meta-list">
                <div class="event-detail-meta-item">
                  <span class="event-detail-meta-label">When</span>
                  <time dateTime={starts_at}>{formatEventDateRange(starts_at, ends_at)}</time>
                </div>
                {master.location && (
                  <div class="event-detail-meta-item">
                    <span class="event-detail-meta-label">Location</span>
                    {hasMap ? (
                      <a href={mapExternalUrl(master.latitude!, master.longitude!)} target="_blank" rel="noopener noreferrer">
                        {master.location}
                      </a>
                    ) : (
                      <span>{master.location}</span>
                    )}
                  </div>
                )}
              </div>

              {master.description && (
                <section class="event-detail-section">
                  <h2>About event</h2>
                  <div class="event-detail-description prose">{master.description}</div>
                </section>
              )}

              {hasMap && (
                <section class="event-detail-section">
                  <h2>Location</h2>
                  <p class="event-detail-location-text">{master.location}</p>
                  <div class="event-map-wrap">
                    <iframe
                      class="event-map"
                      title={`Map for ${master.title}`}
                      src={mapEmbedUrl(master.latitude!, master.longitude!)}
                      loading="lazy"
                    />
                  </div>
                  <p class="table-note">
                    <a href={mapExternalUrl(master.latitude!, master.longitude!)} target="_blank" rel="noopener noreferrer">
                      Open map in new tab ↗
                    </a>
                  </p>
                </section>
              )}
            </div>

            <aside class="event-detail-sidebar">
              <div class="event-detail-card">
                <h2 class="event-detail-card-title">Registration</h2>
                {master.registration_url ? (
                  <a class="btn btn-primary event-detail-register" href={master.registration_url}>
                    Register
                  </a>
                ) : (
                  <p class="event-detail-card-muted">Registration is not required for this event.</p>
                )}
              </div>

              <div class="event-detail-card">
                <h2 class="event-detail-card-title">Date &amp; time</h2>
                <p>
                  <time dateTime={starts_at}>{formatEventDateRange(starts_at, ends_at)}</time>
                </p>
              </div>

              {master.location && (
                <div class="event-detail-card">
                  <h2 class="event-detail-card-title">Address</h2>
                  <p>{master.location}</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </article>
    </Layout>
  )
}

export function EventNotFoundPage(props: PageProps) {
  return (
    <StatusPage
      {...props}
      title="Event not found"
      heading="Event not found"
      lead="That event is not on the calendar or may have been removed."
      ctaHref="/events"
      ctaLabel="Back to events"
    />
  )
}
