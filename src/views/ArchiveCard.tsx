import { formatArchiveDate } from '../lib/format'

type ArchiveCardProps = {
  href: string
  date: string
  title: string
  summary?: string | null
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
  actions,
}: ArchiveCardProps) {
  if (actions) {
    return (
      <article class="dirt-card">
        <div class="dirt-card-meta">
          <time dateTime={date}>{formatArchiveDate(date)}</time>
        </div>
        <h2>
          <a href={href}>{title}</a>
        </h2>
        {summary && <p>{summary}</p>}
        {actions}
      </article>
    )
  }

  return (
    <article class="dirt-card">
      <a class="dirt-card-link" href={href}>
        <div class="dirt-card-meta">
          <time dateTime={date}>{formatArchiveDate(date)}</time>
        </div>
        <h2>{title}</h2>
        {summary && <p>{summary}</p>}
      </a>
    </article>
  )
}
