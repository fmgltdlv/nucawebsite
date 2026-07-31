import type { AdminInboxCounts } from '../../lib/admin-inbox-counts'

/** Bulk acknowledge toolbar for admin inbox list pages. */
export function AdminInboxToolbar({
  newCount,
  acknowledgeAction,
  acknowledgeLabel,
}: {
  newCount: number
  acknowledgeAction: string
  acknowledgeLabel: string
}) {
  if (newCount <= 0) return null

  return (
    <form method="post" action={acknowledgeAction} class="admin-inbox-toolbar">
      <p class="admin-inbox-toolbar-text">
        <strong>{newCount}</strong> new {newCount === 1 ? 'item' : 'items'}
      </p>
      <button type="submit" class="btn btn-secondary btn-sm">{acknowledgeLabel}</button>
    </form>
  )
}

export function inboxCardBadge(counts: AdminInboxCounts | undefined, key: keyof AdminInboxCounts): number | undefined {
  const count = counts?.[key]
  return count && count > 0 ? count : undefined
}
