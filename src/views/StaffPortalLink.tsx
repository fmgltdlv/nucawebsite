/** Icon-only header link for secretary/admin (no visible “Sign in” label). */
export function StaffPortalLink() {
  return (
    <a class="portal-link" href="/admin" aria-label="Staff portal">
      <svg
        class="portal-icon"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" />
      </svg>
    </a>
  )
}
