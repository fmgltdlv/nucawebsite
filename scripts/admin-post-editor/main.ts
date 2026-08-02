import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
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
    btn('Image', 'Insert image — drag corner to resize, right-click for float/inline', () =>
      void insertImage(editor),
    ),
    btn('Image+Text', 'Insert image beside text', () => void insertMediaText(editor)),
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
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Placeholder.configure({ placeholder: 'Write your DIRT post…' }),
        DirtImage,
        MediaText,
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
  document.addEventListener('DOMContentLoaded', bootDirtPostEditors)
} else {
  bootDirtPostEditors()
}
