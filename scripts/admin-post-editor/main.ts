import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { DirtImage } from './dirt-image'
import { MediaText } from './media-text'
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

const WIDTH_PRESETS = [
  { label: 'Small', pct: 25 },
  { label: 'Medium', pct: 40 },
  { label: 'Large', pct: 60 },
  { label: 'Full', pct: 100 },
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
  el.title = title
  options.forEach((opt) => {
    const o = document.createElement('option')
    o.value = opt.value
    o.textContent = opt.label
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

async function insertImage(editor: Editor) {
  const asset = await window.pickLibraryAsset?.('image')
  if (!asset) return
  const placement = window.prompt('Placement: inline, float-left, or float-right', 'inline') || 'inline'
  const widthRaw = window.prompt('Width % (or small/medium/large/full)', '100') || '100'
  let widthPct = 100
  const preset = WIDTH_PRESETS.find((p) => p.label.toLowerCase() === widthRaw.trim().toLowerCase())
  if (preset) widthPct = preset.pct
  else {
    const n = Number.parseInt(widthRaw, 10)
    if (!Number.isNaN(n)) widthPct = Math.max(10, Math.min(100, n))
  }
  editor
    .chain()
    .focus()
    .setDirtImage({
      src: asset.url,
      alt: asset.label || '',
      placement: (['inline', 'float-left', 'float-right'].includes(placement)
        ? placement
        : 'inline') as 'inline' | 'float-left' | 'float-right',
      widthPct,
    })
    .run()
}

async function insertMediaText(editor: Editor) {
  const asset = await window.pickLibraryAsset?.('image')
  if (!asset) return
  editor
    .chain()
    .focus()
    .setMediaText({
      src: asset.url,
      alt: asset.label || '',
      body: '',
      position: 'left',
      imageWidthPct: 40,
    })
    .run()
}

async function insertCarousel(editor: Editor) {
  const slides: Array<{ src: string; alt?: string }> = []
  for (let i = 0; i < 8; i++) {
    const asset = await window.pickLibraryAsset?.('image')
    if (!asset) break
    slides.push({ src: asset.url, alt: asset.label || '' })
    if (slides.length >= 2) {
      const more = window.confirm('Add another slide?')
      if (!more) break
    }
  }
  if (slides.length < 2) {
    window.alert('A carousel needs at least 2 images.')
    return
  }
  editor.chain().focus().setCarousel({ slides }).run()
}

function buildToolbar(editor: Editor, toolbar: HTMLElement) {
  toolbar.innerHTML = ''
  const groups: HTMLElement[] = []

  const makeGroup = () => {
    const g = document.createElement('div')
    g.className = 'dirt-editor-toolbar-group'
    groups.push(g)
    toolbar.append(g)
    return g
  }

  const g1 = makeGroup()
  g1.append(
    btn('B', 'Bold', () => editor.chain().focus().toggleBold().run(), () => editor.isActive('bold')),
    btn('I', 'Italic', () => editor.chain().focus().toggleItalic().run(), () => editor.isActive('italic')),
    btn('U', 'Underline', () => editor.chain().focus().toggleUnderline().run(), () =>
      editor.isActive('underline'),
    ),
    btn('S', 'Strikethrough', () => editor.chain().focus().toggleStrike().run(), () =>
      editor.isActive('strike'),
    ),
  )

  const g2 = makeGroup()
  g2.append(
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

  const g3 = makeGroup()
  g3.append(
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
  const colorSelect = selectControl(
    COLORS.map((c) => ({ label: c.label, value: c.value })),
    (value) => {
      if (!value) editor.chain().focus().unsetColor().run()
      else editor.chain().focus().setColor(value).run()
    },
    'Text color',
  )
  const highlightSelect = selectControl(
    HIGHLIGHTS.map((c) => ({ label: c.label, value: c.value })),
    (value) => {
      if (!value) editor.chain().focus().unsetHighlight().run()
      else editor.chain().focus().toggleHighlight({ color: value }).run()
    },
    'Highlight',
  )
  g4.append(colorSelect, highlightSelect)

  const g5 = makeGroup()
  g5.append(
    btn('Image', 'Insert image', () => void insertImage(editor)),
    btn('Image+Text', 'Insert image beside text', () => void insertMediaText(editor)),
    btn('Carousel', 'Insert image carousel', () => void insertCarousel(editor)),
  )

  const imageControls = document.createElement('div')
  imageControls.className = 'dirt-editor-toolbar-group dirt-editor-image-controls'
  imageControls.hidden = true
  const widthPreset = selectControl(
    [
      { label: 'Width…', value: '' },
      ...WIDTH_PRESETS.map((p) => ({ label: p.label, value: String(p.pct) })),
      { label: 'Custom %', value: 'custom' },
    ],
    (value) => {
      if (!editor.isActive('dirtImage')) return
      if (value === 'custom') {
        const raw = window.prompt('Custom width %', '50')
        const n = Number.parseInt(raw || '', 10)
        if (!Number.isNaN(n)) editor.chain().focus().updateDirtImage({ widthPct: n }).run()
        return
      }
      if (value) editor.chain().focus().updateDirtImage({ widthPct: Number(value) }).run()
    },
    'Image width',
  )
  const placement = selectControl(
    [
      { label: 'Inline', value: 'inline' },
      { label: 'Float left', value: 'float-left' },
      { label: 'Float right', value: 'float-right' },
    ],
    (value) => {
      if (!editor.isActive('dirtImage')) return
      editor
        .chain()
        .focus()
        .updateDirtImage({ placement: value as 'inline' | 'float-left' | 'float-right' })
        .run()
    },
    'Image placement',
  )
  imageControls.append(widthPreset, placement)
  toolbar.append(imageControls)

  const refresh = () => {
    toolbar.querySelectorAll<HTMLButtonElement>('.dirt-editor-btn').forEach((button) => {
      const activeFn = (button as HTMLButtonElement & { _isActive?: () => boolean })._isActive
      if (!activeFn) return
      button.classList.toggle('is-active', !!activeFn())
    })
    const onImage = editor.isActive('dirtImage')
    imageControls.hidden = !onImage
  }

  editor.on('selectionUpdate', refresh)
  editor.on('transaction', refresh)
  refresh()
}

export function initDirtPostEditor(root: HTMLElement) {
  const toolbar = root.querySelector('[data-dirt-editor-toolbar]')
  const mount = root.querySelector('[data-dirt-editor-mount]')
  const hidden = root.querySelector('[data-dirt-editor-input]')
  if (!(toolbar instanceof HTMLElement) || !(mount instanceof HTMLElement) || !(hidden instanceof HTMLInputElement || hidden instanceof HTMLTextAreaElement)) {
    return null
  }

  const initial = hidden.value || '<p></p>'

  const editor = new Editor({
    element: mount,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Write your DIRT post…' }),
      DirtImage,
      MediaText,
      Carousel,
    ],
    content: initial,
    onUpdate: ({ editor: current }) => {
      hidden.value = current.getHTML()
    },
  })

  hidden.value = editor.getHTML()
  buildToolbar(editor, toolbar)

  const form = root.closest('form')
  form?.addEventListener('submit', () => {
    hidden.value = editor.getHTML()
  })

  return editor
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLElement>('[data-dirt-post-editor]').forEach((root) => {
    initDirtPostEditor(root)
  })
})
