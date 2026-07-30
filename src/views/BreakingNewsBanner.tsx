import type { BreakingNews } from '../lib/site-settings'

export function BreakingNewsBanner({ news }: { news: BreakingNews }) {
  return (
    <div class="breaking-news" role="alert">
      <div class="container breaking-news-inner">
        <strong>{news.title}</strong>
        <span>{news.body}</span>
        {news.link && (
          <a class="breaking-news-link" href={news.link}>
            Read more →
          </a>
        )}
        <button type="button" class="breaking-news-dismiss" data-breaking-dismiss aria-label="Dismiss alert">
          ×
        </button>
      </div>
    </div>
  )
}
