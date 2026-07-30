import { Layout, PageHeader } from '../views/Layout'
import type { PageProps } from '../types/page'

export function NewsletterThanksPage({ theme, contact, footer, breakingNews }: PageProps) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Subscribed">
      <PageHeader title="Thank you" lead="You have been subscribed to THE DIRT mailing list." />
      <section class="section">
        <div class="container prose">
          <p>
            <a href="/about/the-dirt">Browse THE DIRT archive</a> or return <a href="/">home</a>.
          </p>
        </div>
      </section>
    </Layout>
  )
}

export function NewsletterErrorPage({
  theme,
  contact,
  footer,
  breakingNews,
  error,
}: PageProps & { error: string }) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Subscribe">
      <PageHeader title="Could not subscribe" lead={error} />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/contact#newsletter">Try again</a>
        </div>
      </section>
    </Layout>
  )
}
