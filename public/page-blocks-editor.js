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
  /** @typedef {'sm' | 'md' | 'lg' | 'xl'} BlockTextSize */
  /** @typedef {'body' | 'display' | 'serif' | 'fraunces' | 'condensed' | 'bebas' | 'oswald' | 'outfit' | 'inter'} BlockFont */
  /** @typedef {'none' | 'muted' | 'accent-soft' | 'accent' | 'primary' | 'surface'} SectionBackground */

  /** @typedef {{ type: 'heading', text: string, level: 2 | 3 | 4, align: TextAlign, color?: BlockColor, font?: BlockFont }} HeadingBlock */
  /** @typedef {{ type: 'text', body: string, align?: TextAlign, color?: BlockColor, font?: BlockFont }} TextBlock */
  /** @typedef {{ type: 'list', ordered: boolean, items: string[] }} ListBlock */
  /** @typedef {{ type: 'callout', title?: string, body: string, style: 'default' | 'muted' | 'accent' }} CalloutBlock */
  /** @typedef {{ type: 'section', title?: string, muted?: boolean, background?: SectionBackground, blocks: PageBlock[] }} SectionBlock */
  /** @typedef {{ type: 'calendar', title?: string, view: 'list' | 'week' | 'month', committee_keys: string[] }} CalendarBlock */
  /** @typedef {{ type: 'hero', eyebrow: string, title: string, lead: string, eyebrow_color?: BlockColor, eyebrow_size?: BlockTextSize, title_color?: BlockColor, title_size?: BlockTextSize, lead_color?: BlockColor, lead_size?: BlockTextSize, cta_primary_label: string, cta_primary_href: string, cta_secondary_label: string, cta_secondary_href: string }} HeroBlock */
  /** @typedef {{ type: 'events_feed', title: string, lead: string, limit: number }} EventsFeedBlock */
  /** @typedef {{ type: 'dirt_feed', title: string, lead: string, limit: number }} DirtFeedBlock */
  /** @typedef {{ type: 'button', label: string, href: string, style: 'primary' | 'secondary', align?: TextAlign, new_tab?: boolean }} ButtonBlock */
  /** @typedef {{ type: 'image', asset_key: string, alt?: string, caption?: string, layout: 'inline' | 'section' | 'background' | 'overlay' | 'banner', align?: TextAlign, width?: 'auto' | 'small' | 'medium' | 'large' | 'full', height?: 'auto' | 'small' | 'medium' | 'large' | 'viewport', scroll?: 'normal' | 'fixed', full_width?: boolean }} ImageBlock */
  /** @typedef {{ type: 'benefits_grid', title?: string, items: { title: string, body: string }[] }} BenefitsGridBlock */
  /** @typedef {{ type: 'stats_panel', items: { value: string, label: string }[] }} StatsPanelBlock */
  /** @typedef {{ type: 'member_types', title?: string }} MemberTypesBlock */
  /** @typedef {{ type: 'newsletter_panel', title: string, body: string, consent_hint: string, button_label: string }} NewsletterPanelBlock */
  /** @typedef {{ type: 'contact_form', name_label: string, email_label: string, message_label: string, submit_label: string }} ContactFormBlock */
  /** @typedef {HeadingBlock | TextBlock | ListBlock | CalloutBlock | SectionBlock | CalendarBlock | HeroBlock | EventsFeedBlock | DirtFeedBlock | ButtonBlock | ImageBlock | BenefitsGridBlock | StatsPanelBlock | MemberTypesBlock | NewsletterPanelBlock | ContactFormBlock} PageBlock */

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
  const isJoinPage = pageSlug === 'join'
  const isContactPage = pageSlug === 'contact'

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
    benefits_grid: 'Benefits grid',
    stats_panel: 'Stats panel',
    member_types: 'Membership types',
    newsletter_panel: 'Newsletter panel',
    contact_form: 'Contact form',
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
      case 'image': {
        const label = block.asset_key
          ? truncate(block.alt || block.caption || block.asset_key)
          : 'No image selected'
        if (block.layout === 'banner') return `Full-screen banner · ${label}`
        if (block.layout === 'overlay') return `Page-open overlay · ${label}`
        return label
      }
      case 'benefits_grid':
        return truncate(block.title || `Benefits · ${block.items.length} items`)
      case 'stats_panel':
        return `Stats · ${block.items.length} items`
      case 'member_types':
        return truncate(block.title || 'Membership types')
      case 'newsletter_panel':
        return truncate(block.title || 'Newsletter panel')
      case 'contact_form':
        return 'Contact form labels'
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

  function collapseEveryBlock() {
    blocks.forEach((block, index) => {
      collapsedBlocks.add(String(index))
      if (block.type === 'section') {
        block.blocks.forEach((_, childIndex) => {
          collapsedBlocks.add(`${index}-${childIndex}`)
        })
      }
    })
  }

  function initCollapsedState() {
    collapsedBlocks.clear()
    // Keep expanded when few blocks; collapse when many to reduce scroll.
    if (blocks.length > 5) {
      collapseEveryBlock()
    }
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

  function updateSelectionUi(options = {}) {
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
    if (activeBlockIndex && !options.skipPreviewHighlight) {
      highlightPreviewBlock(activeBlockIndex)
    }
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
      html.cms-preview-just-updated body { animation: cmsPreviewPulse 0.18s ease; }
      @keyframes cmsPreviewPulse {
        from { filter: brightness(1.04); }
        to { filter: none; }
      }
    `
    doc.head.append(style)
  }

  function wirePreviewFrame() {
    if (!(previewFrame instanceof HTMLIFrameElement)) return
    const doc = previewFrame.contentDocument
    if (!doc?.body) return
    injectPreviewStyles(doc)
    if (doc.documentElement.dataset.cmsPreviewWired === '1') return
    doc.documentElement.dataset.cmsPreviewWired = '1'
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

    const dragHandle = document.createElement('button')
    dragHandle.type = 'button'
    dragHandle.className = 'page-block-drag-handle'
    dragHandle.draggable = true
    dragHandle.setAttribute('aria-label', 'Drag to reorder')
    dragHandle.title = 'Drag to reorder'
    dragHandle.textContent = '⠿'
    dragHandle.addEventListener('dragstart', (event) => {
      const card = dragHandle.closest('[data-block-index]')
      if (card instanceof HTMLElement) card.classList.add('is-dragging')
      const indexStr = String(index)
      if (indexStr.includes('-')) {
        const parts = indexStr.split('-')
        const sectionIndex = Number.parseInt(parts[0] || '', 10)
        const childIndex = Number.parseInt(parts[1] || '', 10)
        if (Number.isFinite(sectionIndex) && Number.isFinite(childIndex)) {
          setDragTransfer(event.dataTransfer, `move-nested:${sectionIndex}:${childIndex}`)
        }
      } else {
        setDragTransfer(event.dataTransfer, `move:${indexStr}`)
      }
    })
    dragHandle.addEventListener('dragend', () => {
      const card = dragHandle.closest('[data-block-index]')
      if (card instanceof HTMLElement) card.classList.remove('is-dragging')
    })

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

    header.append(dragHandle, toggle, summary)
    if (includeActions && !String(index).includes('-')) {
      header.append(renderActions(Number(index), list))
    }
    return header
  }

  /** @type {{ key: string, name: string }[]} */
  let committees = []
  try {
    committees = JSON.parse(root.dataset.committees || '[]')
  } catch {
    committees = []
  }

  /** @type {{ href: string, label: string, group: string }[]} */
  let internalLinks = []
  try {
    internalLinks = JSON.parse(root.dataset.internalLinks || '[]')
  } catch {
    internalLinks = []
  }

  const COLOR_OPTIONS = [
    ['default', 'Default'],
    ['muted', 'Muted'],
    ['accent', 'Accent'],
    ['primary', 'Primary'],
  ]

  const SIZE_OPTIONS = [
    ['sm', 'Small'],
    ['md', 'Default'],
    ['lg', 'Large'],
    ['xl', 'Extra large'],
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

  function syncHidden(options = {}) {
    hiddenInput.value = JSON.stringify(blocks)
    if (savedSnapshot) markDirty()
    schedulePreview(Boolean(options.immediate))
  }

  let savedSnapshot = ''
  let isDirty = false
  const draftStorageKey = `page-blocks-draft:${pageSlug}`

  function currentSnapshot() {
    const title = titleInput instanceof HTMLInputElement ? titleInput.value : ''
    const meta = metaInput instanceof HTMLInputElement ? metaInput.value : ''
    return JSON.stringify({ title, meta, blocks })
  }

  function markDirty() {
    if (!savedSnapshot) return
    const dirty = currentSnapshot() !== savedSnapshot
    if (dirty === isDirty) return
    isDirty = dirty
    const banner = document.getElementById('page-edit-unsaved')
    if (banner) banner.hidden = !dirty
    try {
      if (dirty) sessionStorage.setItem(draftStorageKey, currentSnapshot())
      else sessionStorage.removeItem(draftStorageKey)
    } catch {
      // Ignore storage errors.
    }
  }

  function showPreviewError(message) {
    const el = document.getElementById('page-edit-preview-error')
    if (!el) return
    el.textContent = message
    el.hidden = !message
  }

  function setPreviewUpdating(updating) {
    const viewport = document.querySelector('[data-preview-viewport]')
    if (viewport instanceof HTMLElement) {
      viewport.classList.toggle('is-preview-updating', updating)
    }
  }

  const PREVIEW_DEBOUNCE_MS = 80

  function schedulePreview(immediate = false) {
    if (!(previewFrame instanceof HTMLIFrameElement) || !previewDraftUrl) return
    window.clearTimeout(previewTimer)
    previewTimer = window.setTimeout(updatePreview, immediate ? 0 : PREVIEW_DEBOUNCE_MS)
  }

  /**
   * Patch the existing iframe document instead of resetting srcdoc (avoids white flash + scroll jump).
   * @param {string} html
   */
  function applyPreviewHtml(html) {
    if (!(previewFrame instanceof HTMLIFrameElement)) return
    const doc = previewFrame.contentDocument
    const canPatch =
      doc?.documentElement &&
      doc.body &&
      doc.body.childNodes.length > 0 &&
      // Full reload when new preview brings calendar/map assets that need script execution
      !/<script[^>]+(?:leaflet|event-map-thumbs|page-calendar)/i.test(html)

    if (!canPatch) {
      previewFrame.srcdoc = html
      return
    }

    const scrollY = doc.defaultView?.scrollY ?? 0
    const scrollX = doc.defaultView?.scrollX ?? 0
    const activeIndex = activeBlockIndex
    const parser = new DOMParser()
    const nextDoc = parser.parseFromString(html, 'text/html')
    if (!nextDoc.body) {
      previewFrame.srcdoc = html
      return
    }

    nextDoc.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute('href')
      if (!href) return
      if (!doc.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)) {
        doc.head.append(doc.importNode(link, true))
      }
    })

    if (nextDoc.title) doc.title = nextDoc.title

    const importedBody = doc.importNode(nextDoc.body, true)
    doc.body.replaceWith(importedBody)

    doc.defaultView?.scrollTo(scrollX, scrollY)
    wirePreviewFrame()
    if (activeIndex) highlightPreviewBlock(activeIndex)

    doc.documentElement.classList.add('cms-preview-just-updated')
    window.setTimeout(() => {
      doc.documentElement?.classList.remove('cms-preview-just-updated')
    }, 180)
  }

  async function updatePreview() {
    if (!(previewFrame instanceof HTMLIFrameElement) || !previewDraftUrl) return

    const requestId = ++previewRequestId
    const title = titleInput instanceof HTMLInputElement ? titleInput.value : ''
    const meta_description = metaInput instanceof HTMLInputElement ? metaInput.value : ''
    setPreviewUpdating(true)

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

      if (requestId !== previewRequestId) return
      if (!response.ok) {
        showPreviewError(`Preview failed (${response.status}). Your edits are still in the editor.`)
        return
      }
      const html = await response.text()
      if (requestId !== previewRequestId) return
      showPreviewError('')
      applyPreviewHtml(html)
      if (!(previewFrame.contentDocument?.body?.childNodes.length)) {
        // First paint / full srcdoc path — wire after load
        previewFrame.addEventListener(
          'load',
          () => {
            wirePreviewFrame()
            if (activeBlockIndex) highlightPreviewBlock(activeBlockIndex)
          },
          { once: true },
        )
      }
    } catch {
      if (requestId !== previewRequestId) return
      showPreviewError('Preview could not update. Check your connection and try editing again.')
    } finally {
      if (requestId === previewRequestId) setPreviewUpdating(false)
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
      case 'benefits_grid':
        return {
          type: 'benefits_grid',
          title: 'Member benefits',
          items: [{ title: 'Benefit title', body: 'Short description.' }],
        }
      case 'stats_panel':
        return {
          type: 'stats_panel',
          items: [{ value: '50+', label: 'Years of leadership' }],
        }
      case 'member_types':
        return { type: 'member_types', title: 'Membership types' }
      case 'newsletter_panel':
        return {
          type: 'newsletter_panel',
          title: 'Newsletter — THE DIRT',
          body: 'Join the mailing list for chapter news and upcoming events.',
          consent_hint:
            'By subscribing you agree to receive chapter emails. We will not sell your information.',
          button_label: 'Subscribe',
        }
      case 'contact_form':
        return {
          type: 'contact_form',
          name_label: 'Name',
          email_label: 'Email',
          message_label: 'Message',
          submit_label: 'Send message',
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
    activeBlockIndex = String(next)
    render()
  }

  function deleteBlock(index) {
    blocks = blocks.filter((_, i) => i !== index)
    render()
  }

  function setDragTransfer(dataTransfer, value) {
    dataTransfer?.setData('text/plain', value)
    if (dataTransfer) dataTransfer.effectAllowed = 'move'
  }

  /**
   * @param {string} raw
   * @returns {{ kind: 'move', index: number } | { kind: 'new', type: string } | { kind: 'move-nested', sectionIndex: number, childIndex: number } | { kind: 'new-nested', sectionIndex: number, type: string } | null}
   */
  function parseDragData(raw) {
    if (!raw) return null
    if (raw.startsWith('move-nested:')) {
      const parts = raw.slice(12).split(':')
      const sectionIndex = Number.parseInt(parts[0] || '', 10)
      const childIndex = Number.parseInt(parts[1] || '', 10)
      if (Number.isFinite(sectionIndex) && Number.isFinite(childIndex)) {
        return { kind: 'move-nested', sectionIndex, childIndex }
      }
      return null
    }
    if (raw.startsWith('new-nested:')) {
      const parts = raw.slice(11).split(':')
      const sectionIndex = Number.parseInt(parts[0] || '', 10)
      const type = parts[1] || ''
      if (Number.isFinite(sectionIndex) && type) return { kind: 'new-nested', sectionIndex, type }
      return null
    }
    if (raw.startsWith('new:')) {
      const type = raw.slice(4)
      if (type) return { kind: 'new', type }
      return null
    }
    if (raw.startsWith('move:')) {
      const index = Number.parseInt(raw.slice(5), 10)
      if (Number.isFinite(index)) return { kind: 'move', index }
      return null
    }
    const legacyIndex = Number.parseInt(raw, 10)
    if (Number.isFinite(legacyIndex) && String(legacyIndex) === raw.trim()) {
      return { kind: 'move', index: legacyIndex }
    }
    return null
  }

  function insertTopLevelBlockAt(index, block) {
    const copy = blocks.slice()
    copy.splice(index, 0, block)
    blocks = copy
    activeBlockIndex = String(index)
    collapsedBlocks.delete(String(index))
    render()
  }

  function reorderTopLevelBlock(from, to) {
    if (!Number.isFinite(from) || from === to) return
    if (from < 0 || from >= blocks.length) return
    const boundedTo = Math.max(0, Math.min(to, blocks.length - 1))
    if (from === boundedTo) return
    const copy = blocks.slice()
    const [item] = copy.splice(from, 1)
    if (!item) return
    copy.splice(boundedTo, 0, item)
    blocks = copy
    activeBlockIndex = String(boundedTo)
    render()
  }

  function insertNestedBlockAt(sectionIndex, childIndex, block) {
    const section = blocks[sectionIndex]
    if (section?.type !== 'section') return
    const indexKey = `${sectionIndex}-${childIndex}`
    activeBlockIndex = indexKey
    collapsedBlocks.delete(String(sectionIndex))
    collapsedBlocks.delete(indexKey)
    updateBlock(sectionIndex, (s) => {
      if (s.type !== 'section') return s
      const nextBlocks = s.blocks.slice()
      nextBlocks.splice(childIndex, 0, block)
      return { ...s, blocks: nextBlocks }
    })
    render()
  }

  function reorderNestedBlock(sectionIndex, fromChild, toChild) {
    if (fromChild === toChild) return
    const section = blocks[sectionIndex]
    if (section?.type !== 'section') return
    if (fromChild < 0 || fromChild >= section.blocks.length) return
    const boundedTo = Math.max(0, Math.min(toChild, section.blocks.length - 1))
    if (fromChild === boundedTo) return
    updateBlock(sectionIndex, (s) => {
      if (s.type !== 'section') return s
      const nextBlocks = s.blocks.slice()
      const [item] = nextBlocks.splice(fromChild, 1)
      if (!item) return s
      nextBlocks.splice(boundedTo, 0, item)
      return { ...s, blocks: nextBlocks }
    })
    activeBlockIndex = `${sectionIndex}-${boundedTo}`
    render()
  }

  /**
   * @param {HTMLElement} el
   * @param {(data: ReturnType<typeof parseDragData>) => void} onDrop
   */
  function wireDropTarget(el, onDrop) {
    el.addEventListener('dragover', (event) => {
      event.preventDefault()
      el.classList.add('is-drag-over')
    })
    el.addEventListener('dragleave', (event) => {
      const related = event.relatedTarget
      if (related instanceof Node && el.contains(related)) return
      el.classList.remove('is-drag-over')
    })
    el.addEventListener('drop', (event) => {
      event.preventDefault()
      event.stopPropagation()
      el.classList.remove('is-drag-over')
      const raw = event.dataTransfer?.getData('text/plain') || ''
      onDrop(parseDragData(raw))
    })
  }

  /**
   * @param {ReturnType<typeof parseDragData>} dragData
   * @param {number} targetIndex
   */
  function handleTopLevelDrop(targetIndex, dragData) {
    if (!dragData) return
    if (dragData.kind === 'new') {
      insertTopLevelBlockAt(targetIndex, defaultBlock(dragData.type))
      return
    }
    if (dragData.kind === 'move') {
      reorderTopLevelBlock(dragData.index, targetIndex)
    }
  }

  /**
   * @param {number} sectionIndex
   * @param {number} targetChildIndex
   * @param {ReturnType<typeof parseDragData>} dragData
   */
  function handleNestedDrop(sectionIndex, targetChildIndex, dragData) {
    if (!dragData) return
    if (dragData.kind === 'new' || dragData.kind === 'new-nested') {
      if (dragData.kind === 'new-nested' && dragData.sectionIndex !== sectionIndex) return
      insertNestedBlockAt(sectionIndex, targetChildIndex, defaultBlock(dragData.type))
      return
    }
    if (
      dragData.kind === 'move-nested' &&
      dragData.sectionIndex === sectionIndex &&
      dragData.childIndex !== targetChildIndex
    ) {
      reorderNestedBlock(sectionIndex, dragData.childIndex, targetChildIndex)
    }
  }

  /**
   * @param {number} insertIndex
   * @param {string} [label]
   */
  function renderDropZone(insertIndex, label = 'Drop block here') {
    const zone = document.createElement('div')
    zone.className = 'page-blocks-drop-zone'
    zone.textContent = label
    wireDropTarget(zone, (data) => handleTopLevelDrop(insertIndex, data))
    return zone
  }

  /**
   * @param {number} sectionIndex
   * @param {number} insertChildIndex
   */
  function renderNestedDropZone(sectionIndex, insertChildIndex) {
    const zone = document.createElement('div')
    zone.className = 'page-blocks-drop-zone page-blocks-drop-zone-nested'
    zone.textContent = 'Drop block here'
    wireDropTarget(zone, (data) => handleNestedDrop(sectionIndex, insertChildIndex, data))
    return zone
  }

  /**
   * @param {HTMLButtonElement} btn
   * @param {string} type
   * @param {{ sectionIndex?: number }} [options]
   */
  function wireToolbarAddButton(btn, type, options = {}) {
    const { sectionIndex } = options
    let suppressClick = false
    btn.draggable = true
    btn.classList.add('page-blocks-toolbar-btn')
    btn.title =
      sectionIndex == null
        ? 'Drag onto the list to insert at a position, or click to add at the end'
        : 'Drag onto the section to insert at a position, or click to add at the end'
    btn.addEventListener('dragstart', (event) => {
      suppressClick = false
      btn.classList.add('is-dragging')
      const payload =
        sectionIndex == null ? `new:${type}` : `new-nested:${sectionIndex}:${type}`
      setDragTransfer(event.dataTransfer, payload)
    })
    btn.addEventListener('dragend', () => {
      btn.classList.remove('is-dragging')
      suppressClick = true
      window.setTimeout(() => {
        suppressClick = false
      }, 0)
    })
    btn.addEventListener('click', () => {
      if (suppressClick) return
      if (sectionIndex == null) {
        insertTopLevelBlockAt(blocks.length, defaultBlock(type))
      } else {
        const section = blocks[sectionIndex]
        const childCount = section?.type === 'section' ? section.blocks.length : 0
        insertNestedBlockAt(sectionIndex, childCount, defaultBlock(type))
      }
    })
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

  const generalBlockTypes = [
    ['heading', 'Heading'],
    ['text', 'Paragraph'],
    ['list', 'List'],
    ['callout', 'Callout box'],
    ['section', 'Section'],
    ['calendar', 'Events calendar'],
    ['button', 'Button link'],
    ['image', 'Image'],
  ]

  const homeBlockTypes = [
    ['hero', 'Hero banner'],
    ['events_feed', 'Events list'],
    ['dirt_feed', 'THE DIRT feed'],
  ]

  const joinBlockTypes = [
    ['benefits_grid', 'Benefits grid'],
    ['stats_panel', 'Stats panel'],
    ['member_types', 'Membership types'],
  ]

  const contactBlockTypes = [
    ['contact_form', 'Contact form'],
    ['newsletter_panel', 'Newsletter panel'],
  ]

  function renderToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'page-blocks-toolbar'
    let blockTypes = generalBlockTypes
    if (isHomePage) blockTypes = [...homeBlockTypes, ...generalBlockTypes]
    else if (isJoinPage) blockTypes = [...joinBlockTypes, ...generalBlockTypes]
    else if (isContactPage) blockTypes = [...contactBlockTypes, ...generalBlockTypes]
    blockTypes.forEach(([type, label]) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn btn-secondary btn-sm'
      btn.textContent = `+ ${label}`
      wireToolbarAddButton(btn, type)
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
        collapsedBlocks.clear()
        collapseEveryBlock()
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
    up.addEventListener('click', (event) => {
      event.stopPropagation()
      moveBlock(index, -1)
    })

    const down = document.createElement('button')
    down.type = 'button'
    down.className = 'btn btn-secondary btn-sm'
    down.textContent = '↓'
    down.disabled = index === list.length - 1
    down.addEventListener('click', (event) => {
      event.stopPropagation()
      moveBlock(index, 1)
    })

    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'btn btn-secondary btn-sm'
    del.textContent = 'Remove'
    del.addEventListener('click', (event) => {
      event.stopPropagation()
      deleteBlock(index)
    })

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

  function sizeSelect(value, onChange) {
    return selectField(SIZE_OPTIONS, value || 'md', (size) =>
      onChange(size === 'md' ? undefined : size),
    )
  }

  function textSizeColorRow(sizeValue, colorValue, onSize, onColor) {
    const row = document.createElement('div')
    row.className = 'page-block-field-row'
    row.append(
      field('Size', sizeSelect(sizeValue, onSize)),
      field('Color', colorSelect(colorValue, onColor)),
    )
    return row
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
   * @param {(next: ImageBlock | ((block: ImageBlock) => ImageBlock)) => void} onChange
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
    picker.setAttribute('data-asset-picker', '')
    picker.setAttribute('data-asset-kind', 'image')

    const assetKey = block.asset_key || ''
    const assetUrl = assetKey ? `/assets/${assetKey}` : ''

    const preview = document.createElement('div')
    preview.className = 'admin-asset-picker-preview'
    preview.setAttribute('data-asset-picker-preview', '')
    if (!assetUrl) preview.hidden = true
    if (assetUrl) {
      const img = document.createElement('img')
      img.src = assetUrl
      img.alt = ''
      img.className = 'admin-modal-logo-preview'
      img.setAttribute('data-asset-picker-preview-image', '')
      img.loading = 'lazy'
      img.decoding = 'async'
      preview.append(img)
    }

    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    hiddenInput.value = assetKey
    hiddenInput.setAttribute('data-asset-picker-value', '')
    hiddenInput.dataset.blockAssetIndex = indexKey

    const actions = document.createElement('div')
    actions.className = 'admin-asset-picker-actions'

    const openBtn = document.createElement('button')
    openBtn.type = 'button'
    openBtn.className = 'btn btn-secondary btn-sm'
    openBtn.setAttribute('data-asset-picker-open', '')
    openBtn.textContent = 'Choose from library'

    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'btn btn-secondary btn-sm'
    clearBtn.setAttribute('data-asset-picker-clear', '')
    clearBtn.textContent = 'Clear'
    clearBtn.hidden = !assetKey

    actions.append(openBtn, clearBtn)
    picker.append(preview, hiddenInput, actions)
    wrap.append(picker)

    function syncFromPicker() {
      const nextKey = hiddenInput.value
      onChange((current) =>
        current.asset_key === nextKey ? current : { ...current, asset_key: nextKey },
      )
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
      field('Link', linkInput(block.href, (href) => onChange({ ...block, href }))),
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

    return fields
  }

  /**
   * @param {ImageBlock} block
   * @param {string} indexKey
   * @param {(next: ImageBlock | ((block: ImageBlock) => ImageBlock)) => void} onChange
   * @param {(next: ImageBlock) => void} [onSummary]
   * @param {{ nested?: boolean }} [options]
   */
  function renderImageFields(block, indexKey, onChange, onSummary, options = {}) {
    const nested = options.nested === true
    const fields = [renderImageAssetField(block, indexKey, onChange, options)]

    /**
     * @param {(current: ImageBlock) => ImageBlock} patch
     * @param {{ summary?: boolean, rerender?: boolean }} [patchOptions]
     */
    function patchImage(patch, patchOptions = {}) {
      onChange((current) => {
        const next = patch(current)
        if (patchOptions.summary) onSummary?.(next)
        if (patchOptions.rerender) render()
        return next
      })
    }

    fields.push(
      field('Alt text', textInput(block.alt || '', (alt) => patchImage((b) => ({ ...b, alt })))),
      field(
        'Caption (optional)',
        textInput(block.caption || '', (caption) => patchImage((b) => ({ ...b, caption }))),
      ),
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
              ['banner', 'Full-screen banner (fixed, fades on scroll)'],
              ['overlay', 'Popup overlay when page opens'],
            ],
            block.layout,
            (layout) => {
              patchImage(
                (b) => {
                  const next = { ...b, layout }
                  if (layout === 'inline') {
                    next.width = b.width || 'large'
                    next.height = undefined
                    next.scroll = undefined
                    next.full_width = undefined
                  } else if (layout === 'section') {
                    next.width = undefined
                    next.height = b.height || 'auto'
                    next.scroll = undefined
                    next.full_width = undefined
                  } else if (layout === 'overlay' || layout === 'banner') {
                    next.width = undefined
                    next.height = undefined
                    next.scroll = undefined
                    next.full_width = undefined
                  } else {
                    next.width = undefined
                    next.height = b.height || 'medium'
                    next.scroll = b.scroll || 'normal'
                    next.full_width =
                      (b.scroll || 'normal') === 'fixed' ? b.full_width === true : undefined
                  }
                  return next
                },
                { summary: true, rerender: true },
              )
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
          alignSelect(block.align || 'center', (align) => patchImage((b) => ({ ...b, align }))),
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
            (width) => patchImage((b) => ({ ...b, width })),
          ),
        ),
      )
    } else if (layout === 'overlay') {
      const hint = document.createElement('p')
      hint.className = 'form-hint'
      hint.textContent =
        'Shows as a dismissible popup flyer the first time a visitor opens this page. They can close it and optionally hide it on later visits.'
      fields.push(hint)
    } else if (layout === 'banner') {
      const hint = document.createElement('p')
      hint.className = 'form-hint'
      hint.textContent =
        'Fills the screen below the header. The banner stays fixed while page content scrolls over it and fades into the page background. Place this block first on the page.'
      fields.push(hint)
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
            (height) => patchImage((b) => ({ ...b, height })),
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
            (height) => patchImage((b) => ({ ...b, height })),
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
            (scroll) => {
              patchImage(
                (b) => {
                  const next = { ...b, scroll }
                  if (scroll === 'fixed') {
                    next.full_width =
                      b.full_width === undefined ? true : b.full_width === true
                  } else {
                    next.full_width = undefined
                  }
                  return next
                },
                { rerender: true },
              )
            },
          ),
        ),
      )
      if ((block.scroll || 'normal') === 'fixed') {
        fields.push(
          checkboxField('Full page width', block.full_width === true, (full_width) =>
            patchImage((b) => ({ ...b, full_width })),
          ),
        )
      }
      const hint = document.createElement('p')
      hint.className = 'form-hint'
      hint.textContent =
        'Fixed backgrounds stay in place while content scrolls over them, creating a parallax-style effect. Use full page width for edge-to-edge parallax bands.'
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

  /**
   * @param {string} value
   * @param {(href: string) => void} onChange
   */
  function linkInput(value, onChange) {
    if (window.AdminLinkPicker && typeof window.AdminLinkPicker.create === 'function') {
      const picker = window.AdminLinkPicker.create({
        value,
        onChange,
        internalLinks,
        inputClass: 'page-block-input',
      })
      picker.classList.add('page-block-link-picker')
      return picker
    }
    return textInput(value, onChange, '/about or https://…')
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
      wireToolbarAddButton(btn, type, { sectionIndex })
      nestedToolbar.append(btn)
    })
    nested.append(nestedToolbar)

    sectionBlock.blocks.forEach((child, childIndex) => {
      nested.append(renderNestedBlockEditor(child, sectionIndex, childIndex))
    })
    nested.append(renderNestedDropZone(sectionIndex, sectionBlock.blocks.length))

    wireDropTarget(nested, (data) =>
      handleNestedDrop(sectionIndex, sectionBlock.blocks.length, data),
    )

    return nested
  }

  function renderNestedBlockEditor(block, sectionIndex, childIndex) {
    const indexKey = `${sectionIndex}-${childIndex}`
    const card = document.createElement('article')
    card.className = 'page-block-card page-block-card-nested'
    card.dataset.blockIndex = indexKey
    if (collapsedBlocks.has(indexKey)) card.classList.add('is-collapsed')
    if (activeBlockIndex === indexKey) card.classList.add('page-block-card--active')

    wireDropTarget(card, (data) => handleNestedDrop(sectionIndex, childIndex, data))

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

    wireDropTarget(card, (data) => handleTopLevelDrop(index, data))

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
        textSizeColorRow(
          block.eyebrow_size,
          block.eyebrow_color,
          (eyebrow_size) => updateBlock(index, (b) => ({ ...b, eyebrow_size })),
          (eyebrow_color) => updateBlock(index, (b) => ({ ...b, eyebrow_color })),
        ),
        field('Headline', textInput(block.title, (title) => {
          updateBlock(index, (b) => {
            const next = { ...b, title }
            updateSummaryText(card, next)
            return next
          })
        })),
        textSizeColorRow(
          block.title_size,
          block.title_color,
          (title_size) => updateBlock(index, (b) => ({ ...b, title_size })),
          (title_color) => updateBlock(index, (b) => ({ ...b, title_color })),
        ),
        field('Lead paragraph', textArea(block.lead, (lead) => {
          updateBlock(index, (b) => {
            const next = { ...b, lead }
            updateSummaryText(card, next)
            return next
          })
        }, 4)),
        textSizeColorRow(
          block.lead_size,
          block.lead_color,
          (lead_size) => updateBlock(index, (b) => ({ ...b, lead_size })),
          (lead_color) => updateBlock(index, (b) => ({ ...b, lead_color })),
        ),
        field(
          'Primary button label',
          textInput(block.cta_primary_label, (cta_primary_label) =>
            updateBlock(index, (b) => ({ ...b, cta_primary_label })),
          ),
        ),
        field(
          'Primary button link',
          linkInput(block.cta_primary_href, (cta_primary_href) =>
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
          linkInput(block.cta_secondary_href, (cta_secondary_href) =>
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
    } else if (block.type === 'benefits_grid') {
      body.append(
        field('Section title', textInput(block.title || '', (title) => {
          updateBlock(index, (b) => {
            const next = { ...b, title }
            updateSummaryText(card, next)
            return next
          })
        })),
      )
      block.items.forEach((item, itemIndex) => {
        const row = document.createElement('div')
        row.className = 'page-block-repeat-row'
        row.append(
          field(`Benefit ${itemIndex + 1} title`, textInput(item.title, (title) => {
            updateBlock(index, (b) => {
              const items = b.items.map((it, i) => (i === itemIndex ? { ...it, title } : it))
              const next = { ...b, items }
              updateSummaryText(card, next)
              return next
            })
          })),
          field(`Benefit ${itemIndex + 1} body`, textArea(item.body, (bodyText) => {
            updateBlock(index, (b) => {
              const items = b.items.map((it, i) => (i === itemIndex ? { ...it, body: bodyText } : it))
              return { ...b, items }
            })
          }, 2)),
        )
        const remove = document.createElement('button')
        remove.type = 'button'
        remove.className = 'btn btn-secondary btn-sm'
        remove.textContent = 'Remove benefit'
        remove.addEventListener('click', () => {
          updateBlock(index, (b) => ({ ...b, items: b.items.filter((_, i) => i !== itemIndex) }))
          render()
        })
        row.append(remove)
        body.append(row)
      })
      const addBenefit = document.createElement('button')
      addBenefit.type = 'button'
      addBenefit.className = 'btn btn-secondary btn-sm'
      addBenefit.textContent = '+ Add benefit'
      addBenefit.addEventListener('click', () => {
        updateBlock(index, (b) => ({
          ...b,
          items: [...b.items, { title: 'Benefit title', body: 'Short description.' }],
        }))
        render()
      })
      body.append(addBenefit)
    } else if (block.type === 'stats_panel') {
      block.items.forEach((item, itemIndex) => {
        const row = document.createElement('div')
        row.className = 'page-block-repeat-row'
        row.append(
          field(`Stat ${itemIndex + 1} value`, textInput(item.value, (value) => {
            updateBlock(index, (b) => {
              const items = b.items.map((it, i) => (i === itemIndex ? { ...it, value } : it))
              return { ...b, items }
            })
          })),
          field(`Stat ${itemIndex + 1} label`, textInput(item.label, (label) => {
            updateBlock(index, (b) => {
              const items = b.items.map((it, i) => (i === itemIndex ? { ...it, label } : it))
              return { ...b, items }
            })
          })),
        )
        const remove = document.createElement('button')
        remove.type = 'button'
        remove.className = 'btn btn-secondary btn-sm'
        remove.textContent = 'Remove stat'
        remove.addEventListener('click', () => {
          updateBlock(index, (b) => ({ ...b, items: b.items.filter((_, i) => i !== itemIndex) }))
          render()
        })
        row.append(remove)
        body.append(row)
      })
      const addStat = document.createElement('button')
      addStat.type = 'button'
      addStat.className = 'btn btn-secondary btn-sm'
      addStat.textContent = '+ Add stat'
      addStat.addEventListener('click', () => {
        updateBlock(index, (b) => ({
          ...b,
          items: [...b.items, { value: 'New', label: 'Label' }],
        }))
        render()
      })
      body.append(addStat)
    } else if (block.type === 'member_types') {
      body.append(
        field('Section title', textInput(block.title || '', (title) => {
          updateBlock(index, (b) => {
            const next = { ...b, title }
            updateSummaryText(card, next)
            return next
          })
        })),
      )
      const help = document.createElement('p')
      help.className = 'admin-help'
      help.innerHTML =
        'Types are managed in <a href="/admin/content/member-types">Membership types</a>.'
      body.append(help)
    } else if (block.type === 'newsletter_panel') {
      body.append(
        field('Title', textInput(block.title, (title) => {
          updateBlock(index, (b) => {
            const next = { ...b, title }
            updateSummaryText(card, next)
            return next
          })
        })),
        field('Body', textArea(block.body, (bodyText) => {
          updateBlock(index, (b) => ({ ...b, body: bodyText }))
        }, 3)),
        field('Consent hint', textArea(block.consent_hint, (consent_hint) => {
          updateBlock(index, (b) => ({ ...b, consent_hint }))
        }, 2)),
        field('Button label', textInput(block.button_label, (button_label) => {
          updateBlock(index, (b) => ({ ...b, button_label }))
        })),
      )
    } else if (block.type === 'contact_form') {
      body.append(
        field('Name label', textInput(block.name_label, (name_label) => {
          updateBlock(index, (b) => ({ ...b, name_label }))
        })),
        field('Email label', textInput(block.email_label, (email_label) => {
          updateBlock(index, (b) => ({ ...b, email_label }))
        })),
        field('Message label', textInput(block.message_label, (message_label) => {
          updateBlock(index, (b) => ({ ...b, message_label }))
        })),
        field('Submit button label', textInput(block.submit_label, (submit_label) => {
          updateBlock(index, (b) => ({ ...b, submit_label }))
        })),
      )
    }

    card.append(body)
    return card
  }

  function render() {
    root.replaceChildren()
    root.append(renderToolbar())

    if (blocks.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'page-blocks-empty-drop'
      const hint = document.createElement('p')
      hint.className = 'admin-help'
      hint.textContent = isHomePage
        ? 'No home page blocks yet. Drag a block type from the toolbar above into this area, or click a button to add at the end.'
        : 'No content blocks yet. Drag a block type from the toolbar above into this area, or click a button to add at the end.'
      empty.append(hint)
      wireDropTarget(empty, (data) => handleTopLevelDrop(0, data))
      root.append(empty)
    } else {
      blocks.forEach((block, index) => {
        root.append(renderBlockEditor(block, index))
      })
      root.append(renderDropZone(blocks.length, 'Drop here to add at the end'))
    }

    syncHidden({ immediate: true })
    wireAssetPickerSync()
  }

  parseInitial()

  try {
    const draftRaw = sessionStorage.getItem(draftStorageKey)
    if (draftRaw) {
      const draft = JSON.parse(draftRaw)
      if (
        draft &&
        Array.isArray(draft.blocks) &&
        JSON.stringify(draft.blocks) !== JSON.stringify(blocks) &&
        window.confirm('Restore unsaved draft for this page?')
      ) {
        blocks = draft.blocks
        if (titleInput instanceof HTMLInputElement && typeof draft.title === 'string') {
          titleInput.value = draft.title
        }
        if (metaInput instanceof HTMLInputElement && typeof draft.meta === 'string') {
          metaInput.value = draft.meta
        }
      }
    }
  } catch {
    // Ignore draft restore errors.
  }

  initCollapsedState()
  render()
  savedSnapshot = currentSnapshot()
  isDirty = false
  const unsavedBanner = document.getElementById('page-edit-unsaved')
  if (unsavedBanner) unsavedBanner.hidden = true

  root.addEventListener('focusin', (event) => {
    const target = event.target
    if (target instanceof HTMLButtonElement) return
    const card =
      target instanceof Element ? target.closest('[data-block-index]') : null
    if (!(card instanceof HTMLElement)) return
    const index = card.getAttribute('data-block-index')
    if (!index || index === activeBlockIndex) return
    activeBlockIndex = index
    updateSelectionUi({ skipPreviewHighlight: true })
  })

  if (previewFrame instanceof HTMLIFrameElement) {
    previewFrame.addEventListener('load', () => {
      wirePreviewFrame()
      if (activeBlockIndex) highlightPreviewBlock(activeBlockIndex)
    })
  }

  form?.addEventListener('submit', (event) => {
    syncHidden()
    if (titleInput instanceof HTMLInputElement) {
      const title = titleInput.value.trim()
      if (!title) {
        event.preventDefault()
        titleInput.setCustomValidity('Page title is required.')
        titleInput.reportValidity()
        titleInput.setCustomValidity('')
        return
      }
    }
    isDirty = false
    try {
      sessionStorage.removeItem(draftStorageKey)
    } catch {
      // Ignore.
    }
  })
  titleInput?.addEventListener('input', () => {
    markDirty()
    schedulePreview()
  })
  metaInput?.addEventListener('input', () => {
    markDirty()
    schedulePreview()
  })
  window.addEventListener('beforeunload', (event) => {
    if (!isDirty) return
    event.preventDefault()
    event.returnValue = ''
  })
  window.initPagePreviewMode()
  }

  window.initPageBlocksEditor()
  window.initPagePreviewMode()
})()
