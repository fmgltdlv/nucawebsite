(function () {
  const PREVIEW_MODE_KEY = 'page-preview-mode'

  window.initPagePreviewMode = function initPagePreviewMode() {
    const toggle = document.querySelector('[data-preview-mode-toggle]')
    const viewport = document.querySelector('[data-preview-viewport]')
    if (!(toggle instanceof HTMLElement) || !(viewport instanceof HTMLElement)) return
    if (toggle.dataset.previewModeWired === '1') return
    toggle.dataset.previewModeWired = '1'

    /** @param {'desktop' | 'mobile'} mode */
    function applyMode(mode) {
      const isMobile = mode === 'mobile'
      viewport.classList.toggle('page-edit-preview-viewport--mobile', isMobile)
      viewport.classList.toggle('page-edit-preview-viewport--desktop', !isMobile)
      toggle.querySelectorAll('[data-preview-mode]').forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return
        const active = button.dataset.previewMode === mode
        button.classList.toggle('is-active', active)
        button.setAttribute('aria-pressed', active ? 'true' : 'false')
      })
      try {
        sessionStorage.setItem(PREVIEW_MODE_KEY, mode)
      } catch {
        // Ignore storage errors in private browsing.
      }
    }

    toggle.addEventListener('click', (event) => {
      const button =
        event.target instanceof Element ? event.target.closest('[data-preview-mode]') : null
      if (!(button instanceof HTMLButtonElement)) return
      const mode = button.dataset.previewMode
      if (mode === 'mobile' || mode === 'desktop') applyMode(mode)
    })

    let saved = 'desktop'
    try {
      const stored = sessionStorage.getItem(PREVIEW_MODE_KEY)
      if (stored === 'mobile' || stored === 'desktop') saved = stored
    } catch {
      // Ignore storage errors in private browsing.
    }
    applyMode(saved)
  }

  window.initPageBlocksEditor = function initPageBlocksEditor() {
  const root = document.getElementById('page-blocks-editor')
  const hiddenInput = document.getElementById('body_json')
  const previewFrame = document.getElementById('page-live-preview')
  const titleInput = document.getElementById('title')
  const metaInput = document.getElementById('meta_description')
  const form = hiddenInput instanceof HTMLInputElement ? hiddenInput.closest('form') : null
  const previewDraftUrl =
    form instanceof HTMLFormElement ? form.dataset.previewDraftUrl || '' : ''

  if (!(root instanceof HTMLElement) || !(hiddenInput instanceof HTMLInputElement)) return
  if (root.dataset.pageBlocksWired === '1') return
  root.dataset.pageBlocksWired = '1'

  /** @typedef {'left' | 'center' | 'right'} TextAlign */
  /** @typedef {'default' | 'muted' | 'accent' | 'primary'} BlockColor */
  /** @typedef {'body' | 'display' | 'serif' | 'fraunces' | 'condensed' | 'bebas' | 'oswald' | 'outfit' | 'inter'} BlockFont */
  /** @typedef {'none' | 'muted' | 'accent-soft' | 'accent' | 'primary' | 'surface'} SectionBackground */

  /** @typedef {{ type: 'heading', text: string, level: 2 | 3 | 4, align: TextAlign, color?: BlockColor, font?: BlockFont }} HeadingBlock */
  /** @typedef {{ type: 'text', body: string, align?: TextAlign, color?: BlockColor, font?: BlockFont }} TextBlock */
  /** @typedef {{ type: 'list', ordered: boolean, items: string[] }} ListBlock */
  /** @typedef {{ type: 'callout', title?: string, body: string, style: 'default' | 'muted' | 'accent' }} CalloutBlock */
  /** @typedef {{ type: 'section', title?: string, muted?: boolean, background?: SectionBackground, blocks: PageBlock[] }} SectionBlock */
  /** @typedef {{ type: 'calendar', title?: string, view: 'list' | 'week' | 'month', committee_keys: string[] }} CalendarBlock */
  /** @typedef {{ type: 'hero', eyebrow: string, title: string, lead: string, cta_primary_label: string, cta_primary_href: string, cta_secondary_label: string, cta_secondary_href: string }} HeroBlock */
  /** @typedef {{ type: 'events_feed', title: string, lead: string, limit: number }} EventsFeedBlock */
  /** @typedef {{ type: 'dirt_feed', title: string, lead: string, limit: number }} DirtFeedBlock */
  /** @typedef {{ type: 'button', label: string, href: string, style: 'primary' | 'secondary', align?: TextAlign, new_tab?: boolean }} ButtonBlock */
  /** @typedef {{ type: 'image', asset_key: string, alt?: string, caption?: string, layout: 'inline' | 'section' | 'background', align?: TextAlign, width?: 'auto' | 'small' | 'medium' | 'large' | 'full', height?: 'auto' | 'small' | 'medium' | 'large' | 'viewport', scroll?: 'normal' | 'fixed' }} ImageBlock */
  /** @typedef {HeadingBlock | TextBlock | ListBlock | CalloutBlock | SectionBlock | CalendarBlock | HeroBlock | EventsFeedBlock | DirtFeedBlock | ButtonBlock | ImageBlock} PageBlock */

  /** @type {PageBlock[]} */
  let blocks = []
  let previewTimer = 0
  let previewRequestId = 0
  /** @type {string | null} */
  let activeBlockIndex = null
  /** @type {Set<string>} */
  const collapsedBlocks = new Set()
  const pageSlug = root.dataset.pageSlug || ''
  const isHomePage = pageSlug === 'home'

  const BLOCK_TYPE_LABELS = {
    heading: 'Heading',
    text: 'Paragraph',
    list: 'List',
    callout: 'Callout box',
    section: 'Section',
    calendar: 'Events calendar',
    hero: 'Hero banner',
    events_feed: 'Events list',
    dirt_feed: 'THE DIRT feed',
    button: 'Button link',
    image: 'Image',
  }

  function blockTypeLabel(type) {
    return BLOCK_TYPE_LABELS[type] || type
  }

  function truncate(text, max = 72) {
    const trimmed = text.replace(/\s+/g, ' ').trim()
    if (!trimmed) return 'Empty'
    return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
  }

  /** @param {PageBlock} block */
  function blockSummary(block) {
    switch (block.type) {
      case 'heading':
        return truncate(block.text)
      case 'text':
        return truncate(block.body)
      case 'list':
        return block.items.length === 1
          ? truncate(block.items[0])
          : `List · ${block.items.length} items`
      case 'callout':
        return truncate(block.title || block.body)
      case 'section':
        return block.title
          ? truncate(block.title)
          : `Section · ${block.blocks.length} block${block.blocks.length === 1 ? '' : 's'}`
      case 'calendar':
        return truncate(block.title || 'Events calendar')
      case 'hero':
        return truncate(block.title || block.eyebrow)
      case 'events_feed':
        return truncate(block.title || 'Events list')
      case 'dirt_feed':
        return truncate(block.title || 'THE DIRT feed')
      case 'button':
        return truncate(block.label || 'Button')
      case 'image':
        return block.asset_key ? truncate(block.alt || block.caption || block.asset_key) : 'No image selected'
      default:
        return blockTypeLabel(block.type)
    }
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function initCollapsedState() {
    collapsedBlocks.clear()
    blocks.forEach((block, index) => {
      collapsedBlocks.add(String(index))
      if (block.type === 'section') {
        block.blocks.forEach((_, childIndex) => {
          collapsedBlocks.add(`${index}-${childIndex}`)
        })
      }
    })
  }

  /** @param {string} index */
  function toggleCollapse(index) {
    if (collapsedBlocks.has(index)) {
      collapsedBlocks.delete(index)
      activeBlockIndex = index
    } else {
      collapsedBlocks.add(index)
      if (activeBlockIndex === index) activeBlockIndex = null
    }
    updateSelectionUi()
  }

  /**
   * @param {string} index
   * @param {{ expand?: boolean, scrollEditor?: boolean, scrollPreview?: boolean }} [options]
   */
  function selectBlock(index, options = {}) {
    activeBlockIndex = index
    if (options.expand) {
      collapsedBlocks.delete(index)
      const parentIndex = index.includes('-') ? index.split('-')[0] : null
      if (parentIndex) collapsedBlocks.delete(parentIndex)
    }
    updateSelectionUi()
    if (options.scrollEditor) {
      const card = root.querySelector(`[data-block-index="${index}"]`)
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    if (options.scrollPreview !== false) highlightPreviewBlock(index)
  }

  function updateSelectionUi() {
    root.querySelectorAll('[data-block-index]').forEach((card) => {
      if (!(card instanceof HTMLElement)) return
      const index = card.getAttribute('data-block-index')
      if (!index) return
      card.classList.toggle('page-block-card--active', index === activeBlockIndex)
      card.classList.toggle('is-collapsed', collapsedBlocks.has(index))
      const toggle = card.querySelector('[data-collapse-toggle]')
      if (toggle instanceof HTMLButtonElement) {
        const collapsed = collapsedBlocks.has(index)
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
        toggle.setAttribute('aria-label', collapsed ? 'Expand block' : 'Collapse block')
        toggle.textContent = collapsed ? '▸' : '▾'
      }
    })
    if (activeBlockIndex) highlightPreviewBlock(activeBlockIndex)
  }

  /** @param {string | null} index */
  function highlightPreviewBlock(index) {
    if (!(previewFrame instanceof HTMLIFrameElement)) return
    const doc = previewFrame.contentDocument
    if (!doc) return
    doc.querySelectorAll('[data-cms-block-index]').forEach((element) => {
      element.classList.toggle(
        'cms-preview-block--active',
        element.getAttribute('data-cms-block-index') === index,
      )
    })
    if (!index) return
    const active = doc.querySelector(`[data-cms-block-index="${index}"]`)
    active?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function injectPreviewStyles(doc) {
    if (doc.getElementById('cms-preview-block-styles')) return
    const style = doc.createElement('style')
    style.id = 'cms-preview-block-styles'
    style.textContent = `
      .cms-preview-block { cursor: pointer; transition: outline-color 0.15s ease, box-shadow 0.15s ease; }
      .cms-preview-block:hover { outline: 2px dashed rgba(37, 99, 235, 0.55); outline-offset: 3px; }
      .cms-preview-block--active { outline: 3px solid #2563eb; outline-offset: 3px; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15); }
    `
    doc.head.append(style)
  }

  function wirePreviewFrame() {
    if (!(previewFrame instanceof HTMLIFrameElement)) return
    const doc = previewFrame.contentDocument
    if (!doc?.body) return
    injectPreviewStyles(doc)
    if (doc.body.dataset.cmsPreviewWired === '1') return
    doc.body.dataset.cmsPreviewWired = '1'
    doc.addEventListener(
      'click',
      (event) => {
        const target =
          event.target instanceof Element ? event.target.closest('[data-cms-block-index]') : null
        if (!(target instanceof HTMLElement)) return
        event.preventDefault()
        event.stopPropagation()
        const index = target.getAttribute('data-cms-block-index')
        if (!index) return
        selectBlock(index, { expand: true, scrollEditor: true, scrollPreview: false })
      },
      true,
    )
  }

  /**
   * @param {string} index
   * @param {PageBlock} block
   * @param {PageBlock[]} list
   * @param {boolean} [includeActions]
   */
  function renderBlockHeader(index, block, list, includeActions = true) {
    const header = document.createElement('div')
    header.className = 'page-block-card-header'

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'page-block-collapse-toggle'
    toggle.dataset.collapseToggle = '1'
    toggle.setAttribute('aria-expanded', collapsedBlocks.has(index) ? 'false' : 'true')
    toggle.setAttribute('aria-label', collapsedBlocks.has(index) ? 'Expand block' : 'Collapse block')
    toggle.textContent = collapsedBlocks.has(index) ? '▸' : '▾'
    toggle.addEventListener('click', (event) => {
      event.stopPropagation()
      toggleCollapse(index)
    })

    const summary = document.createElement('button')
    summary.type = 'button'
    summary.className = 'page-block-card-summary'
    summary.innerHTML = `<span class="page-block-card-type">${escapeHtml(blockTypeLabel(block.type))}</span><span class="page-block-card-preview">${escapeHtml(blockSummary(block))}</span>`
    summary.addEventListener('click', () => {
      selectBlock(index, { expand: true, scrollPreview: true })
    })

    header.append(toggle, summary)
    if (includeActions) header.append(renderActions(index, list))
    return header
  }

  /** @type {{ key: string, name: string }[]} */
  let committees = []
  try {
    committees = JSON.parse(root.dataset.committees || '[]')
  } catch {
    committees = []
  }

  const COLOR_OPTIONS = [
    ['default', 'Default'],
    ['muted', 'Muted'],
    ['accent', 'Accent'],
    ['primary', 'Primary'],
  ]

  const FONT_OPTIONS = [
    ['body', 'Body (default)'],
    ['display', 'Display (theme)'],
    ['serif', 'Source Serif'],
    ['fraunces', 'Fraunces'],
    ['condensed', 'Barlow Condensed'],
    ['bebas', 'Bebas Neue'],
    ['oswald', 'Oswald'],
    ['outfit', 'Outfit'],
    ['inter', 'Inter'],
  ]

  const SECTION_BG_OPTIONS = [
    ['none', 'None'],
    ['muted', 'Muted gray'],
    ['surface', 'White card'],
    ['accent-soft', 'Accent soft'],
    ['accent', 'Accent bold'],
    ['primary', 'Primary blue'],
  ]

  function parseInitial() {
    const raw = root.dataset.initial || '[]'
    try {
      const parsed = JSON.parse(raw)
      blocks = Array.isArray(parsed) ? parsed : []
    } catch {
      blocks = []
    }
  }

  function sectionBackground(block) {
    if (block.background) return block.background
    return block.muted === true ? 'muted' : 'none'
  }

  function syncHidden() {
    hiddenInput.value = JSON.stringify(blocks)
    schedulePreview()
  }

  function schedulePreview() {
    if (!(previewFrame instanceof HTMLIFrameElement) || !previewDraftUrl) return
    window.clearTimeout(previewTimer)
    previewTimer = window.setTimeout(updatePreview, 450)
  }

  async function updatePreview() {
    if (!(previewFrame instanceof HTMLIFrameElement) || !previewDraftUrl) return

    const requestId = ++previewRequestId
    const title = titleInput instanceof HTMLInputElement ? titleInput.value : ''
    const meta_description = metaInput instanceof HTMLInputElement ? metaInput.value : ''

    try {
      const response = await fetch(previewDraftUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title,
          meta_description,
          body_json: hiddenInput.value,
        }),
      })

      if (!response.ok || requestId !== previewRequestId) return
      const html = await response.text()
      if (requestId !== previewRequestId) return
      previewFrame.srcdoc = html
      wirePreviewFrame()
      if (activeBlockIndex) highlightPreviewBlock(activeBlockIndex)
    } catch {
      // Ignore transient preview errors while typing.
    }
  }

  function defaultBlock(type) {
    switch (type) {
      case 'heading':
        return { type: 'heading', text: 'Section heading', level: 2, align: 'left' }
      case 'text':
        return { type: 'text', body: '', align: 'left' }
      case 'list':
        return { type: 'list', ordered: false, items: ['List item'] }
      case 'callout':
        return { type: 'callout', title: 'Callout title', body: '', style: 'default' }
      case 'section':
        return {
          type: 'section',
          title: 'Section',
          background: 'none',
          muted: false,
          blocks: [{ type: 'text', body: '' }],
        }
      case 'calendar':
        return {
          type: 'calendar',
          title: 'Upcoming events',
          view: 'month',
          committee_keys: [],
        }
      case 'hero':
        return {
          type: 'hero',
          eyebrow: 'National Utility Contractors Association',
          title: 'Page headline',
          lead: 'Short introduction for the home page.',
          cta_primary_label: 'Primary button',
          cta_primary_href: '/join',
          cta_secondary_label: 'Secondary button',
          cta_secondary_href: '/members',
        }
      case 'events_feed':
        return {
          type: 'events_feed',
          title: 'Calendar events',
          lead: 'Upcoming chapter meetings and gatherings.',
          limit: 3,
        }
      case 'dirt_feed':
        return {
          type: 'dirt_feed',
          title: 'THE DIRT',
          lead: 'News, policy, and chapter announcements.',
          limit: 3,
        }
      case 'button':
        return {
          type: 'button',
          label: 'Learn more',
          href: '/',
          style: 'primary',
          align: 'left',
        }
      case 'image':
        return {
          type: 'image',
          asset_key: '',
          alt: '',
          caption: '',
          layout: 'inline',
          align: 'center',
          width: 'large',
        }
      default:
        return { type: 'text', body: '' }
    }
  }

  function moveBlock(index, direction) {
    const next = index + direction
    if (next < 0 || next >= blocks.length) return
    const copy = blocks.slice()
    const [item] = copy.splice(index, 1)
    copy.splice(next, 0, item)
    blocks = copy
    render()
  }

  function deleteBlock(index) {
    blocks = blocks.filter((_, i) => i !== index)
    render()
  }

  /** @param {PageBlock} current @param {PageBlock | ((block: PageBlock) => PageBlock)} nextOrUpdater */
  function resolveBlockUpdate(current, nextOrUpdater) {
    return typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater
  }

  /** @param {number} index @param {PageBlock | ((block: PageBlock) => PageBlock)} nextOrUpdater */
  function updateBlock(index, nextOrUpdater) {
    const current = blocks[index]
    if (!current) return
    const next = resolveBlockUpdate(current, nextOrUpdater)
    blocks = blocks.map((block, i) => (i === index ? next : block))
    syncHidden()
  }

  function renderToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'page-blocks-toolbar'
    const blockTypes = isHomePage
      ? [
          ['hero', 'Hero banner'],
          ['events_feed', 'Events list'],
          ['dirt_feed', 'THE DIRT feed'],
        ]
      : [
          ['heading', 'Heading'],
          ['text', 'Paragraph'],
          ['list', 'List'],
          ['callout', 'Callout box'],
          ['section', 'Section'],
          ['calendar', 'Events calendar'],
          ['button', 'Button link'],
          ['image', 'Image'],
        ]
    blockTypes.forEach(([type, label]) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn btn-secondary btn-sm'
      btn.textContent = `+ ${label}`
      btn.addEventListener('click', () => {
        const newIndex = blocks.length
        blocks = [...blocks, defaultBlock(type)]
        activeBlockIndex = String(newIndex)
        collapsedBlocks.delete(String(newIndex))
        render()
      })
      toolbar.append(btn)
    })

    if (blocks.length > 0) {
      const listControls = document.createElement('div')
      listControls.className = 'page-blocks-list-controls'

      const expandAll = document.createElement('button')
      expandAll.type = 'button'
      expandAll.className = 'btn btn-secondary btn-sm'
      expandAll.textContent = 'Expand all'
      expandAll.addEventListener('click', () => {
        collapsedBlocks.clear()
        updateSelectionUi()
      })

      const collapseAll = document.createElement('button')
      collapseAll.type = 'button'
      collapseAll.className = 'btn btn-secondary btn-sm'
      collapseAll.textContent = 'Collapse all'
      collapseAll.addEventListener('click', () => {
        initCollapsedState()
        activeBlockIndex = null
        updateSelectionUi()
      })

      listControls.append(expandAll, collapseAll)
      toolbar.append(listControls)
    }

    return toolbar
  }

  function renderActions(index, list) {
    const actions = document.createElement('div')
    actions.className = 'page-block-actions'

    const up = document.createElement('button')
    up.type = 'button'
    up.className = 'btn btn-secondary btn-sm'
    up.textContent = '↑'
    up.disabled = index === 0
    up.addEventListener('click', () => moveBlock(index, -1))

    const down = document.createElement('button')
    down.type = 'button'
    down.className = 'btn btn-secondary btn-sm'
    down.textContent = '↓'
    down.disabled = index === list.length - 1
    down.addEventListener('click', () => moveBlock(index, 1))

    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'btn btn-secondary btn-sm'
    del.textContent = 'Remove'
    del.addEventListener('click', () => deleteBlock(index))

    actions.append(up, down, del)
    return actions
  }

  function selectField(options, value, onChange) {
    const select = document.createElement('select')
    select.className = 'page-block-select'
    options.forEach(([val, label]) => {
      const option = document.createElement('option')
      option.value = val
      option.textContent = label
      if (value === val) option.selected = true
      select.append(option)
    })
    select.addEventListener('change', () => onChange(select.value))
    return select
  }

  function alignSelect(value, onChange) {
    return selectField(
      [
        ['left', 'Left'],
        ['center', 'Center'],
        ['right', 'Right'],
      ],
      value,
      onChange,
    )
  }

  function colorSelect(value, onChange) {
    return selectField(COLOR_OPTIONS, value || 'default', (color) =>
      onChange(color === 'default' ? undefined : color),
    )
  }

  function fontSelect(value, onChange) {
    return selectField(FONT_OPTIONS, value || 'body', (font) =>
      onChange(font === 'body' ? undefined : font),
    )
  }

  function sectionBackgroundSelect(value, onChange) {
    return selectField(SECTION_BG_OPTIONS, value || 'none', onChange)
  }

  function field(labelText, control) {
    const wrap = document.createElement('div')
    wrap.className = 'page-block-field'
    const label = document.createElement('label')
    label.textContent = labelText
    wrap.append(label, control)
    return wrap
  }

  function checkboxField(labelText, checked, onChange) {
    const wrap = document.createElement('label')
    wrap.className = 'admin-check page-block-check'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = checked
    input.addEventListener('change', () => onChange(input.checked))
    wrap.append(input, document.createTextNode(` ${labelText}`))
    return field('', wrap)
  }

  /**
   * @param {ImageBlock} block
   * @param {string} indexKey
   * @param {(next: ImageBlock) => void} onChange
   * @param {{ nested?: boolean }} [options]
   */
  function renderImageAssetField(block, indexKey, onChange, options = {}) {
    const wrap = document.createElement('div')
    wrap.className = 'page-block-field'

    const label = document.createElement('label')
    label.textContent = 'Image'
    wrap.append(label)

    const picker = document.createElement('div')
    picker.className = 'admin-asset-picker-field'
    picker.setAttribute('data-asset-picker')
    picker.setAttribute('data-asset-kind', 'image')

    const assetKey = block.asset_key || ''
    const assetUrl = assetKey ? `/assets/${assetKey}` : ''

    const preview = document.createElement('div')
    preview.className = 'admin-asset-picker-preview'
    preview.setAttribute('data-asset-picker-preview')
    if (!assetUrl) preview.hidden = true
    if (assetUrl) {
      const img = document.createElement('img')
      img.src = assetUrl
      img.alt = ''
      img.className = 'admin-modal-logo-preview'
      img.setAttribute('data-asset-picker-preview-image')
      img.loading = 'lazy'
      img.decoding = 'async'
      preview.append(img)
    }

    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    hiddenInput.value = assetKey
    hiddenInput.setAttribute('data-asset-picker-value')
    hiddenInput.dataset.blockAssetIndex = indexKey

    const actions = document.createElement('div')
    actions.className = 'admin-asset-picker-actions'

    const openBtn = document.createElement('button')
    openBtn.type = 'button'
    openBtn.className = 'btn btn-secondary btn-sm'
    openBtn.setAttribute('data-asset-picker-open')
    openBtn.textContent = 'Choose from library'

    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'btn btn-secondary btn-sm'
    clearBtn.setAttribute('data-asset-picker-clear')
    clearBtn.textContent = 'Clear'
    clearBtn.hidden = !assetKey

    actions.append(openBtn, clearBtn)
    picker.append(preview, hiddenInput, actions)
    wrap.append(picker)

    function syncFromPicker() {
      const nextKey = hiddenInput.value
      if (nextKey === block.asset_key) return
      onChange({ ...block, asset_key: nextKey })
    }

    hiddenInput.addEventListener('change', syncFromPicker)
    clearBtn.addEventListener('click', () => {
      window.setTimeout(syncFromPicker, 0)
    })

    return wrap
  }

  /**
   * @param {ButtonBlock} block
   * @param {(next: ButtonBlock) => void} onChange
   * @param {(next: ButtonBlock) => void} [onSummary]
   */
  function renderButtonFields(block, onChange, onSummary) {
    const fields = [
      field(
        'Button label',
        textInput(block.label, (label) => {
          const next = { ...block, label }
          onChange(next)
          onSummary?.(next)
        }),
      ),
      field(
        'Link URL',
        textInput(block.href, (href) => onChange({ ...block, href }), '/about or https://…'),
      ),
      field(
        'Style',
        selectField(
          [
            ['primary', 'Primary (filled)'],
            ['secondary', 'Secondary (outline)'],
          ],
          block.style,
          (style) => onChange({ ...block, style }),
        ),
      ),
      field(
        'Alignment',
        alignSelect(block.align || 'left', (align) => onChange({ ...block, align })),
      ),
      checkboxField('Open in new tab (external links)', block.new_tab === true, (new_tab) =>
        onChange({ ...block, new_tab }),
      ),
    ]

    const hint = document.createElement('p')
    hint.className = 'form-hint'
    hint.textContent =
      'Use paths like /join for internal pages, or full URLs like https://example.com for external sites.'
    fields.push(hint)

    return fields
  }

  /**
   * @param {ImageBlock} block
   * @param {string} indexKey
   * @param {(next: ImageBlock) => void} onChange
   * @param {(next: ImageBlock) => void} [onSummary]
   * @param {{ nested?: boolean }} [options]
   */
  function renderImageFields(block, indexKey, onChange, onSummary, options = {}) {
    const nested = options.nested === true
    const fields = [renderImageAssetField(block, indexKey, onChange, options)]

    fields.push(
      field('Alt text', textInput(block.alt || '', (alt) => onChange({ ...block, alt }))),
      field('Caption (optional)', textInput(block.caption || '', (caption) => onChange({ ...block, caption }))),
    )

    if (!nested) {
      fields.push(
        field(
          'Display mode',
          selectField(
            [
              ['inline', 'Inline with content'],
              ['section', 'Full-width section (scrolls with page)'],
              ['background', 'Background section'],
            ],
            block.layout,
            (layout) => {
              const next = { ...block, layout }
              if (layout === 'inline') {
                next.width = block.width || 'large'
                next.height = undefined
                next.scroll = undefined
              } else if (layout === 'section') {
                next.width = undefined
                next.height = block.height || 'auto'
                next.scroll = undefined
              } else {
                next.width = undefined
                next.height = block.height || 'medium'
                next.scroll = block.scroll || 'normal'
              }
              onChange(next)
              onSummary?.(next)
              render()
            },
          ),
        ),
      )
    }

    const layout = nested ? 'inline' : block.layout

    if (layout === 'inline') {
      fields.push(
        field(
          'Alignment',
          alignSelect(block.align || 'center', (align) => onChange({ ...block, align })),
        ),
        field(
          'Width',
          selectField(
            [
              ['small', 'Small (~200px)'],
              ['medium', 'Medium (~400px)'],
              ['large', 'Large (~600px)'],
              ['full', 'Full width'],
            ],
            block.width || 'large',
            (width) => onChange({ ...block, width }),
          ),
        ),
      )
    } else if (layout === 'section') {
      fields.push(
        field(
          'Section height',
          selectField(
            [
              ['auto', 'Natural image height'],
              ['small', 'Short (12rem)'],
              ['medium', 'Medium (20rem)'],
              ['large', 'Tall (32rem)'],
              ['viewport', 'Viewport (60vh)'],
            ],
            block.height || 'auto',
            (height) => onChange({ ...block, height }),
          ),
        ),
      )
    } else if (layout === 'background') {
      fields.push(
        field(
          'Section height',
          selectField(
            [
              ['small', 'Short (12rem)'],
              ['medium', 'Medium (20rem)'],
              ['large', 'Tall (32rem)'],
              ['viewport', 'Viewport (60vh)'],
            ],
            block.height || 'medium',
            (height) => onChange({ ...block, height }),
          ),
        ),
        field(
          'Scroll behavior',
          selectField(
            [
              ['normal', 'Scrolls with page'],
              ['fixed', 'Fixed background (parallax effect)'],
            ],
            block.scroll || 'normal',
            (scroll) => onChange({ ...block, scroll }),
          ),
        ),
      )
      const hint = document.createElement('p')
      hint.className = 'form-hint'
      hint.textContent =
        'Fixed backgrounds stay in place while content scrolls over them, creating a parallax-style effect.'
      fields.push(hint)
    }

    return fields
  }

  function wireAssetPickerSync() {
    if (typeof window.wireAssetPickers === 'function') {
      window.wireAssetPickers(root)
    }

    const dialog = document.getElementById('asset-library-dialog')
    if (dialog instanceof HTMLDialogElement && dialog.dataset.blockAssetHook !== '1') {
      dialog.dataset.blockAssetHook = '1'
      dialog.addEventListener('close', () => {
        root.querySelectorAll('[data-asset-picker-value][data-block-asset-index]').forEach((input) => {
          if (!(input instanceof HTMLInputElement)) return
          const indexKey = input.dataset.blockAssetIndex
          if (!indexKey) return
          const key = input.value
          if (indexKey.includes('-')) {
            const [sectionIndex, childIndex] = indexKey.split('-').map(Number)
            const section = blocks[sectionIndex]
            if (section?.type !== 'section') return
            const child = section.blocks[childIndex]
            if (child?.type !== 'image' || child.asset_key === key) return
            const nextChild = { ...child, asset_key: key }
            updateBlock(sectionIndex, {
              ...section,
              blocks: section.blocks.map((item, i) => (i === childIndex ? nextChild : item)),
            })
          } else {
            const index = Number(indexKey)
            const block = blocks[index]
            if (block?.type !== 'image' || block.asset_key === key) return
            updateBlock(index, { ...block, asset_key: key })
          }
        })
      })
    }
  }

  function textInput(value, onInput, placeholder) {
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'page-block-input'
    input.value = value
    if (placeholder) input.placeholder = placeholder
    input.addEventListener('input', () => onInput(input.value))
    return input
  }

  function textArea(value, onInput, rows) {
    const textarea = document.createElement('textarea')
    textarea.className = 'page-block-textarea'
    textarea.rows = rows
    textarea.value = value
    textarea.addEventListener('input', () => onInput(textarea.value))
    return textarea
  }

  function applyTextStyleFields(wrap, block, update) {
    wrap.append(
      field('Text color', colorSelect(block.color, (color) => update((b) => ({ ...b, color })))),
      field('Font', fontSelect(block.font, (font) => update((b) => ({ ...b, font })))),
    )
  }

  function renderNestedBlocks(sectionBlock, sectionIndex) {
    const nested = document.createElement('div')
    nested.className = 'page-block-nested'

    const nestedToolbar = document.createElement('div')
    nestedToolbar.className = 'page-blocks-toolbar page-blocks-toolbar-nested'
    ;[
      ['heading', 'Heading'],
      ['text', 'Paragraph'],
      ['list', 'List'],
      ['callout', 'Callout'],
      ['button', 'Button'],
      ['image', 'Image'],
    ].forEach(([type, label]) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn btn-secondary btn-sm'
      btn.textContent = `+ ${label}`
      btn.addEventListener('click', () => {
        activeBlockIndex = `${sectionIndex}-${blocks[sectionIndex]?.type === 'section' ? blocks[sectionIndex].blocks.length : 0}`
        collapsedBlocks.delete(String(sectionIndex))
        collapsedBlocks.delete(activeBlockIndex)
        updateBlock(sectionIndex, (section) => {
          if (section.type !== 'section') return section
          return { ...section, blocks: [...section.blocks, defaultBlock(type)] }
        })
        render()
      })
      nestedToolbar.append(btn)
    })
    nested.append(nestedToolbar)

    sectionBlock.blocks.forEach((child, childIndex) => {
      nested.append(renderNestedBlockEditor(child, sectionIndex, childIndex))
    })

    return nested
  }

  function renderNestedBlockEditor(block, sectionIndex, childIndex) {
    const indexKey = `${sectionIndex}-${childIndex}`
    const card = document.createElement('article')
    card.className = 'page-block-card page-block-card-nested'
    card.dataset.blockIndex = indexKey
    if (collapsedBlocks.has(indexKey)) card.classList.add('is-collapsed')
    if (activeBlockIndex === indexKey) card.classList.add('page-block-card--active')

    const body = document.createElement('div')
    body.className = 'page-block-card-body'

    /** @param {PageBlock | ((block: PageBlock) => PageBlock)} nextOrUpdater */
    function updateChild(nextOrUpdater) {
      const section = blocks[sectionIndex]
      if (section.type !== 'section') return
      const current = section.blocks[childIndex]
      if (!current) return
      const next = resolveBlockUpdate(current, nextOrUpdater)
      updateBlock(sectionIndex, (s) => {
        if (s.type !== 'section') return s
        const nextBlocks = s.blocks.map((item, i) => (i === childIndex ? next : item))
        return { ...s, blocks: nextBlocks }
      })
      updateSummaryText(card, next)
    }

    const header = renderBlockHeader(indexKey, block, blocks, false)
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'btn btn-secondary btn-sm'
    remove.textContent = 'Remove'
    remove.addEventListener('click', (event) => {
      event.stopPropagation()
      updateBlock(sectionIndex, (section) => {
        if (section.type !== 'section') return section
        return { ...section, blocks: section.blocks.filter((_, i) => i !== childIndex) }
      })
      render()
    })
    header.append(remove)
    card.append(header)

    if (block.type === 'heading') {
      body.append(
        field('Text', textInput(block.text, (text) => updateChild((b) => ({ ...b, text })))),
        field(
          'Level',
          selectField(
            [
              ['2', 'H2'],
              ['3', 'H3'],
              ['4', 'H4'],
            ],
            String(block.level),
            (level) => updateChild((b) => ({ ...b, level: Number(level) })),
          ),
        ),
        field('Alignment', alignSelect(block.align, (align) => updateChild((b) => ({ ...b, align })))),
      )
      applyTextStyleFields(body, block, updateChild)
    } else if (block.type === 'text') {
      body.append(
        field('Paragraph', textArea(block.body, (value) => updateChild((b) => ({ ...b, body: value })), 4)),
        field(
          'Alignment',
          alignSelect(block.align || 'left', (align) => updateChild((b) => ({ ...b, align }))),
        ),
      )
      applyTextStyleFields(body, block, updateChild)
    } else if (block.type === 'list') {
      const itemsArea = textArea(block.items.join('\n'), (value) => {
        const items = value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        updateChild((b) => ({ ...b, items: items.length > 0 ? items : [''] }))
      }, 4)
      body.append(
        field('List items (one per line)', itemsArea),
        field(
          'Style',
          selectField(
            [
              ['false', 'Bulleted'],
              ['true', 'Numbered'],
            ],
            String(block.ordered),
            (val) => updateChild((b) => ({ ...b, ordered: val === 'true' })),
          ),
        ),
      )
    } else if (block.type === 'callout') {
      body.append(
        field('Title', textInput(block.title || '', (title) => updateChild((b) => ({ ...b, title })))),
        field('Body', textArea(block.body, (value) => updateChild((b) => ({ ...b, body: value })), 4)),
        field(
          'Style',
          selectField(
            [
              ['default', 'Default'],
              ['muted', 'Muted'],
              ['accent', 'Accent'],
            ],
            block.style,
            (style) => updateChild((b) => ({ ...b, style })),
          ),
        ),
      )
    } else if (block.type === 'button') {
      renderButtonFields(block, (next) => updateChild(next)).forEach((el) => body.append(el))
    } else if (block.type === 'image') {
      renderImageFields(block, indexKey, (next) => updateChild(next), undefined, {
        nested: true,
      }).forEach((el) => body.append(el))
    }

    card.append(body)
    return card
  }

  /** @param {HTMLElement} card @param {PageBlock} block */
  function updateSummaryText(card, block) {
    const preview = card.querySelector('.page-block-card-preview')
    if (preview) preview.textContent = blockSummary(block)
  }

  function renderCalendarCommitteeField(block, update) {
    const wrap = document.createElement('div')
    wrap.className = 'page-block-field'

    const label = document.createElement('label')
    label.textContent = 'Committee filter'
    wrap.append(label)

    const allMode = document.createElement('label')
    allMode.className = 'admin-check page-block-check'
    const allInput = document.createElement('input')
    allInput.type = 'radio'
    allInput.name = `calendar-filter-${Math.random().toString(36).slice(2)}`
    allInput.checked = block.committee_keys.length === 0
    allInput.addEventListener('change', () => {
      if (allInput.checked) update((b) => ({ ...b, committee_keys: [] }))
    })
    allMode.append(allInput, document.createTextNode(' All events'))
    wrap.append(allMode)

    const selectedMode = document.createElement('label')
    selectedMode.className = 'admin-check page-block-check'
    const selectedInput = document.createElement('input')
    selectedInput.type = 'radio'
    selectedInput.name = allInput.name
    selectedInput.checked = block.committee_keys.length > 0
    selectedMode.append(selectedInput, document.createTextNode(' Selected committees'))
    wrap.append(selectedMode)

    const checklist = document.createElement('div')
    checklist.className = 'page-block-committee-list'

    committees.forEach((committee) => {
      const row = document.createElement('label')
      row.className = 'admin-check page-block-check'
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.value = committee.key
      input.checked = block.committee_keys.includes(committee.key)
      input.disabled = block.committee_keys.length === 0
      input.addEventListener('change', () => {
        const keys = committees
          .map((item) => item.key)
          .filter((key) => {
            const cb = checklist.querySelector(`input[value="${key}"]`)
            return cb instanceof HTMLInputElement && cb.checked
          })
        update((b) => ({ ...b, committee_keys: keys }))
      })
      row.append(input, document.createTextNode(` ${committee.name}`))
      checklist.append(row)
    })

    selectedInput.addEventListener('change', () => {
      if (!selectedInput.checked) return
      const keys = committees.length > 0 ? [committees[0].key] : []
      update((b) => ({ ...b, committee_keys: keys }))
      render()
    })

    allInput.addEventListener('change', () => {
      if (!allInput.checked) return
      update((b) => ({ ...b, committee_keys: [] }))
      render()
    })

    wrap.append(checklist)

    const hint = document.createElement('p')
    hint.className = 'form-hint'
    hint.textContent =
      'Choose all events or limit the calendar to one or more committees. Chapter-wide events (no committee) appear only when showing all events.'
    wrap.append(hint)

    return wrap
  }

  function renderBlockEditor(block, index) {
    const indexKey = String(index)
    const card = document.createElement('article')
    card.className = 'page-block-card'
    card.dataset.blockType = block.type
    card.dataset.blockIndex = indexKey
    if (collapsedBlocks.has(indexKey)) card.classList.add('is-collapsed')
    if (activeBlockIndex === indexKey) card.classList.add('page-block-card--active')

    const body = document.createElement('div')
    body.className = 'page-block-card-body'

    card.append(renderBlockHeader(indexKey, block, blocks))

    if (block.type === 'heading') {
      body.append(
        field('Text', textInput(block.text, (text) => {
          updateBlock(index, (b) => {
            const next = { ...b, text }
            updateSummaryText(card, next)
            return next
          })
        })),
        field(
          'Level',
          selectField(
            [
              ['2', 'H2'],
              ['3', 'H3'],
              ['4', 'H4'],
            ],
            String(block.level),
            (level) => updateBlock(index, (b) => ({ ...b, level: Number(level) })),
          ),
        ),
        field(
          'Alignment',
          alignSelect(block.align, (align) => updateBlock(index, (b) => ({ ...b, align }))),
        ),
      )
      applyTextStyleFields(body, block, (nextOrUpdater) => updateBlock(index, nextOrUpdater))
    } else if (block.type === 'text') {
      body.append(
        field('Paragraph', textArea(block.body, (value) => {
          updateBlock(index, (b) => {
            const next = { ...b, body: value }
            updateSummaryText(card, next)
            return next
          })
        }, 5)),
        field(
          'Alignment',
          alignSelect(block.align || 'left', (align) => updateBlock(index, (b) => ({ ...b, align }))),
        ),
      )
      applyTextStyleFields(body, block, (nextOrUpdater) => updateBlock(index, nextOrUpdater))
    } else if (block.type === 'list') {
      const itemsArea = textArea(block.items.join('\n'), (value) => {
        const items = value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        updateBlock(index, (b) => {
          const next = { ...b, items: items.length > 0 ? items : [''] }
          updateSummaryText(card, next)
          return next
        })
      }, 5)
      body.append(
        field('List items (one per line)', itemsArea),
        field(
          'Style',
          selectField(
            [
              ['false', 'Bulleted'],
              ['true', 'Numbered'],
            ],
            String(block.ordered),
            (val) => updateBlock(index, (b) => ({ ...b, ordered: val === 'true' })),
          ),
        ),
      )
    } else if (block.type === 'callout') {
      body.append(
        field('Title', textInput(block.title || '', (title) => {
          updateBlock(index, (b) => {
            const next = { ...b, title }
            updateSummaryText(card, next)
            return next
          })
        })),
        field('Body', textArea(block.body, (value) => {
          updateBlock(index, (b) => {
            const next = { ...b, body: value }
            updateSummaryText(card, next)
            return next
          })
        }, 5)),
        field(
          'Style',
          selectField(
            [
              ['default', 'Default'],
              ['muted', 'Muted'],
              ['accent', 'Accent'],
            ],
            block.style,
            (style) => updateBlock(index, (b) => ({ ...b, style })),
          ),
        ),
      )
    } else if (block.type === 'calendar') {
      body.append(
        field(
          'Title (optional)',
          textInput(block.title || '', (title) => updateBlock(index, (b) => ({ ...b, title }))),
        ),
        field(
          'Default view',
          selectField(
            [
              ['list', 'List'],
              ['week', 'Week'],
              ['month', 'Month'],
            ],
            block.view,
            (view) => updateBlock(index, (b) => ({ ...b, view })),
          ),
        ),
        renderCalendarCommitteeField(block, (nextOrUpdater) => updateBlock(index, nextOrUpdater)),
      )
    } else if (block.type === 'section') {
      const bg = sectionBackground(block)
      body.append(
        field(
          'Section title',
          textInput(block.title || '', (title) => {
            updateBlock(index, (b) => {
              const next = { ...b, title }
              updateSummaryText(card, next)
              return next
            })
          }),
        ),
        field(
          'Background',
          sectionBackgroundSelect(bg, (background) =>
            updateBlock(index, (b) => ({
              ...b,
              background,
              muted: background === 'muted',
            })),
          ),
        ),
        renderNestedBlocks(block, index        ),
      )
    } else if (block.type === 'button') {
      renderButtonFields(
        block,
        (next) => updateBlock(index, next),
        (next) => updateSummaryText(card, next),
      ).forEach((el) => body.append(el))
    } else if (block.type === 'image') {
      renderImageFields(
        block,
        indexKey,
        (next) => updateBlock(index, next),
        (next) => updateSummaryText(card, next),
      ).forEach((el) => body.append(el))
    } else if (block.type === 'hero') {
      body.append(
        field('Eyebrow', textInput(block.eyebrow, (eyebrow) => {
          updateBlock(index, (b) => {
            const next = { ...b, eyebrow }
            updateSummaryText(card, next)
            return next
          })
        })),
        field('Headline', textInput(block.title, (title) => {
          updateBlock(index, (b) => {
            const next = { ...b, title }
            updateSummaryText(card, next)
            return next
          })
        })),
        field('Lead paragraph', textArea(block.lead, (lead) => {
          updateBlock(index, (b) => {
            const next = { ...b, lead }
            updateSummaryText(card, next)
            return next
          })
        }, 4)),
        field(
          'Primary button label',
          textInput(block.cta_primary_label, (cta_primary_label) =>
            updateBlock(index, (b) => ({ ...b, cta_primary_label })),
          ),
        ),
        field(
          'Primary button link',
          textInput(block.cta_primary_href, (cta_primary_href) =>
            updateBlock(index, (b) => ({ ...b, cta_primary_href })),
          ),
        ),
        field(
          'Secondary button label',
          textInput(block.cta_secondary_label, (cta_secondary_label) =>
            updateBlock(index, (b) => ({ ...b, cta_secondary_label })),
          ),
        ),
        field(
          'Secondary button link',
          textInput(block.cta_secondary_href, (cta_secondary_href) =>
            updateBlock(index, (b) => ({ ...b, cta_secondary_href })),
          ),
        ),
      )
    } else if (block.type === 'events_feed' || block.type === 'dirt_feed') {
      const feedLabel = block.type === 'events_feed' ? 'events' : 'THE DIRT items'
      body.append(
        field('Section title', textInput(block.title, (title) => {
          updateBlock(index, (b) => {
            const next = { ...b, title }
            updateSummaryText(card, next)
            return next
          })
        })),
        field('Lead paragraph', textArea(block.lead, (lead) => {
          updateBlock(index, (b) => {
            const next = { ...b, lead }
            updateSummaryText(card, next)
            return next
          })
        }, 3)),
        field(
          `Number of ${feedLabel} to show`,
          textInput(String(block.limit), (value) => {
            const limit = Math.max(1, Number.parseInt(value, 10) || 3)
            updateBlock(index, (b) => ({ ...b, limit }))
          }),
        ),
      )
    }

    card.append(body)
    return card
  }

  function render() {
    root.replaceChildren()
    root.append(renderToolbar())

    if (blocks.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'admin-help'
      empty.textContent = isHomePage
        ? 'No home page blocks yet. Add a hero banner, events list, or THE DIRT feed.'
        : 'No content blocks yet. Add a heading, paragraph, list, callout, section, button, image, or events calendar.'
      root.append(empty)
    } else {
      blocks.forEach((block, index) => {
        root.append(renderBlockEditor(block, index))
      })
    }

    syncHidden()
    wireAssetPickerSync()
  }

  parseInitial()
  initCollapsedState()
  render()

  root.addEventListener('focusin', (event) => {
    const card =
      event.target instanceof Element ? event.target.closest('[data-block-index]') : null
    if (!(card instanceof HTMLElement)) return
    const index = card.getAttribute('data-block-index')
    if (!index || index === activeBlockIndex) return
    selectBlock(index, { scrollPreview: true, scrollEditor: false })
  })

  if (previewFrame instanceof HTMLIFrameElement) {
    previewFrame.addEventListener('load', () => {
      wirePreviewFrame()
      if (activeBlockIndex) highlightPreviewBlock(activeBlockIndex)
    })
  }

  form?.addEventListener('submit', syncHidden)
  titleInput?.addEventListener('input', schedulePreview)
  metaInput?.addEventListener('input', schedulePreview)
  window.initPagePreviewMode()
  }

  window.initPageBlocksEditor()
  window.initPagePreviewMode()
})()
