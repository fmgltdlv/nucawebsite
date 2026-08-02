import type { EventRecord } from '../../lib/events'
import type { EventRsvpRecord } from '../../lib/event-rsvps'
import { formatEventDateShort } from '../../lib/format'
import { AdminShell } from '../../views/AdminShell'
import { AdminListSection, AdminListSearch } from '../../views/admin/AdminListSection'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function rsvpSearchText(rsvp: EventRsvpRecord): string {
  return [rsvp.name, rsvp.email, rsvp.occurrence_starts_at, rsvp.created_at]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function RsvpListRow({
  rsvp,
  eventId,
}: {
  rsvp: EventRsvpRecord
  eventId: string
}) {
  return (
    <tr data-admin-list-row data-search={rsvpSearchText(rsvp)}>
      <td>
        <time dateTime={rsvp.created_at}>{formatEventDateShort(rsvp.created_at)}</time>
      </td>
      <td><strong>{rsvp.name}</strong></td>
      <td>
        <a href={`mailto:${rsvp.email}`}>{rsvp.email}</a>
      </td>
      <td>
        <time dateTime={rsvp.occurrence_starts_at}>{formatEventDateShort(rsvp.occurrence_starts_at)}</time>
      </td>
      <td class="admin-list-actions">
        <form method="post" action={`/admin/events/${eventId}/rsvps/${rsvp.id}/delete`} class="admin-inline-form">
          <button type="submit" class="btn btn-secondary btn-sm">Delete</button>
        </form>
      </td>
    </tr>
  )
}

export function AdminEventRsvpsPage({
  ctx,
  event,
  rsvps,
  flash,
  ...site
}: PageProps & {
  ctx: AdminContext
  event: EventRecord
  rsvps: EventRsvpRecord[]
  flash?: string
}) {
  const limitLabel =
    event.registration_limit != null ? `Limit ${event.registration_limit} per occurrence` : 'No limit'

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title={`RSVPs — ${event.title}`}
      activePath="/admin/events"
    >
      <p class="admin-note">
        <a href="/admin/events">← Events</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}

      <p class="section-lead">
        {rsvps.length} RSVP{rsvps.length === 1 ? '' : 's'} total · {limitLabel}
        {event.rsvp_enabled !== 1 && ' · On-site RSVP is currently disabled'}
      </p>

      <AdminListSection
        title="RSVPs"
        count={rsvps.length}
        emptyMessage="No RSVPs yet for this event."
        hasItems={rsvps.length > 0}
        toolbar={
          <>
            <AdminListSearch />
            {rsvps.length > 0 && (
              <a class="btn btn-secondary btn-sm" href={`/admin/events/${event.id}/rsvps/export`}>
                Export CSV
              </a>
            )}
          </>
        }
        tableHead={
          <tr>
            <th>Submitted</th>
            <th>Name</th>
            <th>Email</th>
            <th>Occurrence</th>
            <th></th>
          </tr>
        }
        tableBody={rsvps.map((rsvp) => (
          <RsvpListRow rsvp={rsvp} eventId={event.id} key={rsvp.id} />
        ))}
      />
    </AdminShell>
  )
}
