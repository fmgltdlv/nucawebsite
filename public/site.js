(function () {
  // NUCA public site interactions
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
  const memberPagination = document.getElementById('member-pagination')
  const memberPagePrev = document.getElementById('member-page-prev')
  const memberPageNext = document.getElementById('member-page-next')
  const memberPageInfo = document.getElementById('member-page-info')

  if (grid && empty) {
    const items = Array.from(grid.querySelectorAll('.member-bubble'))
    const validTypes = new Set(['contractor', 'associate', 'institutional'])
    const MEMBER_PAGE_SIZE = 15
    let currentMemberPage = 0

    function readTypeFromUrl() {
      const type = new URLSearchParams(window.location.search).get('type')
      return validTypes.has(type) ? type : 'all'
    }

    let activeType = readTypeFromUrl()

    function getFilteredMemberItems() {
      const q = search?.value.trim().toLowerCase() ?? ''
      return items.filter((item) => {
        const memberType = item.getAttribute('data-member-type') ?? ''
        const typeMatch = activeType === 'all' || memberType === activeType
        const text = item.textContent?.toLowerCase() ?? ''
        const searchMatch = !q || text.includes(q)
        return typeMatch && searchMatch
      })
    }

    function updateMemberPagination(filteredCount, totalPages) {
      const usePagination = filteredCount > MEMBER_PAGE_SIZE

      if (memberPagination instanceof HTMLElement) {
        memberPagination.hidden = !usePagination
      }

      if (memberPageInfo instanceof HTMLElement) {
        memberPageInfo.textContent =
          filteredCount === 0
            ? 'No matches'
            : `Page ${currentMemberPage + 1} of ${totalPages} (${filteredCount} members)`
      }

      if (memberPagePrev instanceof HTMLButtonElement) {
        memberPagePrev.disabled = currentMemberPage <= 0
      }
      if (memberPageNext instanceof HTMLButtonElement) {
        memberPageNext.disabled = currentMemberPage >= totalPages - 1
      }
    }

    function applyMemberFilters() {
      const filtered = getFilteredMemberItems()
      const usePagination = filtered.length > MEMBER_PAGE_SIZE
      const totalPages = usePagination
        ? Math.max(1, Math.ceil(filtered.length / MEMBER_PAGE_SIZE))
        : 1

      if (currentMemberPage >= totalPages) currentMemberPage = totalPages - 1

      items.forEach((item) => {
        item.hidden = true
      })

      let visibleItems = filtered
      if (usePagination) {
        const start = currentMemberPage * MEMBER_PAGE_SIZE
        visibleItems = filtered.slice(start, start + MEMBER_PAGE_SIZE)
      }

      visibleItems.forEach((item) => {
        item.hidden = false
      })

      empty.hidden = filtered.length > 0
      updateMemberPagination(filtered.length, totalPages)
    }

    function setActiveType(type) {
      activeType = type
      currentMemberPage = 0
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

    search?.addEventListener('input', () => {
      currentMemberPage = 0
      applyMemberFilters()
    })

    filterBar?.querySelectorAll('[data-filter]').forEach((pill) => {
      pill.addEventListener('click', () => {
        setActiveType(pill.getAttribute('data-filter') ?? 'all')
      })
    })

    memberPagePrev?.addEventListener('click', () => {
      if (currentMemberPage > 0) {
        currentMemberPage -= 1
        applyMemberFilters()
      }
    })

    memberPageNext?.addEventListener('click', () => {
      const filtered = getFilteredMemberItems()
      const totalPages = Math.max(1, Math.ceil(filtered.length / MEMBER_PAGE_SIZE))
      if (currentMemberPage < totalPages - 1) {
        currentMemberPage += 1
        applyMemberFilters()
      }
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

  /** Parse JSON embedded in application/json script tags (handles legacy HTML escaping). */
  function parseJsonScript(el) {
    const text = el?.textContent?.trim()
    if (!text) return null

    try {
      return JSON.parse(text)
    } catch {
      if (!/[&][a-z]+;|&#\d+;/.test(text)) return null

      const textarea = document.createElement('textarea')
      textarea.innerHTML = text
      try {
        return JSON.parse(textarea.value)
      } catch {
        return null
      }
    }
  }

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

  function getFormSubmitButtons(form) {
    if (!(form instanceof HTMLFormElement)) return []
    const buttons = new Set()
    form.querySelectorAll('button[type="submit"], input[type="submit"]').forEach((el) => buttons.add(el))
    if (form.id) {
      document
        .querySelectorAll(`button[type="submit"][form="${CSS.escape(form.id)}"]`)
        .forEach((el) => buttons.add(el))
    }
    return Array.from(buttons)
  }

  function pendingLabelForButton(button) {
    if (button instanceof HTMLInputElement) return 'Saving…'
    const custom = button.dataset.pendingLabel
    if (custom) return custom
    const lower = (button.textContent || '').trim().toLowerCase()
    if (lower.includes('delete')) return 'Deleting…'
    if (lower.includes('approve')) return 'Approving…'
    if (lower.includes('reject')) return 'Rejecting…'
    if (lower.includes('add')) return 'Adding…'
    if (lower.includes('update')) return 'Updating…'
    if (lower.includes('sign out') || lower.includes('sign in')) return 'Please wait…'
    return 'Saving…'
  }

  function setButtonBusy(button, busy, pendingLabel) {
    if (!(button instanceof HTMLButtonElement) && !(button instanceof HTMLInputElement)) return
    if (busy) {
      if (!button.dataset.originalLabel) {
        button.dataset.originalLabel =
          button instanceof HTMLInputElement ? button.value : button.textContent?.trim() ?? ''
      }
      button.disabled = true
      button.setAttribute('aria-busy', 'true')
      if (button instanceof HTMLButtonElement) button.textContent = pendingLabel
      else button.value = pendingLabel
      return
    }

    button.disabled = false
    button.removeAttribute('aria-busy')
    const original = button.dataset.originalLabel
    if (!original) return
    if (button instanceof HTMLButtonElement) button.textContent = original
    else button.value = original
    delete button.dataset.originalLabel
  }

  function resetFormBusyState(form) {
    if (!(form instanceof HTMLFormElement)) return
    getFormSubmitButtons(form).forEach((btn) => setButtonBusy(btn, false))
    form.removeAttribute('aria-busy')
    delete form.dataset.logoProcessed

    const dialog = form.closest('.admin-modal')
    if (!(dialog instanceof HTMLElement)) return
    delete dialog.dataset.saving
    dialog.querySelectorAll('[data-modal-close]').forEach((el) => {
      if (el instanceof HTMLButtonElement) el.disabled = false
    })
    dialog.querySelectorAll('button[type="submit"]').forEach((btn) => setButtonBusy(btn, false))
  }

  function setFormSavingState(form, submitter) {
    if (!(form instanceof HTMLFormElement)) return
    const pendingLabel = submitter ? pendingLabelForButton(submitter) : 'Saving…'
    getFormSubmitButtons(form).forEach((btn) => {
      setButtonBusy(btn, true, btn === submitter ? pendingLabel : pendingLabelForButton(btn))
    })
    form.setAttribute('aria-busy', 'true')
    form
      .querySelectorAll('input:not([type="hidden"]), textarea, select')
      .forEach((el) => {
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          el.disabled = true
        }
      })

    const dialog = form.closest('.admin-modal')
    if (!(dialog instanceof HTMLElement)) return
    dialog.dataset.saving = '1'
    dialog.querySelectorAll('[data-modal-close]').forEach((el) => {
      if (el instanceof HTMLButtonElement) el.disabled = true
    })
    dialog.querySelectorAll('form').forEach((nestedForm) => {
      if (nestedForm === form) return
      nestedForm.querySelectorAll('button[type="submit"]').forEach((btn) => {
        if (btn instanceof HTMLButtonElement) btn.disabled = true
      })
    })
  }

  document.querySelectorAll('form[data-member-logo-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      if (form.dataset.logoProcessed === '1') return

      const logoInput = form.querySelector('input[type="file"][name="logo"]')
      const file = logoInput?.files?.[0]
      if (!file || file.size <= MEMBER_LOGO_MAX_BYTES) return

      event.preventDefault()

      const submitBtn =
        event.submitter instanceof HTMLButtonElement
          ? event.submitter
          : getFormSubmitButtons(form).find((btn) => btn.classList.contains('btn-primary')) ??
            getFormSubmitButtons(form)[0]

      if (submitBtn) setButtonBusy(submitBtn, true, 'Compressing logo…')

      try {
        const compressed = await compressMemberLogo(file)
        replaceFileInput(logoInput, compressed)
        form.dataset.logoProcessed = '1'
        form.requestSubmit()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Logo could not be compressed.'
        window.alert(message)
        if (submitBtn) setButtonBusy(submitBtn, false)
      }
    })
  })

  const adminShell = document.querySelector('.admin-shell')
  if (adminShell) {
    adminShell.addEventListener('submit', (event) => {
      if (event.defaultPrevented) return
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (form.classList.contains('admin-logout')) return
      setFormSavingState(form, event.submitter)
    })
  }

  function wireAdminModal(dialog) {
    if (!(dialog instanceof HTMLDialogElement)) return

    dialog.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => dialog.close())
    })

    dialog.addEventListener('click', (event) => {
      if (dialog.dataset.saving === '1') return
      const rect = dialog.getBoundingClientRect()
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inDialog) dialog.close()
    })

    dialog.addEventListener('close', () => {
      const form = dialog.querySelector('form')
      if (!(form instanceof HTMLFormElement)) return
      form.reset()
      resetFormBusyState(form)
    })
  }

  document.querySelectorAll('[data-admin-modal-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-admin-modal-open')
      if (!id) return
      const dialog = document.getElementById(id)
      if (dialog instanceof HTMLDialogElement) dialog.showModal()
    })
  })

  document.querySelectorAll('.admin-modal').forEach((dialog) => {
    wireAdminModal(dialog)
  })

  document.querySelectorAll('[data-admin-list]').forEach((listRoot) => {
    const pageSize = parseInt(listRoot.getAttribute('data-page-size') || '15', 10)
    const rows = Array.from(listRoot.querySelectorAll('[data-admin-list-row]'))
    const searchInput = listRoot.querySelector('[data-admin-search]')
    const pagination = listRoot.querySelector('[data-admin-pagination]')
    const prevBtn = listRoot.querySelector('[data-admin-page-prev]')
    const nextBtn = listRoot.querySelector('[data-admin-page-next]')
    const pageInfo = listRoot.querySelector('[data-admin-page-info]')

    let filteredRows = rows
    let currentPage = 0

    function updateVisibility() {
      const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
      if (currentPage >= totalPages) currentPage = totalPages - 1

      rows.forEach((row) => {
        row.hidden = true
      })

      const start = currentPage * pageSize
      filteredRows.slice(start, start + pageSize).forEach((row) => {
        row.hidden = false
      })

      if (pagination instanceof HTMLElement) {
        pagination.hidden = filteredRows.length <= pageSize
      }

      if (pageInfo instanceof HTMLElement) {
        pageInfo.textContent =
          filteredRows.length === 0
            ? 'No matches'
            : `Page ${currentPage + 1} of ${totalPages} (${filteredRows.length} items)`
      }

      if (prevBtn instanceof HTMLButtonElement) {
        prevBtn.disabled = currentPage <= 0
      }
      if (nextBtn instanceof HTMLButtonElement) {
        nextBtn.disabled = currentPage >= totalPages - 1
      }
    }

    function applyFilter() {
      const q = searchInput instanceof HTMLInputElement ? searchInput.value.trim().toLowerCase() : ''
      filteredRows = q
        ? rows.filter((row) => {
            const text = row.getAttribute('data-search') || row.textContent?.toLowerCase() || ''
            return text.includes(q)
          })
        : rows
      currentPage = 0
      updateVisibility()
    }

    searchInput?.addEventListener('input', applyFilter)
    prevBtn?.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage -= 1
        updateVisibility()
      }
    })
    nextBtn?.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
      if (currentPage < totalPages - 1) {
        currentPage += 1
        updateVisibility()
      }
    })

    updateVisibility()
  })

  const leaderDialog = document.getElementById('leader-dialog')
  const leaderRosterEl = document.getElementById('leadership-roster')

  if (leaderDialog instanceof HTMLDialogElement && leaderRosterEl?.textContent) {
    /** @type {Record<string, {
      name: string
      role_title: string
      chair_title: string | null
      company: string | null
      website: string | null
      linkedin_url: string | null
      bio: string | null
      photoUrl: string | null
    }>} */
    const leadersById = {}
    const roster = parseJsonScript(leaderRosterEl)
    if (Array.isArray(roster)) {
      roster.forEach((leader) => {
        if (leader?.id) leadersById[leader.id] = leader
      })
    }

    const photoEl = document.getElementById('leader-dialog-photo')
    const initialEl = document.getElementById('leader-dialog-initial')
    const nameEl = document.getElementById('leader-dialog-name')
    const roleEl = document.getElementById('leader-dialog-role')
    const chairEl = document.getElementById('leader-dialog-chair')
    const companyEl = document.getElementById('leader-dialog-company')
    const linksEl = document.getElementById('leader-dialog-links')
    const bioEl = document.getElementById('leader-dialog-bio')

    function setText(el, value, hiddenWhenEmpty = true) {
      if (!(el instanceof HTMLElement)) return
      const text = value?.trim() ?? ''
      el.textContent = text
      if (hiddenWhenEmpty) el.hidden = !text
    }

    function openLeaderProfile(leader) {
      if (!(nameEl instanceof HTMLElement) || !(roleEl instanceof HTMLElement)) return

      nameEl.textContent = leader.name
      roleEl.textContent = leader.role_title
      setText(chairEl, leader.chair_title)
      setText(companyEl, leader.company)

      if (photoEl instanceof HTMLImageElement && initialEl instanceof HTMLElement) {
        if (leader.photoUrl) {
          photoEl.src = leader.photoUrl
          photoEl.alt = leader.name
          photoEl.hidden = false
          initialEl.hidden = true
          initialEl.textContent = ''
        } else {
          photoEl.removeAttribute('src')
          photoEl.alt = ''
          photoEl.hidden = true
          initialEl.textContent = leader.name.trim().charAt(0).toUpperCase() || '?'
          initialEl.hidden = false
        }
      }

      if (linksEl instanceof HTMLElement) {
        linksEl.replaceChildren()
        const links = []
        if (leader.website) {
          const website = document.createElement('a')
          website.href = leader.website
          website.rel = 'noopener noreferrer'
          website.target = '_blank'
          website.textContent = 'Company website'
          links.push(website)
        }
        if (leader.linkedin_url) {
          const linkedin = document.createElement('a')
          linkedin.href = leader.linkedin_url
          linkedin.rel = 'noopener noreferrer'
          linkedin.target = '_blank'
          linkedin.textContent = 'LinkedIn'
          links.push(linkedin)
        }
        links.forEach((link) => linksEl.append(link))
        linksEl.hidden = links.length === 0
      }

      setText(bioEl, leader.bio)
      leaderDialog.showModal()
    }

    document.querySelectorAll('[data-leader-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-leader-id')
        if (!id || !leadersById[id]) return
        openLeaderProfile(leadersById[id])
      })
    })

    leaderDialog.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => leaderDialog.close())
    })

    leaderDialog.addEventListener('click', (event) => {
      const rect = leaderDialog.getBoundingClientRect()
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inDialog) leaderDialog.close()
    })
  }

  const memberDialog = document.getElementById('member-dialog')
  const memberDialogLoading = document.getElementById('member-dialog-loading')
  const memberDialogError = document.getElementById('member-dialog-error')
  const memberDialogBody = document.getElementById('member-dialog-body')

  if (memberDialog instanceof HTMLDialogElement) {
    const logoEl = document.getElementById('member-dialog-logo')
    const initialEl = document.getElementById('member-dialog-initial')
    const companyEl = document.getElementById('member-dialog-company')
    const typeEl = document.getElementById('member-dialog-type')
    const linksEl = document.getElementById('member-dialog-links')
    const descriptionEl = document.getElementById('member-dialog-description')
    const contactsEl = document.getElementById('member-dialog-contacts')
    const contactsListEl = document.getElementById('member-dialog-contacts-list')

    /** @type {Record<string, {
      company: string
      typeLabel: string
      description: string | null
      website: string | null
      phone: string | null
      logoUrl: string | null
      contacts: Array<{ name: string; email: string }>
    }>} */
    const memberProfileCache = {}
    let memberFetchToken = 0

    function setText(el, value, hiddenWhenEmpty = true) {
      if (!(el instanceof HTMLElement)) return
      const text = value?.trim() ?? ''
      el.textContent = text
      if (hiddenWhenEmpty) el.hidden = !text
    }

    function setMemberDialogState(state) {
      if (memberDialogLoading instanceof HTMLElement) {
        memberDialogLoading.hidden = state !== 'loading'
      }
      if (memberDialogError instanceof HTMLElement) {
        memberDialogError.hidden = state !== 'error'
      }
      if (memberDialogBody instanceof HTMLElement) {
        memberDialogBody.hidden = state !== 'ready'
      }
    }

    function renderMemberProfile(member) {
      if (!(companyEl instanceof HTMLElement) || !(typeEl instanceof HTMLElement)) return

      companyEl.textContent = member.company
      typeEl.textContent = member.typeLabel

      if (logoEl instanceof HTMLImageElement && initialEl instanceof HTMLElement) {
        if (member.logoUrl) {
          logoEl.src = member.logoUrl
          logoEl.alt = member.company
          logoEl.hidden = false
          initialEl.hidden = true
          initialEl.textContent = ''
        } else {
          logoEl.removeAttribute('src')
          logoEl.alt = ''
          logoEl.hidden = true
          initialEl.textContent = member.company.trim().charAt(0).toUpperCase() || '?'
          initialEl.hidden = false
        }
      }

      if (linksEl instanceof HTMLElement) {
        linksEl.replaceChildren()
        const links = []
        if (member.website) {
          const website = document.createElement('a')
          website.href = member.website
          website.rel = 'noopener noreferrer'
          website.target = '_blank'
          website.textContent = 'Website'
          links.push(website)
        }
        if (member.phone) {
          const phone = document.createElement('a')
          phone.href = `tel:${member.phone.replace(/\D/g, '')}`
          phone.textContent = member.phone
          links.push(phone)
        }
        links.forEach((link) => linksEl.append(link))
        linksEl.hidden = links.length === 0
      }

      setText(descriptionEl, member.description)

      if (contactsEl instanceof HTMLElement && contactsListEl instanceof HTMLUListElement) {
        contactsListEl.replaceChildren()
        const contacts = Array.isArray(member.contacts) ? member.contacts : []
        contacts.forEach((contact) => {
          if (!contact?.email) return
          const item = document.createElement('li')
          const name = document.createElement('span')
          name.className = 'member-dialog-contact-name'
          name.textContent = contact.name?.trim() || contact.email
          const email = document.createElement('a')
          email.className = 'member-dialog-contact-email'
          email.href = `mailto:${contact.email}`
          email.textContent = contact.email
          item.append(name, email)
          contactsListEl.append(item)
        })
        contactsEl.hidden = contacts.length === 0
      }

      setMemberDialogState('ready')
    }

    async function openMemberProfile(id) {
      if (!id) return

      memberDialog.showModal()
      setMemberDialogState('loading')

      if (memberProfileCache[id]) {
        renderMemberProfile(memberProfileCache[id])
        return
      }

      const token = ++memberFetchToken
      try {
        const response = await fetch(`/api/members/${encodeURIComponent(id)}`)
        if (!response.ok) throw new Error('fetch failed')
        const member = await response.json()
        if (!member?.id) throw new Error('invalid member')
        memberProfileCache[id] = member
        if (token !== memberFetchToken) return
        renderMemberProfile(member)
      } catch {
        if (token !== memberFetchToken) return
        setMemberDialogState('error')
      }
    }

    document.querySelectorAll('[data-member-id]').forEach((button) => {
      button.addEventListener('click', () => {
        openMemberProfile(button.getAttribute('data-member-id'))
      })
    })

    memberDialog.querySelectorAll('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', () => memberDialog.close())
    })

    memberDialog.addEventListener('click', (event) => {
      const rect = memberDialog.getBoundingClientRect()
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (!inDialog) memberDialog.close()
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
