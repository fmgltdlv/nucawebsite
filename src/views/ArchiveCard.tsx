import { formatArchiveDate } from '../lib/format'

type ArchiveCardProps = {
  href: string
  date: string
  title: string
  summary?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  actions?: unknown
}

export function ArchiveCardList({ children }: { children: unknown }) {
  return <ul class="dirt-archive">{children}</ul>
}

export function ArchiveCard({
  href,
  date,
  title,
  summary,
  imageUrl,
  imageAlt,
  actions,
}: ArchiveCardProps) {
  const thumb = imageUrl ? (
    <div class="dirt-card-thumb">
      <img src={imageUrl} alt={imageAlt || ''} loading="lazy" decoding="async" />
    </div>
  ) : null

  if (actions) {
    return (
      <article class="dirt-card">
        {thumb}
        <div class="dirt-card-body">
          <div class="dirt-card-meta">
            <time dateTime={date}>{formatArchiveDate(date)}</time>
          </div>
          <h2>
            <a href={href}>{title}</a>
          </h2>
          {summary && <p>{summary}</p>}
          {actions}
        </div>
      </article>
    )
  }

  return (
    <article class="dirt-card">
      <a class="dirt-card-link" href={href}>
        {thumb}
        <div class="dirt-card-body">
          <div class="dirt-card-meta">
            <time dateTime={date}>{formatArchiveDate(date)}</time>
          </div>
          <h2>{title}</h2>
          {summary && <p>{summary}</p>}
        </div>
      </a>
    </article>
  )
}
