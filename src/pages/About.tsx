import { Layout, PageHeader, DemoBanner } from '../views/Layout'
import { site } from '../data/demo'

import type { PageProps } from '../types/page'

export function AboutPage({ theme }: PageProps) {
  return (
    <Layout theme={theme} title="About">
      <DemoBanner />
      <PageHeader
        title="About NUCA of Las Vegas"
        lead="The local chapter of the National Utility Contractors Association serves utility construction and excavation professionals across Southern Nevada."
      />
      <section class="section">
        <div class="container prose">
          <p>
            NUCA members include contractors who build and maintain underground utility systems, associate members who
            supply the industry, and institutional partners from education and government. The Las Vegas chapter hosts
            meetings, supports scholarships, and keeps members informed on safety and regulatory changes.
          </p>
          <p>Under <strong>About</strong> in the menu:</p>
          <ul>
            <li><a href="/about/q-and-a">Q & A</a> — including &ldquo;What is NUCA?&rdquo; (admin-editable)</li>
            <li><a href="/about/leadership">Leadership</a></li>
            <li><a href="/members">Member List</a></li>
            <li><a href="/events">Events</a></li>
          </ul>
          <p>Other main menu items: <a href="/about/committees">Committees</a>,{' '}
            <a href="/industry-updates">Industry Updates</a> (<a href="/about/the-dirt">THE DIRT</a>),{' '}
            <a href="/resources">Resources</a>.
          </p>
          <p>
            For chapter inquiries, contact <a href="mailto:info@nucalasvegas.com">{site.email}</a> or call{' '}
            <a href="tel:7025778556">{site.phone}</a>.
          </p>
        </div>
      </section>
    </Layout>
  )
}
