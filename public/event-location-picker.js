(function () {
  const CLARK_COUNTY_CENTER = [36.1699, -115.1398]
  const CLARK_COUNTY_ZOOM = 11

  /** @type {any} */
  let map = null
  /** @type {any} */
  let marker = null
  /** @type {HTMLFormElement | null} */
  let pendingForm = null
  /** @type {{ lat: number, lng: number } | null} */
  let pickedPoint = null

  window.initEventLocationPicker = function initEventLocationPicker() {
    const pickerDialog = document.getElementById('event-location-picker')
    if (!(pickerDialog instanceof HTMLDialogElement)) return

    const messageEl = pickerDialog.querySelector('[data-event-location-picker-message]')
    const coordsEl = pickerDialog.querySelector('[data-event-location-picker-coords]')
    const confirmBtn = pickerDialog.querySelector('[data-event-location-confirm]')
    const skipBtn = pickerDialog.querySelector('[data-event-location-skip]')
    const mapEl = document.getElementById('event-location-map')
    if (!mapEl) return

    if (map && map.getContainer() !== mapEl) {
      map.remove()
      map = null
      marker = null
    }

  function isEventForm(form) {
    if (!(form instanceof HTMLFormElement)) return false
    const action = form.getAttribute('action') || ''
    return action === '/admin/events' || /^\/admin\/events\/[^/]+$/.test(action)
  }

  function getLocationField(form) {
    return form.querySelector('[data-event-location-input]')
  }

  function getLatitudeInput(form) {
    return form.querySelector('[data-event-latitude]')
  }

  function getLongitudeInput(form) {
    return form.querySelector('[data-event-longitude]')
  }

  function getMapSkipInput(form) {
    return form.querySelector('[data-event-map-skip]')
  }

  function getCoordsHint(form) {
    return form.querySelector('[data-event-coords-hint]')
  }

  function readLocation(form) {
    const input = getLocationField(form)
    return input instanceof HTMLInputElement ? input.value.trim() : ''
  }

  function readManualCoords(form) {
    const latInput = getLatitudeInput(form)
    const lngInput = getLongitudeInput(form)
    const lat = latInput instanceof HTMLInputElement ? Number(latInput.value) : NaN
    const lng = lngInput instanceof HTMLInputElement ? Number(lngInput.value) : NaN
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }

  function setManualCoords(form, lat, lng) {
    const latInput = getLatitudeInput(form)
    const lngInput = getLongitudeInput(form)
    const skipInput = getMapSkipInput(form)
    if (latInput instanceof HTMLInputElement) latInput.value = String(lat)
    if (lngInput instanceof HTMLInputElement) lngInput.value = String(lng)
    if (skipInput instanceof HTMLInputElement) skipInput.value = '0'

    const hint = getCoordsHint(form)
    if (hint instanceof HTMLElement) {
      hint.textContent = `Map coordinates saved (${lat.toFixed(5)}, ${lng.toFixed(5)}).`
      hint.hidden = false
    }
  }

  function clearManualCoords(form) {
    const latInput = getLatitudeInput(form)
    const lngInput = getLongitudeInput(form)
    const skipInput = getMapSkipInput(form)
    if (latInput instanceof HTMLInputElement) latInput.value = ''
    if (lngInput instanceof HTMLInputElement) lngInput.value = ''
    if (skipInput instanceof HTMLInputElement) skipInput.value = '0'

    const hint = getCoordsHint(form)
    if (hint instanceof HTMLElement) hint.hidden = true
  }

  function setSkipMap(form) {
    clearManualCoords(form)
    const skipInput = getMapSkipInput(form)
    if (skipInput instanceof HTMLInputElement) skipInput.value = '1'
  }

  function resetPickerState() {
    pickedPoint = null
    if (confirmBtn instanceof HTMLButtonElement) confirmBtn.disabled = true
    if (coordsEl instanceof HTMLElement) {
      coordsEl.textContent = 'Click the map to place a pin.'
    }
  }

  function ensureMap() {
    if (!mapEl || typeof window.L === 'undefined') return null
    if (map) return map

    map = window.L.map(mapEl, {
      scrollWheelZoom: true,
    }).setView(CLARK_COUNTY_CENTER, CLARK_COUNTY_ZOOM)

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', (event) => {
      const { lat, lng } = event.latlng
      pickedPoint = { lat, lng }
      if (marker) marker.setLatLng(event.latlng)
      else marker = window.L.marker(event.latlng).addTo(map)
      if (confirmBtn instanceof HTMLButtonElement) confirmBtn.disabled = false
      if (coordsEl instanceof HTMLElement) {
        coordsEl.textContent = `Pin placed at ${lat.toFixed(5)}, ${lng.toFixed(5)}.`
      }
    })

    return map
  }

  function invalidateMapSize() {
    if (!map) return
    window.setTimeout(() => map.invalidateSize(), 50)
  }

  function openPicker(form, location) {
    pendingForm = form
    resetPickerState()
    if (messageEl instanceof HTMLElement) {
      messageEl.textContent = `We could not find "${location}" automatically. Click the map to place a pin, or save without a map.`
    }

    const existingCoords = readManualCoords(form)
    pickerDialog.showModal()
    const mapInstance = ensureMap()
    if (!mapInstance) {
      window.alert('The map could not be loaded. You can still save without a map.')
      return
    }

    if (existingCoords) {
      const latLng = window.L.latLng(existingCoords.lat, existingCoords.lng)
      mapInstance.setView(latLng, 15)
      marker = window.L.marker(latLng).addTo(mapInstance)
      pickedPoint = existingCoords
      if (confirmBtn instanceof HTMLButtonElement) confirmBtn.disabled = false
      if (coordsEl instanceof HTMLElement) {
        coordsEl.textContent = `Pin placed at ${existingCoords.lat.toFixed(5)}, ${existingCoords.lng.toFixed(5)}.`
      }
    } else {
      mapInstance.setView(CLARK_COUNTY_CENTER, CLARK_COUNTY_ZOOM)
      if (marker) {
        marker.remove()
        marker = null
      }
    }

    invalidateMapSize()
  }

  function closePicker() {
    pickerDialog.close()
    pendingForm = null
    resetPickerState()
  }

  function submitPendingForm() {
    if (!(pendingForm instanceof HTMLFormElement)) return
    const form = pendingForm
    closePicker()
    form.dataset.locationProcessed = '1'
    form.requestSubmit()
  }

  async function geocodeAddress(address) {
    const response = await fetch(`/admin/api/geocode?address=${encodeURIComponent(address)}`)
    if (!response.ok) return null
    const data = await response.json()
    if (!data?.ok) return null
    return {
      lat: Number(data.latitude),
      lng: Number(data.longitude),
    }
  }

  function getLocationFieldRoot(form) {
    return form.querySelector('[data-event-location-field]')
  }

  function readInitialState(form) {
    const root = getLocationFieldRoot(form)
    if (!(root instanceof HTMLElement)) {
      return { location: '', latitude: NaN, longitude: NaN }
    }
    return {
      location: root.dataset.initialLocation ?? '',
      latitude: Number(root.dataset.initialLatitude),
      longitude: Number(root.dataset.initialLongitude),
    }
  }

  function shouldSkipGeocodeCheck(form) {
    if (form.dataset.locationProcessed === '1') return true
    const location = readLocation(form)
    if (!location) return true

    const skipInput = getMapSkipInput(form)
    if (skipInput instanceof HTMLInputElement && skipInput.value === '1') return true

    const manual = readManualCoords(form)
    if (manual) return true

    const initial = readInitialState(form)
    if (
      location === initial.location &&
      Number.isFinite(initial.latitude) &&
      Number.isFinite(initial.longitude)
    ) {
      return true
    }

    return false
  }

  document.querySelectorAll('form').forEach((form) => {
    if (!isEventForm(form)) return
    if (form.dataset.eventLocationWired === '1') return
    form.dataset.eventLocationWired = '1'

    const locationInput = getLocationField(form)
    locationInput?.addEventListener('input', () => {
      delete form.dataset.locationProcessed
      clearManualCoords(form)
    })

    form.addEventListener('submit', async (event) => {
      if (event.defaultPrevented) return
      if (shouldSkipGeocodeCheck(form)) return

      event.preventDefault()
      const location = readLocation(form)
      const submitter = event.submitter

      if (submitter instanceof HTMLElement) {
        submitter.setAttribute('aria-busy', 'true')
        submitter.disabled = true
      }

      try {
        const result = await geocodeAddress(location)
        if (result) {
          setManualCoords(form, result.lat, result.lng)
          form.dataset.locationProcessed = '1'
          form.requestSubmit(submitter ?? undefined)
          return
        }
        openPicker(form, location)
      } catch {
        openPicker(form, location)
      } finally {
        if (submitter instanceof HTMLElement) {
          submitter.removeAttribute('aria-busy')
          submitter.disabled = false
        }
      }
    })
  })

  if (pickerDialog.dataset.eventPickerWired !== '1') {
    pickerDialog.dataset.eventPickerWired = '1'

    confirmBtn?.addEventListener('click', () => {
      if (!(pendingForm instanceof HTMLFormElement) || !pickedPoint) return
      setManualCoords(pendingForm, pickedPoint.lat, pickedPoint.lng)
      submitPendingForm()
    })

    skipBtn?.addEventListener('click', () => {
      if (!(pendingForm instanceof HTMLFormElement)) return
      setSkipMap(pendingForm)
      submitPendingForm()
    })

    pickerDialog.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => closePicker())
    })

    pickerDialog.addEventListener('click', (event) => {
      const rect = pickerDialog.getBoundingClientRect()
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inDialog) closePicker()
    })
  }
  }

  window.initEventLocationPicker()
})()
