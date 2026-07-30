import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

const contentSections = [
  { href: '/admin/content/settings', title: 'Site settings', desc: 'Contact info, footer copy, theme, breaking news' },
  { href: '/admin/content/qa', title: 'Q & A', desc: 'Frequently asked questions' },
  { href: '/admin/content/the-dirt', title: 'THE DIRT', desc: 'PDF news release archive' },
  { href: '/admin/content/posts', title: 'Industry updates', desc: 'Blog posts and announcements' },
  { href: '/admin/content/pages', title: 'Editable pages', desc: 'About, Resources, Scholarships, Committees' },
  { href: '/admin/content/leadership', title: 'Leadership', desc: 'Chapter officer roster' },
  { href: '/admin/content/resources', title: 'Resource links', desc: 'Structured links on Resources page' },
  { href: '/admin/applications', title: 'Join applications', desc: 'Membership application queue' },
  { href: '/admin/newsletter', title: 'Newsletter subscribers', desc: 'THE DIRT mailing list signups' },
]

export function AdminContentPage({ theme, ctx }: PageProps & { ctx: AdminContext }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Content"
      activePath="/admin/content"
    >
      <p class="section-lead">Manage public site content without a code deploy.</p>
      <div class="admin-cards">
        {contentSections.map((section) => (
          <a class="admin-card" href={section.href} key={section.href}>
            <h2>{section.title}</h2>
            <p>{section.desc}</p>
          </a>
        ))}
      </div>
    </AdminShell>
  )
}
