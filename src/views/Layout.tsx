import { HtmlEscapedString } from 'hono/utils/html'
import { DEFAULT_THEME, layoutForTheme } from '../config/themes'
import { site as defaultSite } from '../data/demo'
import { DEFAULT_SITE_LOGO_URL, logoSizeScale } from '../lib/site-logo'
import { phoneTelHref } from '../lib/site-settings'
import { siteNavigation } from '../nav/site-nav'
import { BreakingNewsBanner } from './BreakingNewsBanner'
import { SiteNav } from './SiteNav'
import { StaffPortalLink } from './StaffPortalLink'
import type { SiteLayoutProps } from '../types/page'

type LayoutProps = SiteLayoutProps & {
  title: string
  children: unknown
  description?: string
  staffInboxCount?: number
}

export function pickLayoutSite(props: SiteLayoutProps): SiteLayoutProps {
  return {
    theme: props.theme,
    contact: props.contact,
    footer: props.footer,
    breakingNews: props.breakingNews,
    logoUrl: props.logoUrl,
    logoSizePercent: props.logoSizePercent,
    navigation: props.navigation,
    staffInboxCount: props.staffInboxCount,
  }
}

export function Layout({
  title,
  children,
  description,
  theme = DEFAULT_THEME,
  contact = defaultSite,
  footer,
  breakingNews,
  logoUrl = DEFAULT_SITE_LOGO_URL,
  logoSizePercent,
  navigation = siteNavigation,
  staffInboxCount,
}: LayoutProps) {
  const layout = layoutForTheme(theme)
  const logoScale = logoSizeScale(logoSizePercent)
  const fullTitle = title === 'Home' ? 'NUCA of Las Vegas' : `${title} · NUCA of Las Vegas`
  const metaDescription =
    description ??
    'NUCA of Las Vegas — utility and excavation contractors, associates, and partners in Southern Nevada.'
  const dirtBlurb = footer?.dirtBlurb ?? 'Weekly chapter news and event updates.'
  const copyrightNote = footer?.copyrightNote?.trim()
  const addressLines = contact.address.includes(',')
    ? contact.address.split(',').map((s) => s.trim())
    : [contact.address]

  return (
    <html lang="en" data-theme={theme} data-layout={layout}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={metaDescription} />
        <title>{fullTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&family=Barlow+Condensed:wght@400;600;700&family=Barlow:ital,wght@0,400;0,600;0,700;1,400&family=Bebas+Neue&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Outfit:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css?v=19" />
      </head>
      <body>
        <a class="skip-link" href="#main">Skip to content</a>
        {breakingNews?.active ? <BreakingNewsBanner news={breakingNews} /> : null}
        <header class="site-header" style={{ '--logo-scale': String(logoScale) }}>
          <div class="container header-inner">
            <div class="header-left">
              <StaffPortalLink inboxCount={staffInboxCount} />
              <a class="brand brand-logo-link" href="/">
                <img
                  class="brand-logo"
                  src={logoUrl}
                  alt={`${contact.name} — We Dig Las Vegas`}
                  width={231}
                  height={77}
                  decoding="async"
                />
              </a>
            </div>
            <div class="header-right">
            <button
              type="button"
              class="nav-toggle"
              aria-expanded="false"
              aria-controls="site-nav"
              id="nav-toggle"
            >
              Menu
            </button>
            <SiteNav navigation={navigation} />
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer class="site-footer">
          <div class="container footer-grid">
            <div>
              <p class="footer-title">{contact.name}</p>
              <p class="footer-muted">
                {addressLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < addressLines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <p class="footer-title">Contact</p>
              <p class="footer-muted">
                <a href={phoneTelHref(contact.phone)}>{contact.phone}</a>
                <br />
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
            </div>
            <div>
              <p class="footer-title">THE DIRT</p>
              <p class="footer-muted">{dirtBlurb}</p>
              <a class="footer-link" href="/the-dirt">Browse THE DIRT</a>
              <br />
              <a class="footer-link" href="/contact#newsletter">Subscribe by email</a>
            </div>
          </div>
          <div class="container footer-bottom">
            <p>
              © {new Date().getFullYear()} {contact.name}.
              {copyrightNote ? ` ${copyrightNote}` : ''}
            </p>
          </div>
        </footer>
        <script src="/site.js?v=15" defer></script>
        <script src="/admin-nav.js?v=1" defer></script>
      </body>
    </html>
  )
}

export function PageHeader({
  title,
  lead,
  actions,
}: {
  title: string
  lead?: string
  actions?: HtmlEscapedString | string
}) {
  return (
    <div class="page-header">
      <div class="container">
        <h1>{title}</h1>
        {lead && <p class="page-lead">{lead}</p>}
        {actions && <div class="page-actions">{actions}</div>}
      </div>
    </div>
  )
}
