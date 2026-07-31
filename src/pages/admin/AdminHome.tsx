import { AdminShell } from '../../views/AdminShell'
import { AdminCountBadge } from '../../views/admin/AdminCountBadge'
import { inboxCardBadge } from '../../views/admin/AdminInboxToolbar'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminHomePage({ theme, ctx }: PageProps & { ctx: AdminContext }) {
  const { user } = ctx
  const counts = ctx.inboxCounts

  return (
    <AdminShell theme={theme} user={user} chairCommittees={ctx.chairCommittees} inboxCounts={counts} title="Dashboard" activePath="/admin">
      <div class="admin-cards">
        {user.role === 'admin' && (
          <>
            <a class="admin-card" href="/admin/members">
              <h2>Member list</h2>
              <p>Add, edit, and archive chapter members shown on the public directory.</p>
            </a>
            <a class="admin-card" href="/admin/users">
              <h2>Users & roles</h2>
              <p>Create Admin, Chair, and Member logins. Assign committees to chairs.</p>
            </a>
            <a class="admin-card" href="/admin/content">
              <h2>Content</h2>
              <p>FAQ, THE DIRT PDFs, editable pages, and site settings.</p>
            </a>
            <a class="admin-card" href="/admin/assets">
              <h2>Assets</h2>
              <p>Browse uploaded logos, photos, and PDFs stored for the public site.</p>
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
          </>
        )}
        {(user.role === 'admin' || user.role === 'chair') && (
          <a class="admin-card" href="/admin/events">
            <h2>Events</h2>
            <p>
              {user.role === 'chair'
                ? 'Add and manage chapter events on the public calendar.'
                : 'Full event calendar management.'}
            </p>
          </a>
        )}
        {user.role === 'chair' && ctx.chairCommittees.length > 0 && (
          <a class="admin-card" href="/admin/committees">
            <h2>Committee pages</h2>
            <p>Edit committee content assigned to you by an admin.</p>
          </a>
        )}
        {user.role === 'member' && (
          <a class="admin-card" href="/admin/profile">
            <h2>My member listing</h2>
            <p>Update your company contact info on the public member list.</p>
          </a>
        )}
      </div>
      <p class="admin-note">
        Role: <strong>{user.role}</strong> — permissions are enforced on each screen.
      </p>
    </AdminShell>
  )
}
