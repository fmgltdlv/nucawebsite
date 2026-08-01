import { formatEventDateShort } from '../../lib/format'
import type { NewsletterSubscriber } from '../../lib/newsletter-db'
import { AdminShell } from '../../views/AdminShell'
import { AdminListSection, AdminListSearch, AdminListToolbar } from '../../views/admin/AdminListSection'
import { AdminInboxToolbar } from '../../views/admin/AdminInboxToolbar'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

function subscriberSearchText(subscriber: NewsletterSubscriber): string {
  return [subscriber.email, subscriber.source, subscriber.status, subscriber.subscribed_at]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function SubscriberListRow({ subscriber }: { subscriber: NewsletterSubscriber }) {
  return (
    <tr data-admin-list-row data-search={subscriberSearchText(subscriber)}>
      <td>
        <time dateTime={subscriber.subscribed_at}>{formatEventDateShort(subscriber.subscribed_at)}</time>
      </td>
      <td>
        <a href={`mailto:${subscriber.email}`}>{subscriber.email}</a>
      </td>
      <td>{subscriber.source ?? '—'}</td>
      <td>
        <span class={`admin-status-badge admin-status-newsletter-${subscriber.status}`}>
          {subscriber.status}
        </span>
      </td>
      <td class="admin-list-actions">
        {subscriber.status === 'new' && (
          <form method="post" action={`/admin/newsletter/${subscriber.id}`} class="admin-inline-form">
            <input type="hidden" name="status" value="acknowledged" />
            <button type="submit" class="btn btn-secondary btn-sm">Acknowledge</button>
          </form>
        )}
        <form method="post" action={`/admin/newsletter/${subscriber.id}/delete`} class="admin-inline-form">
          <button type="submit" class="btn btn-secondary btn-sm">Delete</button>
        </form>
      </td>
    </tr>
  )
}

export function AdminNewsletterSubscribersPage({
  ctx,
  subscribers,
  flash,
  ...site
}: PageProps & { ctx: AdminContext; subscribers: NewsletterSubscriber[]; flash?: string }) {
  const newCount = subscribers.filter((subscriber) => subscriber.status === 'new').length

  return (
    <AdminShell
      {...site}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Newsletter subscribers"
      activePath="/admin/newsletter"
    >
      <p class="admin-note">
        THE DIRT mailing list signups from the Contact page. Export a CSV to import into your email provider.
      </p>
      {flash && <p class="admin-flash">{flash}</p>}

      <AdminInboxToolbar
        newCount={newCount}
        acknowledgeAction="/admin/newsletter/acknowledge-all"
        acknowledgeLabel="Acknowledge all new"
      />

      <AdminListSection
        title="Subscribers"
        count={subscribers.length}
        emptyMessage="No subscribers yet."
        hasItems={subscribers.length > 0}
        toolbar={
          <AdminListToolbar>
            <AdminListSearch />
            {subscribers.length > 0 && (
              <a class="btn btn-secondary btn-sm" href="/admin/newsletter/export">
                Export CSV
              </a>
            )}
          </AdminListToolbar>
        }
        tableHead={
          <tr>
            <th>Subscribed</th>
            <th>Email</th>
            <th>Source</th>
            <th>Status</th>
            <th></th>
          </tr>
        }
        tableBody={subscribers.map((subscriber) => (
          <SubscriberListRow subscriber={subscriber} key={subscriber.id} />
        ))}
      />
    </AdminShell>
  )
}
