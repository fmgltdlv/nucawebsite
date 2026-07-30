import type { EventRecord } from '../../lib/events'
import { toDatetimeLocalValue } from '../../lib/datetime'
import { AdminShell } from '../../views/AdminShell'
import { AdminCrudSections } from '../../views/admin/AdminCrudSections'
import { AdminEditActions } from '../../views/admin/AdminEditActions'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function EventEditRow({ event }: { event: EventRecord }) {
  const formId = `event-${event.id}`
  return (
    <tr>
      <td>
        <input form={formId} type="text" name="title" class="admin-table-input" value={event.title} required />
      </td>
      <td>
        <input
          form={formId}
          type="datetime-local"
          name="starts_at"
          class="admin-table-input"
          value={toDatetimeLocalValue(event.starts_at)}
          required
        />
      </td>
      <td>
        <input
          form={formId}
          type="datetime-local"
          name="ends_at"
          class="admin-table-input"
          value={event.ends_at ? toDatetimeLocalValue(event.ends_at) : ''}
        />
      </td>
      <td>
        <input form={formId} type="text" name="location" class="admin-table-input" value={event.location ?? ''} />
      </td>
      <td>
        <textarea form={formId} name="description" class="admin-table-input" rows={2}>
          {event.description ?? ''}
        </textarea>
      </td>
      <td>
        <input
          form={formId}
          type="url"
          name="registration_url"
          class="admin-table-input"
          value={event.registration_url ?? ''}
        />
      </td>
      <td>
        <label class="admin-check-inline">
          <input form={formId} type="checkbox" name="published" value="1" checked={event.published === 1} />
          Published
        </label>
      </td>
      <td>
        <AdminEditActions
          formId={formId}
          saveAction={`/admin/events/${event.id}`}
          deleteAction={`/admin/events/${event.id}/delete`}
        />
      </td>
    </tr>
  )
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
      <AdminCrudSections
        flash={flash}
        addTitle="Add event"
        addForm={
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
        }
        listTitle="Events"
        listCount={events.length}
        emptyMessage="No events in the database yet."
        hasItems={events.length > 0}
        table={
          <table class="admin-members-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Starts</th>
                <th>Ends</th>
                <th>Location</th>
                <th>Description</th>
                <th>Registration</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <EventEditRow event={event} key={event.id} />
              ))}
            </tbody>
          </table>
        }
      />
    </AdminShell>
  )
}
