import { Node, mergeAttributes } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/core'

export type ImagePlacement = 'inline' | 'float-left' | 'float-right'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dirtImage: {
      setDirtImage: (attrs: {
        src: string
        alt?: string
        caption?: string
        placement?: ImagePlacement
        widthPct?: number
      }) => ReturnType
      updateDirtImage: (attrs: Partial<{
        alt: string
        caption: string
        placement: ImagePlacement
        widthPct: number
      }>) => ReturnType
    }
  }
}

function clampWidth(pct: number | undefined): number {
  if (pct == null || Number.isNaN(pct)) return 100
  return Math.max(10, Math.min(100, Math.round(pct)))
}

const PLACEMENT_OPTIONS: Array<{ value: ImagePlacement; label: string }> = [
  { value: 'inline', label: 'Inline (in flow)' },
  { value: 'float-left', label: 'Float left' },
  { value: 'float-right', label: 'Float right' },
]

let openMenu: HTMLElement | null = null

function closePlacementMenu() {
  if (openMenu) {
    openMenu.remove()
    openMenu = null
  }
}

function showPlacementMenu(
  clientX: number,
  clientY: number,
  current: ImagePlacement,
  onPick: (placement: ImagePlacement) => void,
) {
  closePlacementMenu()
  const menu = document.createElement('div')
  menu.className = 'dirt-image-context-menu'
  menu.setAttribute('role', 'menu')

  PLACEMENT_OPTIONS.forEach((opt) => {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'dirt-image-context-menu-item'
    item.setAttribute('role', 'menuitem')
    if (opt.value === current) item.classList.add('is-active')
    item.textContent = opt.label
    item.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onPick(opt.value)
      closePlacementMenu()
    })
    menu.append(item)
  })

  document.body.append(menu)
  openMenu = menu

  const pad = 8
  const rect = menu.getBoundingClientRect()
  let left = clientX
  let top = clientY
  if (left + rect.width > window.innerWidth - pad) left = window.innerWidth - rect.width - pad
  if (top + rect.height > window.innerHeight - pad) top = window.innerHeight - rect.height - pad
  menu.style.left = `${Math.max(pad, left)}px`
  menu.style.top = `${Math.max(pad, top)}px`

  const onDoc = (event: Event) => {
    if (event.target instanceof Node && menu.contains(event.target)) return
    closePlacementMenu()
    document.removeEventListener('mousedown', onDoc, true)
    document.removeEventListener('keydown', onKey, true)
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePlacementMenu()
      document.removeEventListener('mousedown', onDoc, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }
  // Defer so the opening contextmenu event doesn't immediately close it.
  requestAnimationFrame(() => {
    document.addEventListener('mousedown', onDoc, true)
    document.addEventListener('keydown', onKey, true)
  })
}

function applyNodeAttrs(
  editor: Editor,
  getPos: () => number | undefined,
  node: ProseMirrorNode,
  next: Record<string, unknown>,
) {
  const pos = getPos()
  if (typeof pos !== 'number') return
  editor
    .chain()
    .command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...next })
      return true
    })
    .run()
}

export const DirtImage = Node.create({
  name: 'dirtImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      caption: { default: '' },
      placement: { default: 'inline' },
      widthPct: { default: 100 },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure.dirt-post-image',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false
          const img = el.querySelector('img')
          if (!img) return false
          const widthStyle = el.style.width || img.style.width
          const widthPct = widthStyle?.endsWith('%')
            ? Number.parseInt(widthStyle, 10)
            : Number(el.dataset.widthPct || 100)
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            caption: el.querySelector('figcaption')?.textContent || '',
            placement: (el.dataset.placement as ImagePlacement) || 'inline',
            widthPct: clampWidth(widthPct),
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    const placement = (node.attrs.placement as ImagePlacement) || 'inline'
    const widthPct = clampWidth(Number(node.attrs.widthPct))
    const caption = node.attrs.caption || ''
    const figureAttrs = mergeAttributes({
      class: `dirt-post-image dirt-post-image--${placement}`,
      'data-placement': placement,
      'data-width-pct': String(widthPct),
      style: `width: ${widthPct}%`,
    })
    const imgAttrs = mergeAttributes({
      src: node.attrs.src,
      alt: node.attrs.alt || '',
      loading: 'lazy',
      decoding: 'async',
    })
    if (caption) {
      return ['figure', figureAttrs, ['img', imgAttrs], ['figcaption', {}, String(caption)]]
    }
    return ['figure', figureAttrs, ['img', imgAttrs]]
  },

  addNodeView() {
    return ({ node, editor, getPos, selected }) => {
      let current = node

      const root = document.createElement('figure')
      root.className = `dirt-post-image dirt-post-image--${current.attrs.placement} is-editor`
      root.dataset.placement = current.attrs.placement
      root.dataset.widthPct = String(current.attrs.widthPct)
      root.style.width = `${current.attrs.widthPct}%`
      root.contentEditable = 'false'
      root.classList.toggle('is-selected', selected)

      const frame = document.createElement('div')
      frame.className = 'dirt-post-image-frame'

      const img = document.createElement('img')
      img.src = current.attrs.src || ''
      img.alt = current.attrs.alt || ''
      img.draggable = false

      const handle = document.createElement('span')
      handle.className = 'dirt-post-image-resize-handle'
      handle.title = 'Drag to resize'
      handle.setAttribute('aria-hidden', 'true')

      const badge = document.createElement('span')
      badge.className = 'dirt-post-image-size-badge'
      badge.textContent = `${current.attrs.widthPct}%`

      const captionEl = document.createElement('figcaption')
      captionEl.hidden = !current.attrs.caption
      captionEl.textContent = current.attrs.caption || ''

      frame.append(img, handle, badge)
      root.append(frame, captionEl)

      const syncDom = () => {
        root.className = `dirt-post-image dirt-post-image--${current.attrs.placement} is-editor`
        root.classList.toggle('is-selected', selected)
        root.dataset.placement = current.attrs.placement
        root.dataset.widthPct = String(current.attrs.widthPct)
        root.style.width = `${current.attrs.widthPct}%`
        img.src = current.attrs.src || ''
        img.alt = current.attrs.alt || ''
        badge.textContent = `${current.attrs.widthPct}%`
        captionEl.hidden = !current.attrs.caption
        captionEl.textContent = current.attrs.caption || ''
      }

      root.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const pos = getPos()
        if (typeof pos === 'number') {
          editor.chain().setNodeSelection(pos).run()
        }
        showPlacementMenu(event.clientX, event.clientY, current.attrs.placement, (placement) => {
          applyNodeAttrs(editor, getPos, current, { placement })
        })
      })

      let resizing = false
      let startX = 0
      let startWidthPct = 100
      let containerWidth = 1

      const onPointerMove = (event: PointerEvent) => {
        if (!resizing) return
        const delta = event.clientX - startX
        const deltaPct = (delta / containerWidth) * 100
        // Float-right: drag left (negative delta) should grow the image.
        const signed = current.attrs.placement === 'float-right' ? -deltaPct : deltaPct
        const next = clampWidth(startWidthPct + signed)
        root.style.width = `${next}%`
        badge.textContent = `${next}%`
        root.dataset.widthPct = String(next)
      }

      const onPointerUp = (event: PointerEvent) => {
        if (!resizing) return
        resizing = false
        try {
          frame.releasePointerCapture(event.pointerId)
        } catch {
          // ignore
        }
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        root.classList.remove('is-resizing')
        const next = clampWidth(Number.parseInt(root.dataset.widthPct || '', 10))
        applyNodeAttrs(editor, getPos, current, { widthPct: next })
      }

      const beginResize = (event: PointerEvent) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        const pos = getPos()
        if (typeof pos === 'number') {
          editor.chain().setNodeSelection(pos).run()
        }
        const parent = root.parentElement
        containerWidth = parent?.clientWidth || root.clientWidth || 1
        startX = event.clientX
        startWidthPct = clampWidth(Number(current.attrs.widthPct))
        resizing = true
        root.classList.add('is-resizing')
        frame.setPointerCapture(event.pointerId)
        document.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerup', onPointerUp)
      }

      handle.addEventListener('pointerdown', beginResize)
      // Click-drag on the photo itself also resizes.
      img.addEventListener('pointerdown', beginResize)

      return {
        dom: root,
        ignoreMutation: () => true,
        selectNode: () => {
          selected = true
          root.classList.add('is-selected')
        },
        deselectNode: () => {
          selected = false
          root.classList.remove('is-selected')
        },
        update: (updated) => {
          if (updated.type.name !== 'dirtImage') return false
          current = updated
          syncDom()
          return true
        },
        destroy: () => {
          document.removeEventListener('pointermove', onPointerMove)
          document.removeEventListener('pointerup', onPointerUp)
          closePlacementMenu()
        },
      }
    }
  },

  addCommands() {
    return {
      setDirtImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src,
              alt: attrs.alt || '',
              caption: attrs.caption || '',
              placement: attrs.placement || 'inline',
              widthPct: clampWidth(attrs.widthPct ?? 60),
            },
          }),
      updateDirtImage:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, {
            ...attrs,
            widthPct: attrs.widthPct != null ? clampWidth(attrs.widthPct) : undefined,
          }),
    }
  },
})
