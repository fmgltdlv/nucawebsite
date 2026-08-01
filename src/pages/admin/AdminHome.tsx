import { AdminShell } from '../../views/AdminShell'
import { AdminCountBadge } from '../../views/admin/AdminCountBadge'
import { inboxCardBadge } from '../../views/admin/AdminInboxToolbar'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminHomePage({ ctx, ...site }: PageProps & { ctx: AdminContext }) {
  const counts = ctx.inboxCounts

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={counts}
      csrfToken={ctx.csrfToken}
      title="Dashboard"
      activePath="/admin"
    >
      <div class="admin-cards">
        <a class="admin-card" href="/admin/members">
          <h2>Member list</h2>
          <p>Add, edit, and archive chapter members shown on the public directory.</p>
        </a>
        <a class="admin-card" href="/admin/users">
          <h2>Users</h2>
          <p>Create admin logins for chapter staff.</p>
        </a>
        <a class="admin-card" href="/admin/content">
          <h2>Content</h2>
          <p>FAQ, THE DIRT PDFs, editable pages, and site settings.</p>
        </a>
        <a class="admin-card" href="/admin/assets">
          <h2>Assets</h2>
          <p>Browse uploaded logos, photos, and PDFs stored for the public site.</p>
        </a>
        <a class="admin-card" href="/admin/events">
          <h2>Events</h2>
          <p>Full event calendar management.</p>
        </a>
        <a class="admin-card" href="/admin/applications">
          <h2 class="admin-card-title-row">
            Join applications
            {inboxCardBadge(counts, 'applications') != null && (
              <AdminCountBadge count={inboxCardBadge(counts, 'applications')!} />
            )}
          </h2>
          <p>Review membership applications submitted through the public Join form.</p>
        </a>
        <a class="admin-card" href="/admin/contact-messages">
          <h2 class="admin-card-title-row">
            Contact messages
            {inboxCardBadge(counts, 'contactMessages') != null && (
              <AdminCountBadge count={inboxCardBadge(counts, 'contactMessages')!} />
            )}
          </h2>
          <p>Read and manage messages submitted through the public Contact form.</p>
        </a>
        <a class="admin-card" href="/admin/newsletter">
          <h2 class="admin-card-title-row">
            Newsletter
            {inboxCardBadge(counts, 'newsletter') != null && (
              <AdminCountBadge count={inboxCardBadge(counts, 'newsletter')!} />
            )}
          </h2>
          <p>View THE DIRT mailing list signups from the Contact page.</p>
        </a>
      </div>
    </AdminShell>
  )
}
