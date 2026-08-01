;(function () {
  const EXTERNAL_DEFAULT = 'https://'

  /** @typedef {{ href: string, label: string, group: string }} InternalLink */

  /** @param {string} href */
  function isExternalHref(href) {
    return /^(https?:\/\/|mailto:|tel:)/i.test((href || '').trim())
  }

  /**
   * @param {InternalLink[]} links
   * @param {string} group
   */
  function linksForGroup(links, group) {
    return links.filter((link) => link.group === group)
  }

  /**
   * @param {InternalLink[]} links
   */
  function groupNames(links) {
    const groups = []
    for (const link of links) {
      if (!groups.includes(link.group)) groups.push(link.group)
    }
    return groups
  }

  /**
   * @param {HTMLSelectElement} select
   * @param {InternalLink[]} links
   * @param {boolean} allowEmpty
   * @param {string} [selectedHref]
   */
  function fillInternalSelect(select, links, allowEmpty, selectedHref = '') {
    select.replaceChildren()
    if (allowEmpty) {
      const empty = document.createElement('option')
      empty.value = ''
      empty.textContent = 'No link (label only)'
      select.append(empty)
    }
    for (const group of groupNames(links)) {
      const optgroup = document.createElement('optgroup')
      optgroup.label = group
      for (const link of linksForGroup(links, group)) {
        const option = document.createElement('option')
        option.value = link.href
        option.textContent = `${link.label} (${link.href})`
        optgroup.append(option)
      }
      select.append(optgroup)
    }
    const trimmed = (selectedHref || '').trim()
    if (trimmed && !isExternalHref(trimmed) && !links.some((link) => link.href === trimmed)) {
      const custom = document.createElement('option')
      custom.value = trimmed
      custom.textContent = `${trimmed} (custom path)`
      select.append(custom)
    }
  }

  /**
   * @param {InternalLink[]} links
   * @param {string} href
   */
  function resolveInternalHref(links, href) {
    const trimmed = (href || '').trim()
    if (!trimmed) return ''
    const match = links.find((link) => link.href === trimmed)
    return match ? match.href : trimmed
  }

  /**
   * @param {{
   *   value?: string,
   *   onChange?: (href: string) => void,
   *   internalLinks?: InternalLink[],
   *   allowEmpty?: boolean,
   *   inputName?: string,
   *   inputId?: string,
   *   inputClass?: string,
   *   output?: HTMLInputElement,
   * }} options
   */
  function createAdminLinkPicker(options) {
    const internalLinks = options.internalLinks || []
    const allowEmpty = options.allowEmpty === true
    const onChange = typeof options.onChange === 'function' ? options.onChange : () => {}

    const root = document.createElement('div')
    root.className = 'admin-link-picker'

    const modeWrap = document.createElement('div')
    modeWrap.className = 'admin-link-picker-mode'
    modeWrap.setAttribute('role', 'radiogroup')
    modeWrap.setAttribute('aria-label', 'Link type')

    const internalRadioId = `link-mode-internal-${Math.random().toString(36).slice(2, 9)}`
    const externalRadioId = `link-mode-external-${Math.random().toString(36).slice(2, 9)}`

    const internalLabel = document.createElement('label')
    internalLabel.className = 'admin-link-picker-mode-option'
    const internalRadio = document.createElement('input')
    internalRadio.type = 'radio'
    internalRadio.name = `link-mode-${internalRadioId}`
    internalRadio.id = internalRadioId
    internalRadio.value = 'internal'
    internalLabel.append(internalRadio, document.createTextNode(' Internal page'))

    const externalLabel = document.createElement('label')
    externalLabel.className = 'admin-link-picker-mode-option'
    const externalRadio = document.createElement('input')
    externalRadio.type = 'radio'
    externalRadio.name = `link-mode-${internalRadioId}`
    externalRadio.id = externalRadioId
    externalRadio.value = 'external'
    externalLabel.append(externalRadio, document.createTextNode(' External website'))

    modeWrap.append(internalLabel, externalLabel)

    const internalPanel = document.createElement('div')
    internalPanel.className = 'admin-link-picker-panel admin-link-picker-panel--internal'
    internalPanel.dataset.linkPickerInternal = '1'
    const internalSelect = document.createElement('select')
    internalSelect.className = options.inputClass || ''
    internalSelect.setAttribute('aria-label', 'Internal page')
    fillInternalSelect(internalSelect, internalLinks, allowEmpty, options.value || output.value)
    internalPanel.append(internalSelect)

    const externalPanel = document.createElement('div')
    externalPanel.className = 'admin-link-picker-panel admin-link-picker-panel--external'
    externalPanel.dataset.linkPickerExternal = '1'
    externalPanel.hidden = true
    const externalInput = document.createElement('input')
    externalInput.type = 'text'
    externalInput.className = options.inputClass || ''
    externalInput.placeholder = 'example.com'
    externalInput.setAttribute('aria-label', 'External website URL')
    externalInput.setAttribute('inputmode', 'url')
    externalPanel.append(externalInput)

    const output =
      options.output instanceof HTMLInputElement
        ? options.output
        : (() => {
            const input = document.createElement('input')
            input.type = 'hidden'
            if (options.inputName) input.name = options.inputName
            if (options.inputId) input.id = options.inputId
            input.dataset.linkPickerOutput = '1'
            return input
          })()

    if (!output.dataset.linkPickerOutput) {
      output.dataset.linkPickerOutput = '1'
    }

    root.append(modeWrap, internalPanel, externalPanel, output)

    function currentMode() {
      return externalRadio.checked ? 'external' : 'internal'
    }

    function emitChange() {
      const href = currentMode() === 'external' ? externalInput.value : internalSelect.value
      output.value = href
      onChange(href)
    }

    function applyMode(nextMode) {
      const isExternal = nextMode === 'external'
      internalRadio.checked = !isExternal
      externalRadio.checked = isExternal
      internalPanel.hidden = isExternal
      externalPanel.hidden = !isExternal
      internalSelect.disabled = isExternal
      externalInput.disabled = !isExternal
      if (isExternal) {
        if (!externalInput.value.trim() || !isExternalHref(externalInput.value)) {
          externalInput.value = EXTERNAL_DEFAULT
        }
      }
      emitChange()
    }

    function setValue(href) {
      const trimmed = (href || '').trim()
      output.value = trimmed
      if (!trimmed && allowEmpty) {
        internalRadio.checked = true
        externalRadio.checked = false
        internalPanel.hidden = false
        externalPanel.hidden = true
        internalSelect.disabled = false
        externalInput.disabled = true
        internalSelect.value = ''
        externalInput.value = EXTERNAL_DEFAULT
        return
      }
      if (isExternalHref(trimmed)) {
        internalRadio.checked = false
        externalRadio.checked = true
        internalPanel.hidden = true
        externalPanel.hidden = false
        internalSelect.disabled = true
        externalInput.disabled = false
        externalInput.value = trimmed
        return
      }
      internalRadio.checked = true
      externalRadio.checked = false
      internalPanel.hidden = false
      externalPanel.hidden = true
      internalSelect.disabled = false
      externalInput.disabled = true
      fillInternalSelect(internalSelect, internalLinks, allowEmpty, trimmed)
      internalSelect.value = resolveInternalHref(internalLinks, trimmed)
      externalInput.value = EXTERNAL_DEFAULT
    }

    internalRadio.addEventListener('change', () => {
      if (internalRadio.checked) applyMode('internal')
    })
    externalRadio.addEventListener('change', () => {
      if (externalRadio.checked) applyMode('external')
    })
    internalSelect.addEventListener('change', emitChange)
    externalInput.addEventListener('input', emitChange)

    setValue(options.value || output.value || (allowEmpty ? '' : internalLinks[0]?.href || '/'))

    return root
  }

  function initAdminLinkPickers() {
    document.querySelectorAll('[data-admin-link-picker]').forEach((root) => {
      if (!(root instanceof HTMLElement)) return
      if (root.dataset.linkPickerWired === '1') return
      root.dataset.linkPickerWired = '1'

      const output = root.querySelector('[data-link-picker-output]')
      if (!(output instanceof HTMLInputElement)) return

      /** @type {InternalLink[]} */
      let internalLinks = []
      try {
        internalLinks = JSON.parse(root.dataset.internalLinks || '[]')
      } catch {
        internalLinks = []
      }

      const picker = createAdminLinkPicker({
        value: output.value,
        internalLinks,
        allowEmpty: root.dataset.allowEmpty === '1',
        inputName: output.name || undefined,
        inputId: output.id || undefined,
        inputClass: output.className || undefined,
        output,
        onChange: (href) => {
          output.value = href
        },
      })

      root.replaceChildren(...picker.childNodes)
    })
  }

  window.AdminLinkPicker = {
    create: createAdminLinkPicker,
    init: initAdminLinkPickers,
    isExternalHref,
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminLinkPickers)
  } else {
    initAdminLinkPickers()
  }
})()
