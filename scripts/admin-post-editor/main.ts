import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { DirtImage } from './dirt-image'
import { Carousel } from './carousel'

const COLORS = [
  { label: 'Default', value: '' },
  { label: 'Ink', value: '#1a1a1a' },
  { label: 'Muted', value: '#5c5c5c' },
  { label: 'Accent', value: '#b45309' },
  { label: 'Primary', value: '#0f3d68' },
  { label: 'White', value: '#ffffff' },
]

const HIGHLIGHTS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Amber', value: '#fde68a' },
  { label: 'Sky', value: '#bae6fd' },
  { label: 'Mint', value: '#bbf7d0' },
]

/** Font stacks must stay in sync with sanitize-html ALLOWED_FONT_FAMILIES. */
const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Body (theme)', value: 'var(--font-sans)' },
  { label: 'Display (theme)', value: 'var(--font-display)' },
  { label: 'Instrument Serif', value: "'Instrument Serif', Georgia, serif" },
  { label: 'DM Sans', value: "'DM Sans', system-ui, sans-serif" },
  { label: 'Source Serif', value: "'Source Serif 4', Georgia, serif" },
  { label: 'Source Sans', value: "'Source Sans 3', system-ui, sans-serif" },
  { label: 'Inter', value: "'Inter', system-ui, sans-serif" },
  { label: 'Barlow', value: "'Barlow', system-ui, sans-serif" },
  { label: 'Barlow Condensed', value: "'Barlow Condensed', 'Barlow', system-ui, sans-serif" },
  { label: 'Bebas Neue', value: "'Bebas Neue', 'Barlow', system-ui, sans-serif" },
  { label: 'Fraunces', value: "'Fraunces', Georgia, serif" },
  { label: 'Outfit', value: "'Outfit', system-ui, sans-serif" },
  { label: 'Oswald', value: "'Oswald', 'Work Sans', system-ui, sans-serif" },
  { label: 'Work Sans', value: "'Work Sans', system-ui, sans-serif" },
]

function btn(label: string, title: string, onClick: () => void, isActive?: () => boolean) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'dirt-editor-btn'
  el.textContent = label
  el.title = title
  el.addEventListener('click', (event) => {
    event.preventDefault()
    onClick()
  })
  if (isActive) {
    el.dataset.activeFn = '1'
    ;(el as HTMLButtonElement & { _isActive?: () => boolean })._isActive = isActive
  }
  return el
}

function selectControl(
  options: Array<{ label: string; value: string }>,
  onChange: (value: string) => void,
  title: string,
) {
  const el = document.createElement('select')
  el.className = 'dirt-editor-select'
  if (title === 'Font') el.classList.add('dirt-editor-select--font')
  el.title = title
  options.forEach((opt) => {
    const o = document.createElement('option')
    o.value = opt.value
    o.textContent = opt.label
    if (opt.value) o.style.fontFamily = opt.value
    el.append(o)
  })
  el.addEventListener('change', () => onChange(el.value))
  return el
}

function promptLink(editor: Editor) {
  const prev = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('Link URL', prev || 'https://')
  if (url === null) return
  if (url.trim() === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
}

function toggleUnderline(editor: Editor) {
  editor.chain().focus().toggleUnderline().run()
}

async function insertImage(editor: Editor) {
  const asset = await window.pickLibraryAsset?.('image')
  if (!asset) return
  editor
    .chain()
    .focus()
    .setDirtImage({
      src: asset.url,
      alt: asset.label || '',
      placement: 'inline',
      widthPct: 60,
    })
    .run()
}

function buildToolbar(editor: Editor, toolbar: HTMLElement) {
  toolbar.innerHTML = ''

  const makeGroup = () => {
    const g = document.createElement('div')
    g.className = 'dirt-editor-toolbar-group'
    toolbar.append(g)
    return g
  }

  makeGroup().append(
    btn('B', 'Bold', () => editor.chain().focus().toggleBold().run(), () => editor.isActive('bold')),
    btn('I', 'Italic', () => editor.chain().focus().toggleItalic().run(), () => editor.isActive('italic')),
    btn('U', 'Underline', () => toggleUnderline(editor), () => editor.isActive('underline')),
    btn('S', 'Strikethrough', () => editor.chain().focus().toggleStrike().run(), () =>
      editor.isActive('strike'),
    ),
  )

  makeGroup().append(
    btn('H2', 'Heading 2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), () =>
      editor.isActive('heading', { level: 2 }),
    ),
    btn('H3', 'Heading 3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), () =>
      editor.isActive('heading', { level: 3 }),
    ),
    btn('• List', 'Bullet list', () => editor.chain().focus().toggleBulletList().run(), () =>
      editor.isActive('bulletList'),
    ),
    btn('1. List', 'Numbered list', () => editor.chain().focus().toggleOrderedList().run(), () =>
      editor.isActive('orderedList'),
    ),
    btn('Quote', 'Blockquote', () => editor.chain().focus().toggleBlockquote().run(), () =>
      editor.isActive('blockquote'),
    ),
    btn('—', 'Horizontal rule', () => editor.chain().focus().setHorizontalRule().run()),
  )

  makeGroup().append(
    btn('Link', 'Add/edit link', () => promptLink(editor), () => editor.isActive('link')),
    btn('Left', 'Align left', () => editor.chain().focus().setTextAlign('left').run(), () =>
      editor.isActive({ textAlign: 'left' }),
    ),
    btn('Center', 'Align center', () => editor.chain().focus().setTextAlign('center').run(), () =>
      editor.isActive({ textAlign: 'center' }),
    ),
    btn('Right', 'Align right', () => editor.chain().focus().setTextAlign('right').run(), () =>
      editor.isActive({ textAlign: 'right' }),
    ),
  )

  const g4 = makeGroup()
  g4.append(
    selectControl(
      FONTS.map((f) => ({ label: f.label, value: f.value })),
      (value) => {
        if (!value) editor.chain().focus().unsetFontFamily().run()
        else editor.chain().focus().setFontFamily(value).run()
      },
      'Font',
    ),
    selectControl(
      COLORS.map((c) => ({ label: c.label, value: c.value })),
      (value) => {
        if (!value) editor.chain().focus().unsetColor().run()
        else editor.chain().focus().setColor(value).run()
      },
      'Text color',
    ),
    selectControl(
      HIGHLIGHTS.map((c) => ({ label: c.label, value: c.value })),
      (value) => {
        if (!value) editor.chain().focus().unsetHighlight().run()
        else editor.chain().focus().toggleHighlight({ color: value }).run()
      },
      'Highlight',
    ),
  )

  makeGroup().append(
    btn('Image', 'Insert image — drag to resize, right-click for float/inline', () =>
      void insertImage(editor),
    ),
  )

  const refresh = () => {
    toolbar.querySelectorAll<HTMLButtonElement>('.dirt-editor-btn').forEach((button) => {
      const activeFn = (button as HTMLButtonElement & { _isActive?: () => boolean })._isActive
      if (!activeFn) return
      button.classList.toggle('is-active', !!activeFn())
    })
  }

  editor.on('selectionUpdate', refresh)
  editor.on('transaction', refresh)
  refresh()
}

export function initDirtPostEditor(root: HTMLElement) {
  if (root.dataset.dirtEditorReady === '1') return null
  const toolbar = root.querySelector('[data-dirt-editor-toolbar]')
  const mount = root.querySelector('[data-dirt-editor-mount]')
  const hidden = root.querySelector('[data-dirt-editor-input]')
  if (
    !(toolbar instanceof HTMLElement) ||
    !(mount instanceof HTMLElement) ||
    !(hidden instanceof HTMLInputElement || hidden instanceof HTMLTextAreaElement)
  ) {
    return null
  }

  const initial = hidden.value || '<p></p>'

  try {
    const editor = new Editor({
      element: mount,
      extensions: [
        // TipTap v3 StarterKit already includes underline + link — configure, don't duplicate.
        StarterKit.configure({
          heading: { levels: [2, 3] },
          link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
        }),
        TextStyle,
        Color,
        FontFamily,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Placeholder.configure({ placeholder: 'Write your DIRT post…' }),
        DirtImage,
        // Keep Carousel for reading older posts; insert UI removed.
        Carousel,
      ],
      content: initial,
      onUpdate: ({ editor: current }) => {
        hidden.value = current.getHTML()
      },
    })

    root.dataset.dirtEditorReady = '1'
    hidden.value = editor.getHTML()
    buildToolbar(editor, toolbar)

    const form = root.closest('form')
    form?.addEventListener('submit', () => {
      hidden.value = editor.getHTML()
    })

    return editor
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Editor failed to load.'
    toolbar.innerHTML = `<p class="admin-flash admin-flash-error">${message}</p>`
    console.error('DIRT post editor failed to initialize', error)
    return null
  }
}

function bootDirtPostEditors() {
  document.querySelectorAll<HTMLElement>('[data-dirt-post-editor]').forEach((root) => {
    initDirtPostEditor(root)
  })
}

function initCoverEditors() {
  document.querySelectorAll<HTMLElement>('[data-cover-editor]').forEach((root) => {
    if (root.dataset.coverEditorReady === '1') return
    root.dataset.coverEditorReady = '1'

    const picker = root.querySelector('[data-asset-picker]')
    const size = root.querySelector('[data-cover-size]')
    const preview = root.querySelector('[data-cover-size-preview]')
    const img = root.querySelector('[data-cover-size-image]')
    const input = root.querySelector('[data-cover-width-input]')
    const label = root.querySelector('[data-cover-width-label]')
    const badge = root.querySelector('[data-cover-size-badge]')
    const pickerValue = root.querySelector('[data-asset-picker-value]')
    const removeCheckbox = root.querySelector('[data-asset-picker-remove]')

    if (
      !(size instanceof HTMLElement) ||
      !(preview instanceof HTMLElement) ||
      !(img instanceof HTMLImageElement) ||
      !(input instanceof HTMLInputElement)
    ) {
      return
    }

    const applyWidth = () => {
      const pct = Math.max(20, Math.min(100, Number.parseInt(input.value, 10) || 100))
      input.value = String(pct)
      preview.style.width = `${pct}%`
      if (label) label.textContent = `${pct}%`
      if (badge) badge.textContent = `${pct}%`
    }

    const syncVisibility = () => {
      if (removeCheckbox instanceof HTMLInputElement && removeCheckbox.checked) {
        size.hidden = true
        return
      }
      const key = pickerValue instanceof HTMLInputElement ? pickerValue.value.trim() : ''
      const pickerImg = picker?.querySelector('[data-asset-picker-preview-image]')
      const url =
        pickerImg instanceof HTMLImageElement && pickerImg.src
          ? pickerImg.src
          : key
            ? `/assets/${key}`
            : ''
      if (!key || !url) {
        size.hidden = true
        return
      }
      size.hidden = false
      img.hidden = false
      if (img.src !== url) img.src = url
    }

    input.addEventListener('input', applyWidth)
    removeCheckbox?.addEventListener('change', syncVisibility)
    picker?.querySelector('[data-asset-picker-clear]')?.addEventListener('click', () => {
      queueMicrotask(syncVisibility)
    })

    const dialog = document.getElementById('asset-library-dialog')
    dialog?.addEventListener('close', () => queueMicrotask(syncVisibility))

    const pickerPreview = picker?.querySelector('[data-asset-picker-preview]')
    if (pickerPreview) {
      new MutationObserver(syncVisibility).observe(pickerPreview, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    }

    applyWidth()
    syncVisibility()
  })
}

function bootAdminPostPage() {
  bootDirtPostEditors()
  initCoverEditors()
}

declare global {
  interface Window {
    initDirtPostEditor?: typeof initDirtPostEditor
    pickLibraryAsset?: (kind?: 'image' | 'pdf') => Promise<{
      key: string
      url: string
      label: string
    } | null>
  }
}

window.initDirtPostEditor = initDirtPostEditor

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAdminPostPage)
} else {
  bootAdminPostPage()
}
