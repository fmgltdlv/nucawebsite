import { Layout, PageHeader, pickLayoutSite } from './Layout'
import type { PageProps } from '../types/page'

type StatusPageProps = PageProps & {
  title: string
  heading: string
  lead: string
  ctaHref?: string
  ctaLabel?: string
  prose?: boolean
  children?: unknown
}

export function StatusPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  title,
  heading,
  lead,
  ctaHref,
  ctaLabel,
  prose = false,
  children,
}: StatusPageProps) {
  return (
    <Layout {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation })} title={title}>
      <PageHeader title={heading} lead={lead} />
      <section class="section">
        <div class={`container${prose ? ' prose' : ''}`}>
          {children}
          {ctaHref && ctaLabel && (
            <a class="btn btn-primary" href={ctaHref}>
              {ctaLabel}
            </a>
          )}
        </div>
      </section>
    </Layout>
  )
}
