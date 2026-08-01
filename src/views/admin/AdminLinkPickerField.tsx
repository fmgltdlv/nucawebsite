import type { SiteInternalLink } from '../../lib/site-internal-links'

export function AdminLinkPickerField({
  id,
  name = 'href',
  value = '',
  internalLinks,
  allowEmpty = false,
  label = 'Link',
  hint,
  inputClass,
}: {
  id: string
  name?: string
  value?: string
  internalLinks: SiteInternalLink[]
  allowEmpty?: boolean
  label?: string
  hint?: string
  inputClass?: string
}) {
  return (
    <div class="form-field">
      <label for={id}>{label}</label>
      <div
        class="admin-link-picker-host"
        data-admin-link-picker
        data-internal-links={JSON.stringify(internalLinks)}
        data-allow-empty={allowEmpty ? '1' : '0'}
      >
        <input
          type="hidden"
          name={name}
          id={id}
          value={value}
          class={inputClass}
          data-link-picker-output
        />
      </div>
      {hint ? <p class="form-hint">{hint}</p> : null}
    </div>
  )
}
