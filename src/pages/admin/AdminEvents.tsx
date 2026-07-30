import type { EventRecord } from '../../lib/events'
import { repeatRuleLabel } from '../../lib/event-repeat'
import { toDateInputValue, toDatetimeLocalValue } from '../../lib/datetime'
import { formatArchiveDate } from '../../lib/format'
import { AdminShell } from '../../views/AdminShell'
import { AdminCrudSections } from '../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../views/admin/AdminListSection'
import { AdminModal } from '../../views/admin/AdminModal'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function eventSearchText(event: EventRecord): string {
  return [
    event.title,
    event.location,
    event.description,
    event.published ? 'published' : 'draft',
    formatArchiveDate(event.starts_at),
    repeatRuleLabel(event.repeat_rule),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function EventRepeatFields({
  formId,
  repeatRule,
  repeatUntil,
}: {
  formId?: string
  repeatRule?: string | null
  repeatUntil?: string | null
}) {
  const idPrefix = formId ? `${formId}-` : ''
  const selectedRule = repeatRule ?? ''

  return (
    <div class="form-row">
      <div class="form-field">
        <label for={`${idPrefix}repeat_rule`}>Repeats</label>
        <select name="repeat_rule" id={`${idPrefix}repeat_rule`}>
          <option value="" selected={!selectedRule}>
            Does not repeat
          </option>
          <option value="weekly" selected={selectedRule === 'weekly'}>
            Weekly
          </option>
          <option value="monthly" selected={selectedRule === 'monthly'}>
            Monthly
          </option>
          <option value="yearly" selected={selectedRule === 'yearly'}>
            Yearly
          </option>
        </select>
      </div>
      <div class="form-field">
        <label for={`${idPrefix}repeat_until`}>Repeat until (optional)</label>
        <input
          type="date"
          name="repeat_until"
          id={`${idPrefix}repeat_until`}
          value={toDateInputValue(repeatUntil)}
        />
        <p class="form-hint">Leave blank to repeat for two years from the first date.</p>
      </div>
    </div>
  )
}

function EventListRow({ event }: { event: EventRecord }) {
  const editModalId = `edit-event-${event.id}`

  return (
    <tr data-admin-list-row data-search={eventSearchText(event)}>
      <td><strong>{event.title}</strong></td>
      <td>{formatArchiveDate(event.starts_at)}</td>
      <td>{repeatRuleLabel(event.repeat_rule)}</td>
      <td>{event.location ?? '—'}</td>
      <td>
        {event.published === 1 ? (
          <span class="admin-status-badge admin-status-listed">Published</span>
        ) : (
          <span class="admin-status-badge admin-status-hidden">Draft</span>
        )}
      </td>
      <td class="admin-list-actions">
        <AdminEditButton modalId={editModalId} />
      </td>
    </tr>
  )
}

function EventEditModal({ event }: { event: EventRecord }) {
  const modalId = `edit-event-${event.id}`
  const formId = `form-event-${event.id}`

  return (
    <AdminModal
      id={modalId}
      title={`Edit ${event.title}`}
      formAction={`/admin/events/${event.id}`}
      formId={formId}
      footer={
        <AdminEditModalFooter
          formId={formId}
          saveAction={`/admin/events/${event.id}`}
          deleteAction={`/admin/events/${event.id}/delete`}
        />
      }
    >
      <div class="form-field">
        <label for={`${formId}-title`}>Title</label>
        <input type="text" name="title" id={`${formId}-title`} value={event.title} required />
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for={`${formId}-starts`}>Starts (local date/time)</label>
          <input
            type="datetime-local"
            name="starts_at"
            id={`${formId}-starts`}
            value={toDatetimeLocalValue(event.starts_at)}
            required
          />
        </div>
        <div class="form-field">
          <label for={`${formId}-ends`}>Ends (optional)</label>
          <input
            type="datetime-local"
            name="ends_at"
            id={`${formId}-ends`}
            value={event.ends_at ? toDatetimeLocalValue(event.ends_at) : ''}
          />
        </div>
      </div>
      <EventRepeatFields
        formId={formId}
        repeatRule={event.repeat_rule}
        repeatUntil={event.repeat_until}
      />
      <div class="form-field">
        <label for={`${formId}-location`}>Location</label>
        <input type="text" name="location" id={`${formId}-location`} value={event.location ?? ''} />
      </div>
      <div class="form-field">
        <label for={`${formId}-description`}>Description</label>
        <textarea name="description" id={`${formId}-description`} rows={4}>
          {event.description ?? ''}
        </textarea>
      </div>
      <div class="form-field">
        <label for={`${formId}-registration`}>Registration URL</label>
        <input
          type="url"
          name="registration_url"
          id={`${formId}-registration`}
          value={event.registration_url ?? ''}
        />
      </div>
      <label class="admin-check">
        <input type="checkbox" name="published" value="1" checked={event.published === 1} />
        Published on public events page
      </label>
    </AdminModal>
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
        addButtonLabel="Add event"
        addModalId="add-event-dialog"
        addModalTitle="Add event"
        addFormAction="/admin/events"
        addFormId="add-event-form"
        addSubmitLabel="Publish event"
        addFormBody={
          <>
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
            <EventRepeatFields />
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
          </>
        }
        listTitle="Events"
        listCount={events.length}
        emptyMessage="No events in the database yet. Click Add event to create one."
        hasItems={events.length > 0}
        tableHead={
          <tr>
            <th>Title</th>
            <th>Starts</th>
            <th>Repeats</th>
            <th>Location</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={events.map((event) => <EventListRow event={event} key={event.id} />)}
        afterTable={events.map((event) => <EventEditModal event={event} key={event.id} />)}
      />
    </AdminShell>
  )
}
