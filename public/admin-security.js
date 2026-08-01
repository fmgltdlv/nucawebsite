;(function () {
  function csrfToken() {
    const shell = document.querySelector('.admin-shell')
    return shell instanceof HTMLElement ? shell.dataset.csrfToken ?? '' : ''
  }

  function shouldProtectAdminAction(action) {
    if (!action || !action.startsWith('/admin')) return false
    return action !== '/admin/login'
  }

  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      const action = form.getAttribute('action') ?? ''
      if (!shouldProtectAdminAction(action)) return
      if (form.querySelector('input[name="_csrf"]')) return

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = '_csrf'
      input.value = csrfToken()
      form.appendChild(input)
    },
    true,
  )

  const originalFetch = window.fetch.bind(window)
  window.fetch = function (input, init) {
    const nextInit = init ? { ...init } : {}
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    const method = (nextInit.method ?? 'GET').toUpperCase()

    if (method === 'POST' && url.includes('/admin/') && !url.includes('/admin/login')) {
      const headers = new Headers(nextInit.headers ?? {})
      if (!headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', csrfToken())
      }
      nextInit.headers = headers
    }

    return originalFetch(input, nextInit)
  }
})()
