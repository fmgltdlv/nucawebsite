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
  const table = document.getElementById('member-table')
  const empty = document.getElementById('member-search-empty')

  if (search && table && empty) {
    const rows = table.querySelectorAll('tbody tr')

    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase()
      let visible = 0

      rows.forEach((row) => {
        const text = row.textContent?.toLowerCase() ?? ''
        const show = !q || text.includes(q)
        row.hidden = !show
        if (show) visible += 1
      })

      empty.hidden = visible > 0
    })
  }

  const joinForm = document.getElementById('join-form')
  const memberTypeSelect = document.getElementById('member_type')

  if (joinForm && memberTypeSelect) {
    const panels = joinForm.querySelectorAll('.join-type-panel')
    const detailsSection = document.getElementById('join-membership-details')
    const placeholder = document.getElementById('join-type-placeholder')

    function setPanelActive(panel, active) {
      panel.hidden = !active
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

      if (detailsSection) detailsSection.hidden = !type
      if (placeholder) placeholder.hidden = Boolean(type)

      syncRevenueRequired(type)
      syncInstitutionalRequired(type)
    }

    memberTypeSelect.addEventListener('change', updateJoinTypePanels)
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
})()
