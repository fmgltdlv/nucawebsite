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
