import type { BreakingNews } from '../lib/site-settings'

export function BreakingNewsPopup({ news }: { news: BreakingNews }) {
  return (
    <dialog id="breaking-news-popup" class="breaking-news-popup">
      <article class="breaking-news-popup-card">
        <button
          type="button"
          class="breaking-news-popup-close"
          aria-label="Close"
          data-breaking-popup-dismiss
        >
          ×
        </button>
        <p class="breaking-news-popup-eyebrow">Breaking news</p>
        <h2 class="breaking-news-popup-title">{news.title}</h2>
        <p class="breaking-news-popup-body">{news.body}</p>
        <footer class="breaking-news-popup-footer">
          {news.link ? (
            <a class="btn btn-primary" href={news.link}>
              Read more
            </a>
          ) : null}
          <button type="button" class="btn btn-secondary" data-breaking-popup-dismiss>
            Dismiss
          </button>
        </footer>
      </article>
    </dialog>
  )
}
