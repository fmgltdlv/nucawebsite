(function () {
  const adminShell = document.querySelector('.admin-shell')
  if (!adminShell) return

  /** @type {AbortController | null} */
  let abortController = null
  let navigating = false

  function normalizePath(href) {
    try {
      return new URL(href, window.location.origin).pathname
    } catch {
      return null
    }
  }

  function shouldInterceptLink(link, event) {
    if (!(link instanceof HTMLAnchorElement)) return false
    if (link.classList.contains('admin-nav-external')) return false
    if (link.target === '_blank' || link.hasAttribute('download')) return false
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false

    const href = link.getAttribute('href')
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false
    }

    const path = normalizePath(href)
    if (!path || !path.startsWith('/admin')) return false
    if (path.startsWith('/admin/api')) return false
    return true
  }

  function navActiveHref(pathname) {
    const links = adminShell.querySelectorAll('.admin-nav a[href^="/admin"]')
    /** @type {string | null} */
    let best = null
    let bestLen = -1

    links.forEach((link) => {
      const href = link.getAttribute('href')
      if (!href) return

      if (href === '/admin') {
        if (pathname === '/admin' && 5 > bestLen) {
          best = href
          bestLen = 5
        }
        return
      }

      if (pathname === href || pathname.startsWith(`${href}/`)) {
        if (href.length > bestLen) {
          best = href
          bestLen = href.length
        }
      }
    })

    return best
  }

  function updateSidebarActive(pathname) {
    const active = navActiveHref(pathname)
    adminShell.querySelectorAll('.admin-nav a[href^="/admin"]').forEach((link) => {
      link.classList.toggle('admin-nav-active', link.getAttribute('href') === active)
    })
  }

  function loadStylesheet(href) {
    const base = href.split('?')[0]
    // Only match stylesheets in <head> — link tags copied via innerHTML are inert until promoted.
    if (
      document.head.querySelector(
        `link[rel="stylesheet"][href="${href}"], link[rel="stylesheet"][href^="${base}"]`,
      )
    ) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Could not load stylesheet: ${href}`))
      document.head.appendChild(link)
    })
  }

  function loadScript(src) {
    const base = src.split('?')[0]
    // Only match scripts in <body> — script tags copied via innerHTML do not execute.
    if (document.body.querySelector(`script[src^="${base}"]`)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Could not load script: ${src}`))
      document.body.appendChild(script)
    })
  }

  async function activatePageScripts(container) {
    const links = container.querySelectorAll('link[rel="stylesheet"]')
    for (const link of links) {
      const href = link.getAttribute('href')
      if (href) {
        try {
          await loadStylesheet(href)
        } catch {
          // Optional styles (e.g. Leaflet) — page still works without them.
        }
      }
    }

    const scripts = Array.from(container.querySelectorAll('script'))
    for (const oldScript of scripts) {
      const src = oldScript.getAttribute('src')
      if (src) {
        try {
          await loadScript(src)
        } catch {
          // Fall back to full navigation if a required script fails.
        }
      }
      oldScript.remove()
    }

    if (typeof window.initEventLocationPicker === 'function') {
      window.initEventLocationPicker()
    }
    if (typeof window.initPageBlocksEditor === 'function') {
      window.initPageBlocksEditor()
    }
    if (typeof window.initPagePreviewMode === 'function') {
      window.initPagePreviewMode()
    }
  }

  async function navigateTo(href, { push = true, scroll = true } = {}) {
    const url = new URL(href, window.location.origin)
    const path = url.pathname
    const fullHref = `${path}${url.search}`

    if (fullHref === `${window.location.pathname}${window.location.search}`) return

    const main = adminShell.querySelector('.admin-main')
    if (!(main instanceof HTMLElement)) {
      window.location.href = href
      return
    }

    if (abortController) abortController.abort()
    abortController = new AbortController()
    const { signal } = abortController

    navigating = true
    main.classList.add('is-loading')
    main.setAttribute('aria-busy', 'true')

    try {
      const response = await fetch(fullHref, {
        signal,
        headers: { Accept: 'text/html' },
        credentials: 'same-origin',
      })

      if (!response.ok) throw new Error('Failed to load admin page')

      const html = await response.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const newMain = doc.querySelector('.admin-main')

      if (!newMain) {
        window.location.href = href
        return
      }

      main.innerHTML = newMain.innerHTML
      document.title = doc.title
      updateSidebarActive(path)

      await activatePageScripts(main)

      if (typeof window.initAdminPageContent === 'function') {
        window.initAdminPageContent(main)
      }

      if (push) {
        window.history.pushState({ adminNav: true }, '', fullHref)
      }

      if (scroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }

      const heading = main.querySelector('.admin-main-header h1, h1')
      if (heading instanceof HTMLElement) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      window.location.href = href
    } finally {
      navigating = false
      main.classList.remove('is-loading')
      main.removeAttribute('aria-busy')
      abortController = null
    }
  }

  adminShell.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null
    if (!link || !shouldInterceptLink(link, event)) return
    event.preventDefault()
    if (navigating) return
    void navigateTo(link.href)
  })

  window.addEventListener('popstate', () => {
    if (navigating) return
    void navigateTo(window.location.href, { push: false, scroll: false })
  })

  window.history.replaceState({ adminNav: true }, '', window.location.href)
})()
