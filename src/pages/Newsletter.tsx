import { StatusPage } from '../views/StatusPage'
import type { PageProps } from '../types/page'

export function NewsletterThanksPage(props: PageProps) {
  return (
    <StatusPage
      {...props}
      title="Subscribed"
      heading="Thank you"
      lead="You have been subscribed to THE DIRT mailing list."
      prose
    >
      <p>
        <a href="/about/the-dirt">Browse THE DIRT archive</a> or return <a href="/">home</a>.
      </p>
    </StatusPage>
  )
}

export function NewsletterErrorPage({
  error,
  ...props
}: PageProps & { error: string }) {
  return (
    <StatusPage
      {...props}
      title="Subscribe"
      heading="Could not subscribe"
      lead={error}
      ctaHref="/contact#newsletter"
      ctaLabel="Try again"
    />
  )
}
