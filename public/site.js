(function () {
  const toggle = document.getElementById('nav-toggle')
  const nav = document.getElementById('site-nav')

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open')
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  }

  document.querySelectorAll('.submenu-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.has-submenu')
      if (!item) return
      const open = item.classList.toggle('is-submenu-open')
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  })

  const search = document.getElementById('member-search')
  const grid = document.getElementById('member-grid')
  const empty = document.getElementById('member-search-empty')
  const filterBar = document.getElementById('member-type-filters')

  if (grid && empty) {
    const items = grid.querySelectorAll('.member-bubble')
    const validTypes = new Set(['contractor', 'associate', 'institutional'])

    function readTypeFromUrl() {
      const type = new URLSearchParams(window.location.search).get('type')
      return validTypes.has(type) ? type : 'all'
    }

    let activeType = readTypeFromUrl()

    function applyMemberFilters() {
      const q = search?.value.trim().toLowerCase() ?? ''
      let visible = 0

      items.forEach((item) => {
        const memberType = item.getAttribute('data-member-type') ?? ''
        const typeMatch = activeType === 'all' || memberType === activeType
        const text = item.textContent?.toLowerCase() ?? ''
        const searchMatch = !q || text.includes(q)
        const show = typeMatch && searchMatch
        item.hidden = !show
        if (show) visible += 1
      })

      empty.hidden = visible > 0
    }

    function setActiveType(type) {
      activeType = type
      filterBar?.querySelectorAll('[data-filter]').forEach((pill) => {
        const pillType = pill.getAttribute('data-filter') ?? 'all'
        const isActive = pillType === type
        pill.classList.toggle('pill-active', isActive)
        pill.setAttribute('aria-selected', isActive ? 'true' : 'false')
      })

      const url = type === 'all' ? '/members' : `/members?type=${type}`
      window.history.replaceState(null, '', url)
      applyMemberFilters()
    }

    search?.addEventListener('input', applyMemberFilters)

    filterBar?.querySelectorAll('[data-filter]').forEach((pill) => {
      pill.addEventListener('click', () => {
        setActiveType(pill.getAttribute('data-filter') ?? 'all')
      })
    })

    if (activeType !== 'all') {
      setActiveType(activeType)
    } else {
      applyMemberFilters()
    }
  }

  const joinForm = document.getElementById('join-form')
  const memberTypeSelect = document.getElementById('member_type')

  if (joinForm && memberTypeSelect) {
    const panels = joinForm.querySelectorAll('.join-type-panel')

    function setPanelActive(panel, active) {
      panel.querySelectorAll('input, select, textarea').forEach((el) => {
        el.disabled = !active
        if (!active && (el.type === 'checkbox' || el.type === 'radio')) {
          el.checked = false
        }
      })
    }

    function syncRevenueRequired(type) {
      const needsRevenue = type === 'contractor' || type === 'associate'
      joinForm.querySelectorAll('input[name="revenue_tier"]').forEach((input) => {
        const match = input.getAttribute('data-member-type') === type
        input.required = needsRevenue && match
        if (!match) input.checked = false
      })
    }

    function syncInstitutionalRequired(type) {
      joinForm.querySelectorAll('input[name="institutional_category"]').forEach((input) => {
        input.required = type === 'institutional'
        if (type !== 'institutional') input.checked = false
      })
    }

    function updateJoinTypePanels() {
      const type = memberTypeSelect.value

      panels.forEach((panel) => {
        setPanelActive(panel, panel.getAttribute('data-member-type') === type)
      })

      syncRevenueRequired(type)
      syncInstitutionalRequired(type)
    }

    memberTypeSelect.addEventListener('change', updateJoinTypePanels)
    memberTypeSelect.addEventListener('input', updateJoinTypePanels)
    updateJoinTypePanels()

    const associatePanel = joinForm.querySelector('.join-type-panel[data-member-type="associate"]')
    if (associatePanel) {
      associatePanel.querySelectorAll('input[name="associate_products"]').forEach((box) => {
        box.addEventListener('change', () => {
          const checked = associatePanel.querySelectorAll('input[name="associate_products"]:checked')
          if (checked.length > 5) box.checked = false
        })
      })
    }
  }
})();

(function () {
  const MEMBER_LOGO_MAX_BYTES = 2 * 1024 * 1024

  function extForMime(mime) {
    if (mime === 'image/png') return 'png'
    if (mime === 'image/webp') return 'webp'
    return 'jpg'
  }

  function outputMimeForFile(file) {
    if (file.type === 'image/png') return 'image/png'
    if (file.type === 'image/webp') return 'image/webp'
    if (file.type === 'image/jpeg') return 'image/jpeg'
    const name = file.name.toLowerCase()
    if (name.endsWith('.png')) return 'image/png'
    if (name.endsWith('.webp')) return 'image/webp'
    return 'image/jpeg'
  }

  function isSvgFile(file) {
    return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read image file.'))
      }
      img.src = url
    })
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed.'))),
        mime,
        quality,
      )
    })
  }

  async function renderToBlob(img, width, height, mime, quality) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare image compression.')
    ctx.drawImage(img, 0, 0, width, height)
    return canvasToBlob(canvas, mime, quality)
  }

  async function compressMemberLogo(file) {
    if (file.size <= MEMBER_LOGO_MAX_BYTES) return file
    if (isSvgFile(file)) {
      throw new Error('SVG logos must be 2 MB or smaller. Please optimize the file first.')
    }

    const img = await loadImageFromFile(file)
    const mime = outputMimeForFile(file)
    let width = img.naturalWidth || img.width
    let height = img.naturalHeight || img.height
    let quality = mime === 'image/png' ? undefined : 0.92

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const blob = await renderToBlob(img, width, height, mime, quality)
      if (blob.size <= MEMBER_LOGO_MAX_BYTES) {
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'logo'
        return new File([blob], `${baseName}.${extForMime(mime)}`, {
          type: mime,
          lastModified: Date.now(),
        })
      }

      if (mime !== 'image/png' && quality > 0.45) {
        quality = Math.max(0.45, quality - 0.08)
        continue
      }

      width = Math.max(64, Math.round(width * 0.85))
      height = Math.max(64, Math.round(height * 0.85))
      if (mime !== 'image/png') quality = 0.85

      if (width <= 64 && height <= 64) break
    }

    throw new Error('Could not compress logo below 2 MB. Try a smaller image.')
  }

  function replaceFileInput(fileInput, file) {
    const transfer = new DataTransfer()
    transfer.items.add(file)
    fileInput.files = transfer.files
  }

  document.querySelectorAll('form[data-member-logo-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      if (form.dataset.logoProcessed === '1') return

      const logoInput = form.querySelector('input[type="file"][name="logo"]')
      const file = logoInput?.files?.[0]
      if (!file || file.size <= MEMBER_LOGO_MAX_BYTES) return

      event.preventDefault()

      const submitBtn = form.querySelector('button[type="submit"]')
      const originalText = submitBtn?.textContent ?? ''
      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.textContent = 'Compressing logo…'
      }

      try {
        const compressed = await compressMemberLogo(file)
        replaceFileInput(logoInput, compressed)
        form.dataset.logoProcessed = '1'
        form.requestSubmit()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Logo could not be compressed.'
        window.alert(message)
        if (submitBtn) {
          submitBtn.disabled = false
          submitBtn.textContent = originalText
        }
      }
    })
  })

  const addMemberDialog = document.getElementById('add-member-dialog')
  const addMemberOpen = document.getElementById('add-member-open')

  if (addMemberDialog instanceof HTMLDialogElement && addMemberOpen) {
    addMemberOpen.addEventListener('click', () => addMemberDialog.showModal())

    addMemberDialog.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => addMemberDialog.close())
    })

    addMemberDialog.addEventListener('click', (event) => {
      const rect = addMemberDialog.getBoundingClientRect()
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inDialog) addMemberDialog.close()
    })

    addMemberDialog.addEventListener('close', () => {
      const form = addMemberDialog.querySelector('form[data-member-logo-form]')
      if (!(form instanceof HTMLFormElement)) return
      form.reset()
      delete form.dataset.logoProcessed
      const submitBtn = form.querySelector('button[type="submit"]')
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = 'Add member'
      }
    })
  }

  const addEventDialog = document.getElementById('add-event-dialog')
  const addEventOpen = document.getElementById('add-event-open')

  if (addEventDialog instanceof HTMLDialogElement && addEventOpen) {
    addEventOpen.addEventListener('click', () => addEventDialog.showModal())

    addEventDialog.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => addEventDialog.close())
    })

    addEventDialog.addEventListener('click', (event) => {
      const rect = addEventDialog.getBoundingClientRect()
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inDialog) addEventDialog.close()
    })

    addEventDialog.addEventListener('close', () => {
      const form = addEventDialog.querySelector('#add-event-form')
      if (form instanceof HTMLFormElement) form.reset()
    })
  }
})();

(function () {
  const banner = document.querySelector('.breaking-news')
  const dismiss = document.querySelector('[data-breaking-dismiss]')
  if (banner && dismiss) {
    if (sessionStorage.getItem('nuca_breaking_dismissed') === '1') {
      banner.remove()
      return
    }
    dismiss.addEventListener('click', () => {
      sessionStorage.setItem('nuca_breaking_dismissed', '1')
      banner.remove()
    })
  }
})()
