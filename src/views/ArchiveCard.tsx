import { formatArchiveDate } from '../lib/format'

type ArchiveCardProps = {
  href: string
  date: string
  title: string
  summary?: string | null
  ctaLabel?: string
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
  ctaLabel = 'Read more →',
  actions,
}: ArchiveCardProps) {
  return (
    <article class="dirt-card">
      <div class="dirt-card-meta">
        <time dateTime={date}>{formatArchiveDate(date)}</time>
      </div>
      <h2>
        <a href={href}>{title}</a>
      </h2>
      {summary && <p>{summary}</p>}
      {actions ?? (
        <a class="text-link" href={href}>
          {ctaLabel}
        </a>
      )}
    </article>
  )
}
