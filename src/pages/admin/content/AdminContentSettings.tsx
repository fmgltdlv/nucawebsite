import { themeOptions } from '../../../config/themes'
import { toDatetimeLocalValue } from '../../../lib/datetime'
import { SOCIAL_PLATFORMS } from '../../../lib/social-links'
import { DEFAULT_SITE_LOGO_URL, LOGO_SIZE_MAX_PERCENT, LOGO_SIZE_MIN_PERCENT } from '../../../lib/site-logo'
import type { BreakingNews, ContactInfo, FooterInfo, HeaderBranding } from '../../../lib/site-settings'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

export function AdminContentSettingsPage({
  ctx,
  contact,
  footer,
  themeId,
  breakingNews,
  logoUrl,
  logoSizePercent,
  headerBranding,
  flash,
  error,
  ...site
}: PageProps & {
  ctx: AdminContext
  contact: ContactInfo
  footer: FooterInfo
  themeId: string
  breakingNews: BreakingNews
  logoUrl: string
  logoSizePercent: number
  headerBranding: HeaderBranding
  flash?: string
  error?: string
}) {
  return (
    <AdminShell
      {...site}
      contact={contact}
      footer={footer}
      logoUrl={logoUrl}
      logoSizePercent={logoSizePercent}
      headerBranding={headerBranding}
      breakingNews={breakingNews}
      user={ctx.user}
      inboxCounts={ctx.inboxCounts}
      csrfToken={ctx.csrfToken}
      title="Site settings"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="form-hint-warn">{error}</p>}
      <form
        class="form admin-form-section"
        method="post"
        action="/admin/content/settings"
        encType="multipart/form-data"
      >
        <h2>Site logo</h2>
        <p class="admin-note">
          Shown in the site header on every public page. PNG, JPEG, WebP, or SVG up to 2 MB.
        </p>
        <div class="form-field">
          <label for="site_logo">Header logo</label>
          <img
            src={logoUrl}
            alt="Current site logo"
            class="admin-modal-logo-preview"
            width={231}
            height={77}
          />
          <input type="file" name="site_logo" id="site_logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
          <div class="form-field">
            <label for="logo_size_percent">Logo size (%)</label>
            <input
              type="number"
              name="logo_size_percent"
              id="logo_size_percent"
              min={LOGO_SIZE_MIN_PERCENT}
              max={LOGO_SIZE_MAX_PERCENT}
              step={5}
              value={logoSizePercent}
            />
            <p class="form-hint">
              100% is the default header size. Range is {LOGO_SIZE_MIN_PERCENT}–{LOGO_SIZE_MAX_PERCENT}%.
            </p>
          </div>
          {logoUrl !== DEFAULT_SITE_LOGO_URL && (
            <label class="admin-check">
              <input type="checkbox" name="remove_site_logo" value="1" />
              Remove custom logo (revert to default)
            </label>
          )}
        </div>

        <h3>Header title</h3>
        <p class="admin-note">Optional title and tagline shown in the site header next to or under the logo.</p>
        <div class="form-field">
          <label for="header_title">Header title</label>
          <input
            type="text"
            name="header_title"
            id="header_title"
            value={headerBranding.title}
            placeholder="NUCA of Las Vegas"
          />
        </div>
        <div class="form-field">
          <label for="header_subtitle">Header subtitle (optional)</label>
          <input
            type="text"
            name="header_subtitle"
            id="header_subtitle"
            value={headerBranding.subtitle ?? ''}
            placeholder="We Dig Las Vegas"
          />
        </div>
        <fieldset class="form-field">
          <legend>Title placement</legend>
          <label class="admin-check">
            <input
              type="radio"
              name="header_title_placement"
              value="none"
              checked={headerBranding.placement === 'none'}
            />
            Hidden (logo only)
          </label>
          <label class="admin-check">
            <input
              type="radio"
              name="header_title_placement"
              value="beside"
              checked={headerBranding.placement === 'beside'}
            />
            Next to logo
          </label>
          <label class="admin-check">
            <input
              type="radio"
              name="header_title_placement"
              value="below"
              checked={headerBranding.placement === 'below'}
            />
            Under logo
          </label>
        </fieldset>

        <h2>Contact information</h2>
        <div class="form-field">
          <label for="name">Organization name</label>
          <input type="text" name="name" id="name" value={contact.name} required />
        </div>
        <div class="form-field">
          <label for="phone">Phone</label>
          <input type="text" name="phone" id="phone" value={contact.phone} required />
        </div>
        <div class="form-field">
          <label for="email">Email</label>
          <input type="email" name="email" id="email" value={contact.email} required />
        </div>
        <div class="form-field">
          <label for="address">Address</label>
          <textarea name="address" id="address" rows={2} required>
            {contact.address}
          </textarea>
        </div>
        <div class="form-field">
          <label for="hours">Hours (optional)</label>
          <input type="text" name="hours" id="hours" value={contact.hours ?? ''} />
        </div>

        <h2>Social media</h2>
        <p class="admin-note">Optional profile or page URLs. Leave blank to hide on the site.</p>
        {SOCIAL_PLATFORMS.map((platform) => (
          <div class="form-field" key={platform.key}>
            <label for={`social_${platform.key}`}>{platform.label}</label>
            <input
              type="url"
              name={`social_${platform.key}`}
              id={`social_${platform.key}`}
              value={contact.social?.[platform.key] ?? ''}
              placeholder={platform.placeholder}
            />
          </div>
        ))}

        <h2>Footer</h2>
        <div class="form-field">
          <label for="dirt_blurb">THE DIRT blurb</label>
          <input type="text" name="dirt_blurb" id="dirt_blurb" value={footer.dirtBlurb ?? ''} />
        </div>
        <div class="form-field">
          <label for="copyright_note">Copyright note (optional)</label>
          <input type="text" name="copyright_note" id="copyright_note" value={footer.copyrightNote ?? ''} />
        </div>

        <h2>Appearance</h2>
        <div class="form-field">
          <label for="theme_id">Default site theme</label>
          <select name="theme_id" id="theme_id">
            {themeOptions.map((opt) => (
              <option value={opt.id} selected={themeId === opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <h2>Breaking news</h2>
        <label class="admin-check">
          <input type="checkbox" name="breaking_active" value="1" checked={breakingNews.active} />
          Show breaking news banner on public site
        </label>
        <label class="admin-check">
          <input type="checkbox" name="breaking_popup" value="1" checked={breakingNews.showPopup} />
          Show popup on home page when visitors arrive
        </label>
        <div class="form-field">
          <label for="breaking_title">Headline</label>
          <input type="text" name="breaking_title" id="breaking_title" value={breakingNews.title} />
        </div>
        <div class="form-field">
          <label for="breaking_body">Message</label>
          <textarea name="breaking_body" id="breaking_body" rows={3}>
            {breakingNews.body}
          </textarea>
        </div>
        <div class="form-field">
          <label for="breaking_link">Read more URL (optional)</label>
          <input type="url" name="breaking_link" id="breaking_link" value={breakingNews.link ?? ''} />
        </div>
        <div class="form-field">
          <label for="breaking_expires">Expires (optional, local date/time)</label>
          <input
            type="datetime-local"
            name="breaking_expires"
            id="breaking_expires"
            value={breakingNews.expiresAt ? toDatetimeLocalValue(breakingNews.expiresAt) : ''}
          />
        </div>

        <button type="submit" class="btn btn-primary">Save settings</button>
      </form>
    </AdminShell>
  )
}
