import {
  LEADERSHIP_ROLE_OPTIONS,
  leadershipRoleOptionsForValue,
} from '../../lib/leadership-roles'

export function LeadershipRoleSelect({
  id,
  name = 'role_title',
  value,
  required = true,
}: {
  id: string
  name?: string
  value?: string
  required?: boolean
}) {
  const options = leadershipRoleOptionsForValue(value ?? '')
  const selected = value?.trim() ?? ''
  const hasLegacyOption = options.length > LEADERSHIP_ROLE_OPTIONS.length

  return (
    <select name={name} id={id} required={required}>
      {!selected && <option value="">Select a role…</option>}
      {hasLegacyOption && (
        <option value={selected} selected>
          {selected} (legacy)
        </option>
      )}
      {LEADERSHIP_ROLE_OPTIONS.map((option) => (
        <option
          key={option.label}
          value={option.label}
          selected={!hasLegacyOption && selected.toLowerCase() === option.label.toLowerCase()}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}
