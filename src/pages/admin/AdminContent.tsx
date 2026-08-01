import type { AdminInboxCounts } from '../../lib/admin-inbox-counts'
import { AdminShell } from '../../views/AdminShell'
import { AdminCountBadge } from '../../views/admin/AdminCountBadge'
import { inboxCardBadge } from '../../views/admin/AdminInboxToolbar'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

const contentSections: Array<{
  href: string
  title: string
  desc: string
  badgeKey?: keyof AdminInboxCounts
}> = [
  { href: '/admin/content/settings', title: 'Site settings', desc: 'Contact info, footer copy, theme, breaking news' },
  { href: '/admin/content/navigation', title: 'Navigation', desc: 'Header menu links and dropdowns' },
  { href: '/admin/content/qa', title: 'FAQ', desc: 'Frequently asked questions' },
  { href: '/admin/content/the-dirt', title: 'THE DIRT — PDF releases', desc: 'PDF news release archive' },
  { href: '/admin/content/posts', title: 'THE DIRT — web posts', desc: 'Blog posts and announcements' },
  { href: '/admin/content/committees', title: 'Committees', desc: 'Add, remove, and reorder chapter committees' },
  { href: '/admin/content/pages', title: 'Editable pages', desc: 'Built-in, committee, and custom pages' },
  { href: '/admin/content/leadership', title: 'Leadership', desc: 'Chapter officer roster' },
  { href: '/admin/content/resources', title: 'Resource links', desc: 'Structured links on Resources page' },
  {
    href: '/admin/applications',
    title: 'Join applications',
    desc: 'Membership application queue',
    badgeKey: 'applications',
  },
  {
    href: '/admin/contact-messages',
    title: 'Contact messages',
    desc: 'Public Contact form inbox',
    badgeKey: 'contactMessages',
  },
  {
    href: '/admin/newsletter',
    title: 'Newsletter subscribers',
    desc: 'THE DIRT mailing list signups',
    badgeKey: 'newsletter',
  },
]

export function AdminContentPage({ ctx, ...site }: PageProps & { ctx: AdminContext }) {
  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Content"
      activePath="/admin/content"
    >
      <p class="section-lead">Manage public site content without a code deploy.</p>
      <div class="admin-cards">
        {contentSections.map((section) => {
          const badge = section.badgeKey ? inboxCardBadge(ctx.inboxCounts, section.badgeKey) : undefined
          return (
            <a class="admin-card" href={section.href} key={section.href}>
              <h2 class={badge != null ? 'admin-card-title-row' : undefined}>
                {section.title}
                {badge != null && <AdminCountBadge count={badge} />}
              </h2>
              <p>{section.desc}</p>
            </a>
          )
        })}
      </div>
    </AdminShell>
  )
}
