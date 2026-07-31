/** Small numeric badge for admin nav items and portal link. */
export function AdminCountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  const label = count > 99 ? '99+' : String(count)
  return (
    <span class="admin-count-badge" aria-label={`${count} new`}>
      {label}
    </span>
  )
}
