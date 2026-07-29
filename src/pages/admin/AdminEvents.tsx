import type { EventRecord } from '../../lib/events'
import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function AdminEventsPage({
  theme,
  ctx,
  events,
  flash,
}: PageProps & { ctx: AdminContext; events: EventRecord[]; flash?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Events"
      activePath="/admin/events"
    >
      {flash && <p class="admin-flash">{flash}</p>}
      <section class="admin-form-section">
        <h2>Add event</h2>
        <form class="form" method="post" action="/admin/events">
          <div class="form-field">
            <label for="title">Title</label>
            <input type="text" name="title" id="title" required />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label for="starts_at">Starts (local date/time)</label>
              <input type="datetime-local" name="starts_at" id="starts_at" required />
            </div>
            <div class="form-field">
              <label for="ends_at">Ends (optional)</label>
              <input type="datetime-local" name="ends_at" id="ends_at" />
            </div>
          </div>
          <div class="form-field">
            <label for="location">Location</label>
            <input type="text" name="location" id="location" />
          </div>
          <div class="form-field">
            <label for="description">Description</label>
            <textarea name="description" id="description" rows={3}></textarea>
          </div>
          <div class="form-field">
            <label for="registration_url">Registration URL</label>
            <input type="url" name="registration_url" id="registration_url" />
          </div>
          <button type="submit" class="btn btn-primary">Publish event</button>
        </form>
      </section>
      <section class="section">
        <h2>Upcoming events</h2>
        <ul class="admin-event-list">
          {events.map((e) => (
            <li key={e.id}>
              <strong>{e.title}</strong>
              <span>{formatEventDate(e.starts_at)}</span>
              {e.location && <span>{e.location}</span>}
            </li>
          ))}
        </ul>
        {events.length === 0 && <p class="muted">No events in the database yet.</p>}
      </section>
    </AdminShell>
  )
}
