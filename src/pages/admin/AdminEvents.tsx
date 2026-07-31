import type { EventRecord } from '../../lib/events'
import { eventFlyerUrl, eventThumbnailUrl } from '../../lib/events'
import { repeatRuleLabel } from '../../lib/event-repeat'
import { toDateInputValue, toDatetimeLocalValue } from '../../lib/datetime'
import { formatArchiveDate } from '../../lib/format'
import type { CommitteeRecord } from '../../lib/committees-db'
import { AdminShell } from '../../views/AdminShell'
import { AdminAssetPickerField } from '../../views/admin/AdminAssetPickerField'
import { AdminCrudSections } from '../../views/admin/AdminCrudSections'
import { AdminEditModalFooter } from '../../views/admin/AdminEditActions'
import { AdminEditButton } from '../../views/admin/AdminListSection'
import { AdminModal } from '../../views/admin/AdminModal'
import { EventLocationFields, EventLocationPickerDialog } from '../../views/admin/EventLocationFields'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function eventSearchText(event: EventRecord, committees: CommitteeRecord[]): string {
  return [
    event.title,
    event.location,
    event.description,
    event.published ? 'published' : 'draft',
    formatArchiveDate(event.starts_at),
    repeatRuleLabel(event.repeat_rule),
    committeeLabel(event.committee_key, committees),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function committeeLabel(key: string | null | undefined, committees: CommitteeRecord[]): string {
  if (!key) return '—'
  return committees.find((committee) => committee.key === key)?.name ?? '—'
}

function EventCommitteeField({
  formId,
  committeeKey,
  committees,
}: {
  formId?: string
  committeeKey?: string | null
  committees: CommitteeRecord[]
}) {
  const id = formId ? `${formId}-committee_key` : 'committee_key'
  const selected = committeeKey ?? ''

  return (
    <div class="form-field">
      <label for={id}>Committee (optional)</label>
      <select name="committee_key" id={id}>
        <option value="" selected={!selected}>
          Chapter-wide (no committee)
        </option>
        {committees.map((committee) => (
          <option value={committee.key} selected={selected === committee.key}>
            {committee.name}
          </option>
        ))}
      </select>
      <p class="form-hint">Associates this event with a committee for filtering on the public events calendar.</p>
    </div>
  )
}

function EventImageFields({
  formId,
  event,
}: {
  formId?: string
  event?: EventRecord
}) {
  const idPrefix = formId ? `${formId}-` : ''
  const thumbnailUrl = event ? eventThumbnailUrl(event) : undefined
  const flyerUrl = event ? eventFlyerUrl(event) : undefined

  return (
    <>
      <div class="form-row">
        <AdminAssetPickerField
          label="Thumbnail (list view)"
          kind="image"
          hiddenInputName="existing_thumbnail_key"
          fileInputName="thumbnail"
          fileInputId={`${idPrefix}thumbnail`}
          fileAccept="image/*"
          currentKey={event?.thumbnail_r2_key}
          currentUrl={thumbnailUrl}
          removeCheckboxName="remove_thumbnail"
          hint="Shown on the events list and home page. Square images (~400×400 px) work best."
        />
        <AdminAssetPickerField
          label="Flyer (event page)"
          kind="image"
          hiddenInputName="existing_flyer_key"
          fileInputName="flyer"
          fileInputId={`${idPrefix}flyer`}
          fileAccept="image/*"
          currentKey={event?.flyer_r2_key}
          currentUrl={flyerUrl}
          removeCheckboxName="remove_flyer"
          hint="Hero image on the public event page."
        />
      </div>
    </>
  )
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
          <option value="biweekly" selected={selectedRule === 'biweekly'}>
            Biweekly
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

function EventListRow({
  event,
  committees,
}: {
  event: EventRecord
  committees: CommitteeRecord[]
}) {
  const editModalId = `edit-event-${event.id}`

  return (
    <tr data-admin-list-row data-search={eventSearchText(event, committees)}>
      <td><strong>{event.title}</strong></td>
      <td>{formatArchiveDate(event.starts_at)}</td>
      <td>{repeatRuleLabel(event.repeat_rule)}</td>
      <td>{committeeLabel(event.committee_key, committees)}</td>
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

function EventEditModal({
  event,
  committees,
}: {
  event: EventRecord
  committees: CommitteeRecord[]
}) {
  const modalId = `edit-event-${event.id}`
  const formId = `form-event-${event.id}`

  return (
    <AdminModal
      id={modalId}
      title={`Edit ${event.title}`}
      formAction={`/admin/events/${event.id}`}
      formEncType="multipart/form-data"
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
      <EventCommitteeField formId={formId} committeeKey={event.committee_key} committees={committees} />
      <EventLocationFields
        formId={formId}
        location={event.location}
        latitude={event.latitude}
        longitude={event.longitude}
      />
      <EventImageFields formId={formId} event={event} />
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
  committees,
  flash,
}: PageProps & { ctx: AdminContext; events: EventRecord[]; committees: CommitteeRecord[]; flash?: string }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      inboxCounts={ctx.inboxCounts}
      title="Events"
      activePath="/admin/events"
    >
      <AdminCrudSections
        flash={flash}
        addButtonLabel="Add event"
        addModalId="add-event-dialog"
        addModalTitle="Add event"
        addFormAction="/admin/events"
        addFormEncType="multipart/form-data"
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
            <EventCommitteeField committees={committees} />
            <EventLocationFields />
            <EventImageFields />
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
            <th>Committee</th>
            <th>Location</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={events.map((event) => (
          <EventListRow event={event} committees={committees} key={event.id} />
        ))}
        afterTable={events.map((event) => (
          <EventEditModal event={event} committees={committees} key={event.id} />
        ))}
      />
      <EventLocationPickerDialog />
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
      <script src="/event-location-picker.js?v=1" defer></script>
    </AdminShell>
  )
}
