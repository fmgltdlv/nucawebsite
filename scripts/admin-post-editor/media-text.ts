import { Node, mergeAttributes } from '@tiptap/core'

export type MediaPosition = 'left' | 'right' | 'above' | 'below'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaText: {
      setMediaText: (attrs: {
        src: string
        alt?: string
        caption?: string
        body?: string
        position?: MediaPosition
        imageWidthPct?: number
      }) => ReturnType
    }
  }
}

function clampWidth(pct: number | undefined): number {
  if (pct == null || Number.isNaN(pct)) return 40
  return Math.max(20, Math.min(70, Math.round(pct)))
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bodyToHtml(body: string): string {
  const paragraphs = body.trim() ? body.split(/\n\n+/) : ['']
  return paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('')
}

export const MediaText = Node.create({
  name: 'mediaText',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      caption: { default: '' },
      body: { default: '' },
      position: { default: 'left' },
      imageWidthPct: { default: 40 },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.dirt-post-media-text',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false
          const img = el.querySelector('.dirt-post-media-text-image img')
          const bodyEl = el.querySelector('.dirt-post-media-text-body')
          if (!img || !bodyEl) return false
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            caption: el.querySelector('.dirt-post-media-text-image figcaption')?.textContent || '',
            body: bodyEl.textContent || '',
            position: (el.dataset.position as MediaPosition) || 'left',
            imageWidthPct: clampWidth(Number(el.dataset.imageWidth || 40)),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const position = (HTMLAttributes.position as MediaPosition) || 'left'
    const imageWidthPct = clampWidth(Number(HTMLAttributes.imageWidthPct))
    const caption = HTMLAttributes.caption || ''
    const figureChildren: Array<unknown> = [
      [
        'img',
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt || '',
          loading: 'lazy',
          decoding: 'async',
        },
      ],
    ]
    if (caption) figureChildren.push(['figcaption', {}, String(caption)])

    // TipTap DOMOutputSpec cannot embed arbitrary HTML strings as children;
    // public CSS expects .dirt-post-media-text-body with paragraphs — we emit a single p
    // and expand newlines server-side via sanitize keep. For editor getHTML, use 0-depth text.
    const bodyText = String(HTMLAttributes.body || '')
    const bodyChildren: Array<unknown> = bodyText
      .split(/\n\n+/)
      .map((para) => ['p', {}, para])

    return [
      'div',
      mergeAttributes({
        class: `dirt-post-media-text dirt-post-media-text--${position}`,
        'data-position': position,
        'data-image-width': String(imageWidthPct),
        style: `--dirt-media-width: ${imageWidthPct}%`,
      }),
      ['figure', { class: 'dirt-post-media-text-image' }, ...figureChildren],
      ['div', { class: 'dirt-post-media-text-body' }, ...(bodyChildren.length ? bodyChildren : [['p', {}, '']])],
    ]
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const root = document.createElement('div')
      root.className = `dirt-post-media-text dirt-post-media-text--${node.attrs.position} is-editor`
      root.dataset.position = node.attrs.position
      root.style.setProperty('--dirt-media-width', `${node.attrs.imageWidthPct}%`)
      root.contentEditable = 'false'

      const figure = document.createElement('figure')
      figure.className = 'dirt-post-media-text-image'
      const img = document.createElement('img')
      img.src = node.attrs.src || ''
      img.alt = node.attrs.alt || ''
      figure.append(img)

      const body = document.createElement('textarea')
      body.className = 'dirt-post-media-text-editor'
      body.rows = 5
      body.value = node.attrs.body || ''
      body.placeholder = 'Text beside the image…'

      const controls = document.createElement('div')
      controls.className = 'dirt-editor-node-controls'
      controls.innerHTML = `
        <label>Position
          <select data-mt-pos>
            <option value="left">Image left</option>
            <option value="right">Image right</option>
            <option value="above">Image above</option>
            <option value="below">Image below</option>
          </select>
        </label>
        <label>Width % <input type="number" min="20" max="70" data-mt-width /></label>
        <label>Alt <input type="text" data-mt-alt /></label>
        <label>Caption <input type="text" data-mt-caption /></label>
        <button type="button" class="btn btn-secondary btn-sm" data-mt-replace>Replace image</button>
      `

      const posSelect = controls.querySelector('[data-mt-pos]') as HTMLSelectElement
      const widthInput = controls.querySelector('[data-mt-width]') as HTMLInputElement
      const altInput = controls.querySelector('[data-mt-alt]') as HTMLInputElement
      const captionInput = controls.querySelector('[data-mt-caption]') as HTMLInputElement
      posSelect.value = node.attrs.position
      widthInput.value = String(node.attrs.imageWidthPct)
      altInput.value = node.attrs.alt || ''
      captionInput.value = node.attrs.caption || ''

      const applyAttrs = (next: Record<string, unknown>) => {
        if (typeof getPos !== 'function') return
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

      body.addEventListener('input', () => applyAttrs({ body: body.value }))
      posSelect.addEventListener('change', () => applyAttrs({ position: posSelect.value }))
      widthInput.addEventListener('change', () =>
        applyAttrs({ imageWidthPct: clampWidth(Number(widthInput.value)) }),
      )
      altInput.addEventListener('change', () => applyAttrs({ alt: altInput.value }))
      captionInput.addEventListener('change', () => applyAttrs({ caption: captionInput.value }))
      controls.querySelector('[data-mt-replace]')?.addEventListener('click', async () => {
        const asset = await window.pickLibraryAsset?.('image')
        if (asset) {
          img.src = asset.url
          applyAttrs({ src: asset.url })
        }
      })

      root.append(controls, figure, body)
      return {
        dom: root,
        ignoreMutation: () => true,
        update: (updated) => {
          if (updated.type.name !== 'mediaText') return false
          node = updated
          img.src = updated.attrs.src || ''
          root.className = `dirt-post-media-text dirt-post-media-text--${updated.attrs.position} is-editor`
          root.style.setProperty('--dirt-media-width', `${updated.attrs.imageWidthPct}%`)
          if (document.activeElement !== body) body.value = updated.attrs.body || ''
          return true
        },
      }
    }
  },

  addCommands() {
    return {
      setMediaText:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src,
              alt: attrs.alt || '',
              caption: attrs.caption || '',
              body: attrs.body || '',
              position: attrs.position || 'left',
              imageWidthPct: clampWidth(attrs.imageWidthPct),
            },
          }),
    }
  },
})

// silence unused helper in editor bundle (used conceptually for public parity)
void bodyToHtml

declare global {
  interface Window {
    pickLibraryAsset?: (kind?: 'image' | 'pdf') => Promise<{
      key: string
      url: string
      label: string
    } | null>
  }
}
