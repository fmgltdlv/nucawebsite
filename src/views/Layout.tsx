import { HtmlEscapedString } from 'hono/utils/html'
import { DEFAULT_THEME, layoutForTheme, type ThemeId } from '../config/themes'
import { site as defaultSite } from '../data/demo'
import type { BreakingNews, ContactInfo, FooterInfo } from '../lib/site-settings'
import { phoneTelHref } from '../lib/site-settings'
import { BreakingNewsBanner } from './BreakingNewsBanner'
import { SiteNav } from './SiteNav'
import { StaffPortalLink } from './StaffPortalLink'
import { ThemeSwitcher } from './ThemeSwitcher'

type LayoutProps = {
  title: string
  children: unknown
  description?: string
  theme?: ThemeId
  contact?: ContactInfo
  footer?: FooterInfo
  breakingNews?: BreakingNews | null
}

export function Layout({
  title,
  children,
  description,
  theme = DEFAULT_THEME,
  contact = defaultSite,
  footer,
  breakingNews,
}: LayoutProps) {
  const layout = layoutForTheme(theme)
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css?v=9" />
      </head>
      <body>
        <a class="skip-link" href="#main">Skip to content</a>
        {breakingNews && <BreakingNewsBanner news={breakingNews} />}
        <header class="site-header">
          <div class="container header-inner">
            <div class="header-left">
              <StaffPortalLink />
              <a class="brand brand-logo-link" href="/">
                <img
                  class="brand-logo"
                  src="/images/nuca-logo.png"
                  alt="NUCA of Las Vegas — We Dig Las Vegas"
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
            <SiteNav />
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
              <a class="footer-link" href="/about/the-dirt">Browse the archive</a>
              <br />
              <a class="footer-link" href="/contact#newsletter">Subscribe by email</a>
            </div>
          </div>
          <div class="container footer-bottom footer-bottom-row">
            <p>
              © {new Date().getFullYear()} {contact.name}.
              {copyrightNote ? ` ${copyrightNote}` : ''}
            </p>
            <ThemeSwitcher activeTheme={theme} />
          </div>
        </footer>
        <script src="/site.js?v=10" defer></script>
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
