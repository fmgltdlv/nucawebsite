import { Node, mergeAttributes } from '@tiptap/core'
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
    item.addEventListener('pointerdown', (event) => {
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
    document.removeEventListener('pointerdown', onDoc, true)
    document.removeEventListener('keydown', onKey, true)
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePlacementMenu()
      document.removeEventListener('pointerdown', onDoc, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }
  requestAnimationFrame(() => {
    document.addEventListener('pointerdown', onDoc, true)
    document.addEventListener('keydown', onKey, true)
  })
}

function setImageAttrs(
  editor: Editor,
  getPos: () => number | undefined,
  next: Record<string, unknown>,
) {
  const pos = getPos()
  if (typeof pos !== 'number') return false
  return editor
    .chain()
    .command(({ tr, dispatch }) => {
      const existing = tr.doc.nodeAt(pos)
      if (!existing || existing.type.name !== 'dirtImage') return false
      if (dispatch) {
        tr.setNodeMarkup(pos, undefined, { ...existing.attrs, ...next })
      }
      return true
    })
    .run()
}

export const DirtImage = Node.create({
  name: 'dirtImage',
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      caption: { default: '' },
      placement: {
        default: 'inline' as ImagePlacement,
        parseHTML: (el) =>
          (el.getAttribute('data-placement') as ImagePlacement) || 'inline',
        renderHTML: (attrs) => ({ 'data-placement': attrs.placement || 'inline' }),
      },
      widthPct: {
        default: 100,
        parseHTML: (el) => {
          if (!(el instanceof HTMLElement)) return 100
          const widthStyle = el.style.width
          if (widthStyle?.endsWith('%')) return clampWidth(Number.parseInt(widthStyle, 10))
          return clampWidth(Number(el.getAttribute('data-width-pct') || 100))
        },
        renderHTML: (attrs) => ({
          'data-width-pct': String(clampWidth(Number(attrs.widthPct))),
          style: `width: ${clampWidth(Number(attrs.widthPct))}%`,
        }),
      },
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
          const placement = (el.dataset.placement as ImagePlacement) || 'inline'
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            caption: el.querySelector('figcaption')?.textContent || '',
            placement,
            widthPct: clampWidth(widthPct),
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const placement = (node.attrs.placement as ImagePlacement) || 'inline'
    const widthPct = clampWidth(Number(node.attrs.widthPct))
    const caption = node.attrs.caption || ''
    const figureAttrs = mergeAttributes(HTMLAttributes, {
      class: `dirt-post-image dirt-post-image--${placement}`,
      'data-placement': placement,
      'data-width-pct': String(widthPct),
      style: `width: ${widthPct}%`,
    })
    const imgAttrs = {
      src: node.attrs.src,
      alt: node.attrs.alt || '',
      loading: 'lazy',
      decoding: 'async',
    }
    if (caption) {
      return ['figure', figureAttrs, ['img', imgAttrs], ['figcaption', {}, String(caption)]]
    }
    return ['figure', figureAttrs, ['img', imgAttrs]]
  },

  addNodeView() {
    return ({ node, editor, getPos, selected }) => {
      let current = node

      const root = document.createElement('figure')
      root.contentEditable = 'false'

      const frame = document.createElement('div')
      frame.className = 'dirt-post-image-frame'

      const img = document.createElement('img')
      img.draggable = false

      const handle = document.createElement('span')
      handle.className = 'dirt-post-image-resize-handle'
      handle.title = 'Drag to resize'
      handle.setAttribute('aria-hidden', 'true')

      const badge = document.createElement('span')
      badge.className = 'dirt-post-image-size-badge'

      const captionEl = document.createElement('figcaption')

      frame.append(img, handle, badge)
      root.append(frame, captionEl)

      const syncDom = () => {
        const placement = (current.attrs.placement as ImagePlacement) || 'inline'
        const widthPct = clampWidth(Number(current.attrs.widthPct))
        root.className = `dirt-post-image dirt-post-image--${placement} is-editor`
        root.classList.toggle('is-selected', !!selected)
        root.dataset.placement = placement
        root.dataset.widthPct = String(widthPct)
        root.style.width = `${widthPct}%`
        root.style.cssFloat = placement === 'float-left' ? 'left' : placement === 'float-right' ? 'right' : ''
        root.style.float = root.style.cssFloat
        img.src = current.attrs.src || ''
        img.alt = current.attrs.alt || ''
        badge.textContent = `${widthPct}%`
        captionEl.hidden = !current.attrs.caption
        captionEl.textContent = current.attrs.caption || ''
      }
      syncDom()

      root.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        event.stopPropagation()
        const pos = getPos()
        if (typeof pos === 'number') {
          editor.chain().setNodeSelection(pos).run()
        }
        showPlacementMenu(event.clientX, event.clientY, current.attrs.placement, (placement) => {
          const patch: Record<string, unknown> = { placement }
          // Full-width floats look identical to inline — shrink so the effect is visible.
          if (placement !== 'inline' && clampWidth(Number(current.attrs.widthPct)) >= 90) {
            patch.widthPct = 45
          }
          setImageAttrs(editor, getPos, patch)
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
        setImageAttrs(editor, getPos, { widthPct: next })
      }

      const beginResize = (event: PointerEvent) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        const pos = getPos()
        if (typeof pos === 'number') {
          editor.chain().setNodeSelection(pos).run()
        }
        const parent = root.closest('.ProseMirror') || root.parentElement
        containerWidth = parent instanceof HTMLElement ? parent.clientWidth : root.clientWidth || 1
        startX = event.clientX
        startWidthPct = clampWidth(Number(current.attrs.widthPct))
        resizing = true
        root.classList.add('is-resizing')
        frame.setPointerCapture(event.pointerId)
        document.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerup', onPointerUp)
      }

      handle.addEventListener('pointerdown', beginResize)
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
