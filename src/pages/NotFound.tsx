import { Layout, PageHeader } from '../views/Layout'

import type { PageProps } from '../types/page'

export function NotFoundPage({ theme, contact, footer, breakingNews }: PageProps) {
  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Page not found">
      <PageHeader title="Page not found" lead="That link doesn’t exist on this site." />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/">Go home</a>
        </div>
      </section>
    </Layout>
  )
}
