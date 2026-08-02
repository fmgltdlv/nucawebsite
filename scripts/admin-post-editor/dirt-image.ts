import { Node, mergeAttributes } from '@tiptap/core'

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

  renderHTML({ HTMLAttributes }) {
    const placement = (HTMLAttributes.placement as ImagePlacement) || 'inline'
    const widthPct = clampWidth(Number(HTMLAttributes.widthPct))
    const caption = HTMLAttributes.caption || ''
    const figureAttrs = mergeAttributes({
      class: `dirt-post-image dirt-post-image--${placement}`,
      'data-placement': placement,
      'data-width-pct': String(widthPct),
      style: `width: ${widthPct}%`,
    })
    const imgAttrs = mergeAttributes({
      src: HTMLAttributes.src,
      alt: HTMLAttributes.alt || '',
      loading: 'lazy',
      decoding: 'async',
    })
    if (caption) {
      return ['figure', figureAttrs, ['img', imgAttrs], ['figcaption', {}, String(caption)]]
    }
    return ['figure', figureAttrs, ['img', imgAttrs]]
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
              widthPct: clampWidth(attrs.widthPct),
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
