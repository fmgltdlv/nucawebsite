;(function () {
  function initCarousel(root) {
    if (!(root instanceof HTMLElement) || root.dataset.carouselReady === '1') return
    root.dataset.carouselReady = '1'

    const slides = Array.from(root.querySelectorAll('[data-carousel-slide], .dirt-post-carousel-slide'))
    if (slides.length < 2) return

    let index = 0
    const dots = Array.from(root.querySelectorAll('[data-carousel-dot]'))

    function show(next) {
      index = ((next % slides.length) + slides.length) % slides.length
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index)
      })
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index)
      })
    }

    root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => show(index - 1))
    root.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(index + 1))
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const i = Number.parseInt(dot.getAttribute('data-carousel-dot') || '', 10)
        if (Number.isFinite(i)) show(i)
      })
    })

    show(0)
  }

  function initAll(scope) {
    ;(scope || document).querySelectorAll('[data-carousel], .dirt-post-carousel').forEach(initCarousel)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll())
  } else {
    initAll()
  }
})()
