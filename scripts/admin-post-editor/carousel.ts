import { Node, mergeAttributes } from '@tiptap/core'

export type CarouselSlide = { src: string; alt?: string; caption?: string }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    carousel: {
      setCarousel: (attrs: { slides: CarouselSlide[] }) => ReturnType
    }
  }
}

function parseSlides(el: HTMLElement): CarouselSlide[] {
  return Array.from(el.querySelectorAll('.dirt-post-carousel-slide')).map((slide) => {
    const img = slide.querySelector('img')
    return {
      src: img?.getAttribute('src') || '',
      alt: img?.getAttribute('alt') || '',
      caption: slide.querySelector('figcaption')?.textContent || '',
    }
  }).filter((s) => s.src)
}

export const Carousel = Node.create({
  name: 'carousel',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      slides: {
        default: [] as CarouselSlide[],
        parseHTML: (el) => (el instanceof HTMLElement ? parseSlides(el) : []),
        renderHTML: () => ({}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.dirt-post-carousel' }]
  },

  renderHTML({ node }) {
    const slides = (node.attrs.slides as CarouselSlide[]) || []
    const slideNodes = slides.map((slide, index) => {
      const children: Array<unknown> = [
        [
          'img',
          {
            src: slide.src,
            alt: slide.alt || '',
            loading: index === 0 ? 'eager' : 'lazy',
            decoding: 'async',
          },
        ],
      ]
      if (slide.caption) children.push(['figcaption', {}, slide.caption])
      return [
        'figure',
        {
          class: `dirt-post-carousel-slide${index === 0 ? ' is-active' : ''}`,
          'data-carousel-slide': String(index),
        },
        ...children,
      ]
    })

    const dots = slides.map((_, index) => [
      'button',
      {
        type: 'button',
        class: `dirt-post-carousel-dot${index === 0 ? ' is-active' : ''}`,
        'data-carousel-dot': String(index),
        'aria-label': `Go to slide ${index + 1}`,
      },
    ])

    return [
      'div',
      mergeAttributes({
        class: 'dirt-post-carousel',
        'data-carousel': '',
      }),
      ['div', { class: 'dirt-post-carousel-track' }, ...slideNodes],
      [
        'div',
        { class: 'dirt-post-carousel-controls' },
        ['button', { type: 'button', class: 'dirt-post-carousel-btn', 'data-carousel-prev': '', 'aria-label': 'Previous slide' }, '‹'],
        ['div', { class: 'dirt-post-carousel-dots' }, ...dots],
        ['button', { type: 'button', class: 'dirt-post-carousel-btn', 'data-carousel-next': '', 'aria-label': 'Next slide' }, '›'],
      ],
    ]
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const root = document.createElement('div')
      root.className = 'dirt-post-carousel is-editor'
      root.contentEditable = 'false'

      const list = document.createElement('div')
      list.className = 'dirt-post-carousel-editor-slides'

      const renderSlides = (slides: CarouselSlide[]) => {
        list.innerHTML = ''
        slides.forEach((slide, index) => {
          const row = document.createElement('div')
          row.className = 'dirt-post-carousel-editor-row'
          row.innerHTML = `
            <img src="${slide.src}" alt="" />
            <input type="text" data-cap placeholder="Caption" value="${(slide.caption || '').replace(/"/g, '&quot;')}" />
            <button type="button" class="btn btn-secondary btn-sm" data-remove>Remove</button>
          `
          row.querySelector('[data-cap]')?.addEventListener('change', (event) => {
            const value = (event.target as HTMLInputElement).value
            const next = slides.map((s, i) => (i === index ? { ...s, caption: value } : s))
            apply({ slides: next })
          })
          row.querySelector('[data-remove]')?.addEventListener('click', () => {
            apply({ slides: slides.filter((_, i) => i !== index) })
          })
          list.append(row)
        })
      }

      const apply = (next: { slides: CarouselSlide[] }) => {
        if (typeof getPos !== 'function') return
        const pos = getPos()
        if (typeof pos !== 'number') return
        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, next)
            return true
          })
          .run()
      }

      const addBtn = document.createElement('button')
      addBtn.type = 'button'
      addBtn.className = 'btn btn-secondary btn-sm'
      addBtn.textContent = 'Add slide'
      addBtn.addEventListener('click', async () => {
        const asset = await window.pickLibraryAsset?.('image')
        if (!asset) return
        const slides = [...((node.attrs.slides as CarouselSlide[]) || []), { src: asset.url, alt: asset.label || '' }]
        apply({ slides })
      })

      renderSlides((node.attrs.slides as CarouselSlide[]) || [])
      root.append(list, addBtn)

      return {
        dom: root,
        ignoreMutation: () => true,
        update: (updated) => {
          if (updated.type.name !== 'carousel') return false
          node = updated
          renderSlides((updated.attrs.slides as CarouselSlide[]) || [])
          return true
        },
      }
    }
  },

  addCommands() {
    return {
      setCarousel:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { slides: attrs.slides || [] },
          }),
    }
  },
})

declare global {
  interface Window {
    pickLibraryAsset?: (kind?: 'image' | 'pdf') => Promise<{
      key: string
      url: string
      label: string
    } | null>
  }
}
