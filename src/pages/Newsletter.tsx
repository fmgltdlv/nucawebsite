import { Layout, PageHeader } from '../views/Layout'

import type { PageProps } from '../types/page'

export function NewsletterThanksPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Subscribed">
      <PageHeader
        title="Thank you"
        lead="Demo only — your email was not added to any list yet. Production will subscribe you to THE DIRT mailing list."
      />
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
