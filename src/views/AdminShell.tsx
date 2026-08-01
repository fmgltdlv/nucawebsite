import type { User } from '../config/roles'
import type { AdminInboxCounts } from '../lib/admin-inbox-counts'
import { totalInboxCount } from '../lib/admin-inbox-counts'
import type { SiteLayoutProps } from '../types/page'
import { Layout, pickLayoutSite } from './Layout'
import { AdminAssetLibraryDialog } from './admin/AdminAssetLibraryDialog'
import { AdminCountBadge } from './admin/AdminCountBadge'

type NavItem = { href: string; label: string; badge?: number }

export function AdminShell({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  user,
  inboxCounts,
  csrfToken,
  title,
  children,
  activePath,
}: SiteLayoutProps & {
  user: User
  inboxCounts: AdminInboxCounts
  csrfToken: string
  title: string
  children: unknown
  activePath: string
}) {
  const totalNew = totalInboxCount(inboxCounts)
  const nav: NavItem[] = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/members', label: 'Member list' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/content', label: 'Content', badge: totalNew > 0 ? totalNew : undefined },
    { href: '/admin/assets', label: 'Assets' },
    { href: '/admin/applications', label: 'Applications', badge: inboxCounts.applications },
    { href: '/admin/contact-messages', label: 'Contact messages', badge: inboxCounts.contactMessages },
    { href: '/admin/newsletter', label: 'Newsletter', badge: inboxCounts.newsletter },
  ]

  return (
    <Layout
      {...pickLayoutSite({
        theme,
        contact,
        footer,
        breakingNews,
        logoUrl,
        logoSizePercent,
        navigation,
        staffInboxCount: totalNew > 0 ? totalNew : undefined,
      })}
      title={title}
    >
      <div class="admin-shell" data-csrf-token={csrfToken}>
        <aside class="admin-sidebar">
          <p class="admin-sidebar-title">Staff portal</p>
          <p class="admin-sidebar-user">
            {user.display_name || user.email}
            <span class="admin-role-badge">Admin</span>
            {totalNew > 0 && <AdminCountBadge count={totalNew} />}
          </p>
          <nav class="admin-nav" aria-label="Admin">
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    class={activePath === item.href ? 'admin-nav-active' : undefined}
                  >
                    <span class="admin-nav-label">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <AdminCountBadge count={item.badge} />
                    )}
                  </a>
                </li>
              ))}
              <li>
                <a href="/" class="admin-nav-external">View public site</a>
              </li>
            </ul>
          </nav>
          <form method="post" action="/admin/logout" class="admin-logout">
            <button type="submit" class="btn btn-secondary btn-sm">Sign out</button>
          </form>
        </aside>
        <div class="admin-main">
          <header class="admin-main-header">
            <h1>{title}</h1>
          </header>
          {children}
        </div>
      </div>
      <AdminAssetLibraryDialog />
      <script src="/admin-security.js" defer></script>
    </Layout>
  )
}
