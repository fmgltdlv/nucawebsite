type EventLocationFieldsProps = {
  formId?: string
  location?: string | null
  latitude?: number | null
  longitude?: number | null
}

export function EventLocationFields({
  formId,
  location,
  latitude,
  longitude,
}: EventLocationFieldsProps) {
  const idPrefix = formId ? `${formId}-` : ''
  const hasCoords = latitude != null && longitude != null
  const trimmedLocation = location?.trim() ?? ''

  return (
    <div
      class="form-field"
      data-event-location-field
      data-initial-location={trimmedLocation}
      data-initial-latitude={hasCoords ? String(latitude) : ''}
      data-initial-longitude={hasCoords ? String(longitude) : ''}
    >
      <label for={`${idPrefix}location`}>Location</label>
      <div class="event-location-suggest-wrap">
        <input
          type="text"
          name="location"
          id={`${idPrefix}location`}
          value={location ?? ''}
          data-event-location-input
          autocomplete="off"
          aria-autocomplete="list"
          aria-controls={`${idPrefix}location-suggestions`}
        />
        <ul
          id={`${idPrefix}location-suggestions`}
          class="event-location-suggestions"
          data-event-location-suggestions
          hidden
          role="listbox"
          aria-label="Address suggestions"
        />
      </div>
      <input type="hidden" name="latitude" value={hasCoords ? String(latitude) : ''} data-event-latitude />
      <input type="hidden" name="longitude" value={hasCoords ? String(longitude) : ''} data-event-longitude />
      <input type="hidden" name="map_skip" value="0" data-event-map-skip />
      <p class="form-hint">
        Full street address when possible. Press Enter to search Clark County addresses for the map.
      </p>
      {hasCoords && (
        <p class="form-hint" data-event-coords-hint>
          Map coordinates saved ({latitude!.toFixed(5)}, {longitude!.toFixed(5)}).
        </p>
      )}
    </div>
  )
}

export function EventLocationPickerDialog() {
  return (
    <dialog id="event-location-picker" class="admin-modal admin-location-picker-dialog">
      <div class="admin-modal-form">
        <header class="admin-modal-header">
          <h2>Set location on map</h2>
          <button type="button" class="admin-modal-close" aria-label="Close" data-modal-close>
            ×
          </button>
        </header>
        <div class="admin-modal-body">
          <p class="admin-location-picker-lead" data-event-location-picker-message>
            We could not find that address automatically. Click the map to place a pin, or save without a map.
          </p>
          <div id="event-location-map" class="event-location-picker-map" role="application" aria-label="Map for choosing event location"></div>
          <p class="form-hint" data-event-location-picker-coords>
            Click the map to place a pin.
          </p>
        </div>
        <footer class="admin-modal-footer">
          <button type="button" class="btn btn-secondary" data-modal-close>
            Go back
          </button>
          <button type="button" class="btn btn-secondary" data-event-location-skip>
            Save without map
          </button>
          <button type="button" class="btn btn-primary" data-event-location-confirm disabled>
            Save with this pin
          </button>
        </footer>
      </div>
    </dialog>
  )
}
