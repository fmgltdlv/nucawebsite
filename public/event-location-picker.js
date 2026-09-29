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
  /** @type {'submit' | 'pin'} */
  let pickerMode = 'submit'
  /** @type {number} */
  let pickerSession = 0

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

  function getSuggestionsList(form) {
    return form.querySelector('[data-event-location-suggestions]')
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

  function clearSuggestions(form) {
    const list = getSuggestionsList(form)
    if (!(list instanceof HTMLElement)) return
    list.replaceChildren()
    list.hidden = true
  }

  function applySuggestion(form, candidate) {
    const input = getLocationField(form)
    if (input instanceof HTMLInputElement) input.value = candidate.formatted
    setManualCoords(form, candidate.lat, candidate.lng)
    clearSuggestions(form)
    form.dataset.locationProcessed = '1'
  }

  function renderSuggestions(form, candidates) {
    const list = getSuggestionsList(form)
    if (!(list instanceof HTMLElement)) return

    list.replaceChildren()
    if (!candidates.length) {
      const empty = document.createElement('li')
      empty.className = 'event-location-suggestion event-location-suggestion-empty'
      empty.setAttribute('role', 'option')
      empty.textContent = 'No matching addresses found.'
      list.appendChild(empty)

      const choose = document.createElement('li')
      choose.className = 'event-location-suggestion'
      choose.setAttribute('role', 'option')
      choose.tabIndex = 0
      choose.textContent = 'Choose this place on the map'
      choose.addEventListener('click', () => {
        clearSuggestions(form)
        openPicker(form, readLocation(form), 'pin')
      })
      choose.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          clearSuggestions(form)
          openPicker(form, readLocation(form), 'pin')
        }
      })
      list.appendChild(choose)
      list.hidden = false
      return
    }

    candidates.forEach((candidate) => {
      const item = document.createElement('li')
      item.className = 'event-location-suggestion'
      item.setAttribute('role', 'option')
      item.tabIndex = 0
      item.textContent = candidate.formatted
      item.addEventListener('click', () => applySuggestion(form, candidate))
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          applySuggestion(form, candidate)
        }
      })
      list.appendChild(item)
    })
    list.hidden = false
  }

  async function suggestAddresses(form) {
    const location = readLocation(form)
    if (!location) {
      clearSuggestions(form)
      return
    }

    const list = getSuggestionsList(form)
    if (list instanceof HTMLElement) {
      list.replaceChildren()
      const loading = document.createElement('li')
      loading.className = 'event-location-suggestion event-location-suggestion-empty'
      loading.setAttribute('role', 'option')
      loading.textContent = 'Searching addresses…'
      list.appendChild(loading)
      list.hidden = false
    }

    try {
      const response = await fetch(
        `/admin/api/geocode?suggest=1&address=${encodeURIComponent(location)}`,
        { credentials: 'same-origin' },
      )
      if (response.status === 401) {
        renderSuggestions(form, [])
        const list = getSuggestionsList(form)
        if (list instanceof HTMLElement && list.firstChild instanceof HTMLElement) {
          list.firstChild.textContent = 'Sign in again to search addresses.'
        }
        return
      }
      if (!response.ok) {
        renderSuggestions(form, [])
        return
      }
      const data = await response.json()
      const candidates = Array.isArray(data?.candidates)
        ? data.candidates.map((candidate) => ({
            formatted: String(candidate.formatted || ''),
            lat: Number(candidate.latitude),
            lng: Number(candidate.longitude),
          })).filter((candidate) => candidate.formatted && Number.isFinite(candidate.lat) && Number.isFinite(candidate.lng))
        : []
      renderSuggestions(form, candidates)
    } catch {
      renderSuggestions(form, [])
    }
  }

  function resetPickerState() {
    pickedPoint = null
    if (confirmBtn instanceof HTMLButtonElement) confirmBtn.disabled = true
    if (coordsEl instanceof HTMLElement) {
      coordsEl.textContent = 'Click the map to place a pin.'
    }
  }

  function placePin(lat, lng, zoom) {
    if (!map || typeof window.L === 'undefined') return
    const latLng = window.L.latLng(lat, lng)
    pickedPoint = { lat, lng }
    if (marker) marker.setLatLng(latLng)
    else marker = window.L.marker(latLng).addTo(map)
    map.setView(latLng, zoom)
    if (confirmBtn instanceof HTMLButtonElement) confirmBtn.disabled = false
    if (coordsEl instanceof HTMLElement) {
      coordsEl.textContent = `Pin placed at ${lat.toFixed(5)}, ${lng.toFixed(5)}.`
    }
  }

  function ensureMap() {
    if (!mapEl || typeof window.L === 'undefined') return null
    if (map) return map

    window.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    map = window.L.map(mapEl, {
      scrollWheelZoom: true,
    }).setView(CLARK_COUNTY_CENTER, CLARK_COUNTY_ZOOM)

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', (event) => {
      placePin(event.latlng.lat, event.latlng.lng, map.getZoom())
    })

    return map
  }

  function invalidateMapSize() {
    if (!map) return
    window.setTimeout(() => map.invalidateSize(), 50)
  }

  function openPicker(form, location, mode) {
    pickerSession += 1
    const session = pickerSession
    pendingForm = form
    pickerMode = mode === 'pin' ? 'pin' : 'submit'
    resetPickerState()
    if (skipBtn instanceof HTMLButtonElement) skipBtn.hidden = pickerMode === 'pin'
    if (confirmBtn instanceof HTMLButtonElement) {
      confirmBtn.textContent = pickerMode === 'pin' ? 'Use this pin' : 'Save with this pin'
    }
    if (messageEl instanceof HTMLElement) {
      const quoted = location ? ` "${location}"` : ''
      messageEl.textContent =
        pickerMode === 'pin'
          ? `Click the map to set coordinates for${quoted}. The address you typed is what visitors see.`
          : `We could not find${quoted} automatically. The address will still be saved. Click the map to set coordinates, or save without a map.`
    }

    const existingCoords = readManualCoords(form)
    pickerDialog.showModal()
    const mapInstance = ensureMap()
    if (!mapInstance) {
      window.alert('The map could not be loaded. You can still save the address without a map.')
      return
    }

    if (existingCoords) {
      placePin(existingCoords.lat, existingCoords.lng, 15)
    } else {
      mapInstance.setView(CLARK_COUNTY_CENTER, CLARK_COUNTY_ZOOM)
      if (marker) {
        marker.remove()
        marker = null
      }
      if (pickerMode === 'pin' && location) {
        void centerPickerOnAddress(location, session)
      }
    }

    invalidateMapSize()
  }

  async function centerPickerOnAddress(location, session) {
    if (coordsEl instanceof HTMLElement) coordsEl.textContent = 'Searching for that address…'
    try {
      const result = await geocodeAddress(location)
      if (session !== pickerSession) return
      if (pendingForm == null || pickerMode !== 'pin' || pickedPoint) return
      if (!result) {
        if (coordsEl instanceof HTMLElement) coordsEl.textContent = 'Click the map to place a pin.'
        return
      }
      placePin(result.lat, result.lng, 16)
    } catch {
      if (session !== pickerSession) return
      if (pendingForm != null && !pickedPoint && coordsEl instanceof HTMLElement) {
        coordsEl.textContent = 'Click the map to place a pin.'
      }
    }
  }

  function closePicker() {
    pickerSession += 1
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
    const response = await fetch(`/admin/api/geocode?address=${encodeURIComponent(address)}`, {
      credentials: 'same-origin',
    })
    if (!response.ok) return null
    const data = await response.json()
    if (!data?.ok) return null
    const lat = Number(data.latitude)
    const lng = Number(data.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
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
      clearSuggestions(form)
    })

    locationInput?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      void suggestAddresses(form)
    })

    form.querySelector('[data-event-location-open-map]')?.addEventListener('click', () => {
      clearSuggestions(form)
      openPicker(form, readLocation(form), 'pin')
    })

    locationInput?.addEventListener('blur', () => {
      window.setTimeout(() => {
        const list = getSuggestionsList(form)
        if (!(list instanceof HTMLElement)) return
        if (list.contains(document.activeElement)) return
        clearSuggestions(form)
      }, 150)
    })

    form.addEventListener('submit', async (event) => {
      if (event.defaultPrevented) return
      clearSuggestions(form)
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
        openPicker(form, location, 'submit')
      } catch {
        openPicker(form, location, 'submit')
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
      if (pickerMode === 'pin') {
        pendingForm.dataset.locationProcessed = '1'
        closePicker()
        return
      }
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
