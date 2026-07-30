import type { User } from '../config/roles'
import { ROLE_LABELS } from '../config/roles'
import type { ThemeId } from '../config/themes'
import { Layout } from './Layout'

type NavItem = { href: string; label: string }

export function AdminShell({
  theme,
  user,
  chairCommittees,
  title,
  children,
  activePath,
}: {
  theme: ThemeId
  user: User
  chairCommittees: string[]
  title: string
  children: unknown
  activePath: string
}) {
  const nav: NavItem[] = []

  if (user.role === 'admin') {
    nav.push(
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/members', label: 'Member list' },
      { href: '/admin/events', label: 'Events' },
      { href: '/admin/users', label: 'Users & roles' },
      { href: '/admin/content', label: 'Content' },
      { href: '/admin/applications', label: 'Applications' },
    )
  } else if (user.role === 'chair') {
    nav.push({ href: '/admin', label: 'Dashboard' }, { href: '/admin/events', label: 'Events' })
    if (chairCommittees.length > 0) {
      nav.push({ href: '/admin/committees', label: 'My committees' })
    }
  } else if (user.role === 'member') {
    nav.push({ href: '/admin', label: 'Dashboard' }, { href: '/admin/profile', label: 'My listing' })
  }

  return (
    <Layout theme={theme} title={title}>
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <p class="admin-sidebar-title">Staff portal</p>
          <p class="admin-sidebar-user">
            {user.display_name || user.email}
            <span class="admin-role-badge">{ROLE_LABELS[user.role]}</span>
          </p>
          <nav class="admin-nav" aria-label="Admin">
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    class={activePath === item.href ? 'admin-nav-active' : undefined}
                  >
                    {item.label}
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
    </Layout>
  )
}
