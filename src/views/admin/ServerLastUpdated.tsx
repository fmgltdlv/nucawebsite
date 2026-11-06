import type { ServerLastUpdated as ServerLastUpdatedValue } from '../../lib/worker-version'

export function ServerLastUpdated({
  value,
  className = 'admin-server-updated',
}: {
  value: ServerLastUpdatedValue
  className?: string
}) {
  return (
    <p class={className}>
      <span class="admin-server-updated-label">Server last updated</span>
      {value.iso ? (
        <time datetime={value.iso}>{value.label}</time>
      ) : (
        <span>{value.label}</span>
      )}
    </p>
  )
}
