(function () {
  const root = document.getElementById('page-blocks-editor')
  const hiddenInput = document.getElementById('body_json')
  if (!(root instanceof HTMLElement) || !(hiddenInput instanceof HTMLInputElement)) return

  /** @typedef {'left' | 'center' | 'right'} TextAlign */

  /** @typedef {{ type: 'heading', text: string, level: 2 | 3 | 4, align: TextAlign }} HeadingBlock */
  /** @typedef {{ type: 'text', body: string, align?: TextAlign }} TextBlock */
  /** @typedef {{ type: 'list', ordered: boolean, items: string[] }} ListBlock */
  /** @typedef {{ type: 'callout', title?: string, body: string, style: 'default' | 'muted' | 'accent' }} CalloutBlock */
  /** @typedef {{ type: 'section', title?: string, muted?: boolean, blocks: PageBlock[] }} SectionBlock */
  /** @typedef {HeadingBlock | TextBlock | ListBlock | CalloutBlock | SectionBlock} PageBlock */

  /** @type {PageBlock[]} */
  let blocks = []

  function parseInitial() {
    const raw = root.dataset.initial || '[]'
    try {
      const parsed = JSON.parse(raw)
      blocks = Array.isArray(parsed) ? parsed : []
    } catch {
      blocks = []
    }
  }

  function syncHidden() {
    hiddenInput.value = JSON.stringify(blocks)
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
        return { type: 'section', title: 'Section', muted: false, blocks: [{ type: 'text', body: '' }] }
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

  function updateBlock(index, next) {
    blocks = blocks.map((block, i) => (i === index ? next : block))
    syncHidden()
  }

  function renderToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'page-blocks-toolbar'
    ;[
      ['heading', 'Heading'],
      ['text', 'Paragraph'],
      ['list', 'List'],
      ['callout', 'Callout box'],
      ['section', 'Section'],
    ].forEach(([type, label]) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn btn-secondary btn-sm'
      btn.textContent = `+ ${label}`
      btn.addEventListener('click', () => {
        blocks = [...blocks, defaultBlock(type)]
        render()
      })
      toolbar.append(btn)
    })
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

  function alignSelect(value, onChange) {
    const select = document.createElement('select')
    select.className = 'page-block-select'
    ;[
      ['left', 'Left'],
      ['center', 'Center'],
      ['right', 'Right'],
    ].forEach(([val, label]) => {
      const option = document.createElement('option')
      option.value = val
      option.textContent = label
      if (value === val) option.selected = true
      select.append(option)
    })
    select.addEventListener('change', () => onChange(select.value))
    return select
  }

  function field(labelText, control) {
    const wrap = document.createElement('div')
    wrap.className = 'page-block-field'
    const label = document.createElement('label')
    label.textContent = labelText
    wrap.append(label, control)
    return wrap
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
    ].forEach(([type, label]) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn btn-secondary btn-sm'
      btn.textContent = `+ ${label}`
      btn.addEventListener('click', () => {
        const next = {
          ...sectionBlock,
          blocks: [...sectionBlock.blocks, defaultBlock(type)],
        }
        updateBlock(sectionIndex, next)
        render()
      })
      nestedToolbar.append(btn)
    })
    nested.append(nestedToolbar)

    sectionBlock.blocks.forEach((child, childIndex) => {
      const card = document.createElement('div')
      card.className = 'page-block-card page-block-card-nested'
      card.append(renderNestedBlockEditor(child, sectionIndex, childIndex))
      nested.append(card)
    })

    return nested
  }

  function renderNestedBlockEditor(block, sectionIndex, childIndex) {
    const wrap = document.createElement('div')

    function updateChild(next) {
      const section = blocks[sectionIndex]
      if (section.type !== 'section') return
      const nextBlocks = section.blocks.map((item, i) => (i === childIndex ? next : item))
      updateBlock(sectionIndex, { ...section, blocks: nextBlocks })
    }

    const header = document.createElement('div')
    header.className = 'page-block-card-header'
    header.innerHTML = `<strong>${block.type}</strong>`
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'btn btn-secondary btn-sm'
    remove.textContent = 'Remove'
    remove.addEventListener('click', () => {
      const section = blocks[sectionIndex]
      if (section.type !== 'section') return
      updateBlock(sectionIndex, {
        ...section,
        blocks: section.blocks.filter((_, i) => i !== childIndex),
      })
      render()
    })
    header.append(remove)
    wrap.append(header)

    if (block.type === 'heading') {
      wrap.append(
        field('Text', textInput(block.text, (text) => updateChild({ ...block, text }))),
        field(
          'Level',
          (() => {
            const select = document.createElement('select')
            select.className = 'page-block-select'
            ;[2, 3, 4].forEach((level) => {
              const option = document.createElement('option')
              option.value = String(level)
              option.textContent = `H${level}`
              if (block.level === level) option.selected = true
              select.append(option)
            })
            select.addEventListener('change', () =>
              updateChild({ ...block, level: Number(select.value) }),
            )
            return select
          })(),
        ),
        field(
          'Alignment',
          alignSelect(block.align, (align) => updateChild({ ...block, align })),
        ),
      )
    } else if (block.type === 'text') {
      wrap.append(
        field('Paragraph', textArea(block.body, (body) => updateChild({ ...block, body }), 4)),
        field(
          'Alignment',
          alignSelect(block.align || 'left', (align) => updateChild({ ...block, align })),
        ),
      )
    } else if (block.type === 'list') {
      const itemsArea = textArea(block.items.join('\n'), (value) => {
        const items = value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        updateChild({ ...block, items: items.length > 0 ? items : [''] })
      }, 4)
      wrap.append(
        field('List items (one per line)', itemsArea),
        field(
          'Style',
          (() => {
            const select = document.createElement('select')
            select.className = 'page-block-select'
            ;[
              ['false', 'Bulleted'],
              ['true', 'Numbered'],
            ].forEach(([val, label]) => {
              const option = document.createElement('option')
              option.value = val
              option.textContent = label
              if (String(block.ordered) === val) option.selected = true
              select.append(option)
            })
            select.addEventListener('change', () =>
              updateChild({ ...block, ordered: select.value === 'true' }),
            )
            return select
          })(),
        ),
      )
    } else if (block.type === 'callout') {
      wrap.append(
        field('Title', textInput(block.title || '', (title) => updateChild({ ...block, title }))),
        field('Body', textArea(block.body, (body) => updateChild({ ...block, body }), 4)),
        field(
          'Style',
          (() => {
            const select = document.createElement('select')
            select.className = 'page-block-select'
            ;[
              ['default', 'Default'],
              ['muted', 'Muted'],
              ['accent', 'Accent'],
            ].forEach(([val, label]) => {
              const option = document.createElement('option')
              option.value = val
              option.textContent = label
              if (block.style === val) option.selected = true
              select.append(option)
            })
            select.addEventListener('change', () =>
              updateChild({ ...block, style: select.value }),
            )
            return select
          })(),
        ),
      )
    }

    return wrap
  }

  function renderBlockEditor(block, index) {
    const card = document.createElement('article')
    card.className = 'page-block-card'
    card.dataset.blockType = block.type

    const header = document.createElement('div')
    header.className = 'page-block-card-header'
    header.innerHTML = `<strong>${block.type}</strong>`
    header.append(renderActions(index, blocks))
    card.append(header)

    if (block.type === 'heading') {
      card.append(
        field('Text', textInput(block.text, (text) => updateBlock(index, { ...block, text }))),
        field(
          'Level',
          (() => {
            const select = document.createElement('select')
            select.className = 'page-block-select'
            ;[2, 3, 4].forEach((level) => {
              const option = document.createElement('option')
              option.value = String(level)
              option.textContent = `H${level}`
              if (block.level === level) option.selected = true
              select.append(option)
            })
            select.addEventListener('change', () =>
              updateBlock(index, { ...block, level: Number(select.value) }),
            )
            return select
          })(),
        ),
        field(
          'Alignment',
          alignSelect(block.align, (align) => updateBlock(index, { ...block, align })),
        ),
      )
    } else if (block.type === 'text') {
      card.append(
        field('Paragraph', textArea(block.body, (body) => updateBlock(index, { ...block, body }), 5)),
        field(
          'Alignment',
          alignSelect(block.align || 'left', (align) => updateBlock(index, { ...block, align })),
        ),
      )
    } else if (block.type === 'list') {
      const itemsArea = textArea(block.items.join('\n'), (value) => {
        const items = value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        updateBlock(index, { ...block, items: items.length > 0 ? items : [''] })
      }, 5)
      card.append(
        field('List items (one per line)', itemsArea),
        field(
          'Style',
          (() => {
            const select = document.createElement('select')
            select.className = 'page-block-select'
            ;[
              ['false', 'Bulleted'],
              ['true', 'Numbered'],
            ].forEach(([val, label]) => {
              const option = document.createElement('option')
              option.value = val
              option.textContent = label
              if (String(block.ordered) === val) option.selected = true
              select.append(option)
            })
            select.addEventListener('change', () =>
              updateBlock(index, { ...block, ordered: select.value === 'true' }),
            )
            return select
          })(),
        ),
      )
    } else if (block.type === 'callout') {
      card.append(
        field('Title', textInput(block.title || '', (title) => updateBlock(index, { ...block, title }))),
        field('Body', textArea(block.body, (body) => updateBlock(index, { ...block, body }), 5)),
        field(
          'Style',
          (() => {
            const select = document.createElement('select')
            select.className = 'page-block-select'
            ;[
              ['default', 'Default'],
              ['muted', 'Muted'],
              ['accent', 'Accent'],
            ].forEach(([val, label]) => {
              const option = document.createElement('option')
              option.value = val
              option.textContent = label
              if (block.style === val) option.selected = true
              select.append(option)
            })
            select.addEventListener('change', () =>
              updateBlock(index, { ...block, style: select.value }),
            )
            return select
          })(),
        ),
      )
    } else if (block.type === 'section') {
      card.append(
        field('Section title', textInput(block.title || '', (title) => updateBlock(index, { ...block, title }))),
        field(
          'Background',
          (() => {
            const label = document.createElement('label')
            label.className = 'admin-check'
            const input = document.createElement('input')
            input.type = 'checkbox'
            input.checked = block.muted === true
            input.addEventListener('change', () =>
              updateBlock(index, { ...block, muted: input.checked }),
            )
            label.append(input, ' Muted background')
            return label
          })(),
        ),
        renderNestedBlocks(block, index),
      )
    }

    return card
  }

  function render() {
    root.replaceChildren()
    root.append(renderToolbar())

    if (blocks.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'admin-help'
      empty.textContent = 'No content blocks yet. Add a heading, paragraph, list, callout, or section.'
      root.append(empty)
    } else {
      blocks.forEach((block, index) => {
        root.append(renderBlockEditor(block, index))
      })
    }

    syncHidden()
  }

  parseInitial()
  render()

  const form = hiddenInput.closest('form')
  form?.addEventListener('submit', syncHidden)
})()
