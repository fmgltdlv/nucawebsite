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

const RSVP_ERROR_MESSAGES: Record<string, string> = {
  full: 'This event is full. No more RSVPs can be accepted.',
  duplicate: 'That email is already registered for this event.',
  invalid: 'Please enter a valid name and email address.',
  disabled: 'RSVPs are not open for this event.',
}

function EventRsvpForm({
  eventId,
  startsAt,
  spotsLeft,
  limit,
  errorMessage,
  idSuffix = '',
}: {
  eventId: string
  startsAt: string
  spotsLeft: number | null
  limit: number | null
  errorMessage: string | null
  idSuffix?: string
}) {
  return (
    <form class="form event-rsvp-form" method="post" action={`/events/${eventId}/rsvp`}>
      <input type="hidden" name="occurrence_starts_at" value={startsAt} />
      {errorMessage && <p class="form-hint-warn" role="alert">{errorMessage}</p>}
      {spotsLeft != null && limit != null && (
        <p class="event-detail-card-muted event-rsvp-spots">
          {spotsLeft} of {limit} spot{limit === 1 ? '' : 's'} remaining
        </p>
      )}
      <div class="form-field">
        <label for={`rsvp_name${idSuffix}`}>Name</label>
        <input type="text" name="name" id={`rsvp_name${idSuffix}`} required autocomplete="name" />
      </div>
      <div class="form-field">
        <label for={`rsvp_email${idSuffix}`}>Email</label>
        <input type="email" name="email" id={`rsvp_email${idSuffix}`} required autocomplete="email" />
      </div>
      <button type="submit" class="btn btn-primary">
        RSVP
      </button>
    </form>
  )
}

export function EventDetailPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  staffInboxCount,
  occurrence,
  rsvpCount = 0,
  rsvpError,
}: PageProps & {
  occurrence: EventOccurrenceView
  rsvpCount?: number
  rsvpError?: string
}) {
  const { master, starts_at, ends_at } = occurrence
  const flyerUrl = eventFlyerUrl(master)
  const hasMap = master.latitude != null && master.longitude != null
  const rsvpEnabled = master.rsvp_enabled === 1
  const limit = master.registration_limit
  const spotsLeft = limit != null ? Math.max(0, limit - rsvpCount) : null
  const isFull = spotsLeft === 0
  const errorMessage = rsvpError ? RSVP_ERROR_MESSAGES[rsvpError] ?? RSVP_ERROR_MESSAGES.invalid : null

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation, staffInboxCount })}
      title={master.title}
      description={master.description ?? undefined}
    >
      <article class="event-detail">
        <div class="container event-detail-body">
          <p class="event-detail-back">
            <a class="text-link" href="/events">
              ← Back to events
            </a>
          </p>

          <div class={`event-detail-grid${flyerUrl ? ' event-detail-grid--with-flyer' : ''}`}>
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

              <div class="event-detail-card event-detail-registration">
                <h2 class="event-detail-card-title">Registration</h2>
                {rsvpEnabled ? (
                  isFull ? (
                    <p class="event-detail-card-muted">This event is full. Registration is closed.</p>
                  ) : (
                    <EventRsvpForm
                      eventId={master.id}
                      startsAt={starts_at}
                      spotsLeft={spotsLeft}
                      limit={limit}
                      errorMessage={errorMessage}
                    />
                  )
                ) : master.registration_url ? (
                  <a class="btn btn-primary event-detail-register" href={master.registration_url}>
                    Register
                  </a>
                ) : (
                  <p class="event-detail-card-muted">
                    Registration is not required for this event. Attendance is free and open!
                  </p>
                )}
                {rsvpEnabled && master.registration_url && (
                  <p class="event-detail-card-muted event-rsvp-alt">
                    Prefer an external form?{' '}
                    <a href={master.registration_url} target="_blank" rel="noopener noreferrer">
                      Register elsewhere ↗
                    </a>
                  </p>
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

            {flyerUrl && (
              <aside class="event-detail-sidebar">
                <img src={flyerUrl} alt="" class="event-detail-flyer" loading="lazy" decoding="async" />
              </aside>
            )}
          </div>
        </div>
      </article>
    </Layout>
  )
}

export function EventRsvpThanksPage(
  props: PageProps & { eventTitle: string; eventHref: string },
) {
  return (
    <StatusPage
      {...props}
      title="RSVP confirmed"
      heading="You're on the list"
      lead={`Thanks for registering for ${props.eventTitle}. We look forward to seeing you.`}
      ctaHref={props.eventHref}
      ctaLabel="Back to event"
    />
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
