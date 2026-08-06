type AdminFileDropZoneProps = {
  id: string
  name: string
  accept: string
  fieldLabel: string
  dropText?: string
  hint?: string
  multiple?: boolean
  required?: boolean
}

export function AdminFileDropZone({
  id,
  name,
  accept,
  fieldLabel,
  dropText = 'click here or drag and drop images here.',
  hint,
  multiple,
  required,
}: AdminFileDropZoneProps) {
  return (
    <div class="form-field">
      <span class="form-label" id={`${id}-label`}>
        {fieldLabel}
      </span>
      <div class="admin-file-drop-zone" data-file-drop-zone>
        <input
          type="file"
          name={name}
          id={id}
          class="admin-file-drop-input visually-hidden"
          accept={accept}
          multiple={multiple}
          required={required}
          aria-labelledby={`${id}-label`}
        />
        <label for={id} class="admin-file-drop-label">
          <span class="admin-file-drop-text">{dropText}</span>
          <span class="admin-file-drop-selected muted" data-file-drop-selected hidden></span>
        </label>
      </div>
      {hint && <p class="form-hint">{hint}</p>}
    </div>
  )
}
