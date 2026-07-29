import { AdminShell } from '../../views/AdminShell'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminHomePage({ theme, ctx }: PageProps & { ctx: AdminContext }) {
  const { user } = ctx

  return (
    <AdminShell theme={theme} user={user} chairCommittees={ctx.chairCommittees} title="Dashboard" activePath="/admin">
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
              <p>Q & A, THE DIRT PDFs, editable pages, and site settings.</p>
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
