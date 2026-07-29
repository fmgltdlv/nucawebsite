import { Layout, PageHeader } from '../views/Layout'

import type { PageProps } from '../types/page'

export function NotFoundPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="Page not found">
      <PageHeader title="Page not found" lead="That link doesn’t exist on this demo site." />
      <section class="section">
        <div class="container">
          <a class="btn btn-primary" href="/">Go home</a>
        </div>
      </section>
    </Layout>
  )
}
