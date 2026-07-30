import type { MemberLinkStatus } from '../config/roles'

export function MemberLinkStatusDot({ status }: { status: MemberLinkStatus }) {
  if (status === 'none') return null

  const label =
    status === 'pending'
      ? 'Change pending approval'
      : status === 'approved'
        ? 'Linked'
        : 'Change rejected'

  const cls =
    status === 'pending'
      ? 'nav-status-pending'
      : status === 'approved'
        ? 'nav-status-approved'
        : 'nav-status-rejected'

  return (
    <span class="member-link-status" title={label}>
      <span class={`nav-status ${cls}`} aria-hidden="true" />
      <span class="member-link-status-label">{label}</span>
    </span>
  )
}
