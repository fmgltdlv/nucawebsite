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
})()
