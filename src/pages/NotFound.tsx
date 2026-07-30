import { StatusPage } from '../views/StatusPage'
import type { PageProps } from '../types/page'

export function NotFoundPage(props: PageProps) {
  return (
    <StatusPage
      {...props}
      title="Page not found"
      heading="Page not found"
      lead="That link doesn’t exist on this site."
      ctaHref="/"
      ctaLabel="Go home"
    />
  )
}
