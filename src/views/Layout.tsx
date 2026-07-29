import { HtmlEscapedString } from 'hono/utils/html'
import { DEFAULT_THEME, layoutForTheme, type ThemeId } from '../config/themes'
import { SiteNav } from './SiteNav'
import { StaffPortalLink } from './StaffPortalLink'
import { ThemeSwitcher } from './ThemeSwitcher'

type LayoutProps = {
  title: string
  children: unknown
  description?: string
  theme?: ThemeId
}

export function Layout({ title, children, description, theme = DEFAULT_THEME }: LayoutProps) {
  const layout = layoutForTheme(theme)
  const fullTitle = title === 'Home' ? 'NUCA of Las Vegas' : `${title} · NUCA of Las Vegas`
  const metaDescription =
    description ??
    'NUCA of Las Vegas — utility and excavation contractors, associates, and partners in Southern Nevada.'

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
        <link rel="stylesheet" href="/styles.css?v=2" />
      </head>
      <body>
        <a class="skip-link" href="#main">Skip to content</a>
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
              <p class="footer-title">NUCA of Las Vegas</p>
              <p class="footer-muted">PO Box 96681<br />Las Vegas, NV 89193</p>
            </div>
            <div>
              <p class="footer-title">Contact</p>
              <p class="footer-muted">
                <a href="tel:7025778556">702-577-8556</a>
                <br />
                <a href="mailto:info@nucalasvegas.com">info@nucalasvegas.com</a>
              </p>
            </div>
            <div>
              <p class="footer-title">THE DIRT</p>
              <p class="footer-muted">Weekly chapter news and event updates.</p>
              <a class="footer-link" href="/about/the-dirt">Browse the archive</a>
              <br />
              <a class="footer-link" href="/contact#newsletter">Subscribe by email</a>
            </div>
          </div>
          <div class="container footer-bottom footer-bottom-row">
            <p>© {new Date().getFullYear()} NUCA of Las Vegas. Demo preview — data is sample only.</p>
            <ThemeSwitcher activeTheme={theme} />
          </div>
        </footer>
        <script src="/site.js?v=2" defer></script>
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

export function DemoBanner() {
  return (
    <div class="demo-banner" role="status">
      <div class="container demo-banner-inner">
        <strong>Demo preview</strong>
        <span>Front-end scaffold — member data and forms are not connected to a database yet.</span>
      </div>
    </div>
  )
}
