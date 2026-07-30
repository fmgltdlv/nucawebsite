import { formatEventDateShort } from '../../lib/format'
import { AdminShell } from '../../views/AdminShell'
import { AdminListSection, AdminListSearch } from '../../views/admin/AdminListSection'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

type Subscriber = {
  id: string
  email: string
  subscribed_at: string
  source: string | null
}

function subscriberSearchText(subscriber: Subscriber): string {
  return [subscriber.email, subscriber.source, subscriber.subscribed_at].filter(Boolean).join(' ').toLowerCase()
}

function SubscriberListRow({ subscriber }: { subscriber: Subscriber }) {
  return (
    <tr data-admin-list-row data-search={subscriberSearchText(subscriber)}>
      <td>
        <time dateTime={subscriber.subscribed_at}>{formatEventDateShort(subscriber.subscribed_at)}</time>
      </td>
      <td>
        <a href={`mailto:${subscriber.email}`}>{subscriber.email}</a>
      </td>
      <td>{subscriber.source ?? '—'}</td>
    </tr>
  )
}

export function AdminNewsletterSubscribersPage({
  theme,
  ctx,
  subscribers,
}: PageProps & { ctx: AdminContext; subscribers: Subscriber[] }) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Newsletter subscribers"
      activePath="/admin/newsletter"
    >
      <p class="admin-note">
        THE DIRT mailing list signups from the Contact page. Export from here until an email provider is connected.
      </p>

      <AdminListSection
        title="Subscribers"
        count={subscribers.length}
        emptyMessage="No subscribers yet."
        hasItems={subscribers.length > 0}
        toolbar={<AdminListSearch />}
        tableHead={
          <tr>
            <th>Subscribed</th>
            <th>Email</th>
            <th>Source</th>
          </tr>
        }
        tableBody={subscribers.map((subscriber) => (
          <SubscriberListRow subscriber={subscriber} key={subscriber.id} />
        ))}
      />
    </AdminShell>
  )
}
