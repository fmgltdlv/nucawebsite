import { themeOptions } from '../../../config/themes'
import type { BreakingNews, ContactInfo, FooterInfo } from '../../../lib/site-settings'
import { AdminShell } from '../../../views/AdminShell'
import type { AdminContext } from '../../../lib/admin-context'
import type { PageProps } from '../../../types/page'

export function AdminContentSettingsPage({
  theme,
  ctx,
  contact,
  footer,
  themeId,
  breakingNews,
  flash,
}: PageProps & {
  ctx: AdminContext
  contact: ContactInfo
  footer: FooterInfo
  themeId: string
  breakingNews: BreakingNews
  flash?: string
}) {
  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="Site settings"
      activePath="/admin/content"
    >
      <p class="admin-note">
        <a href="/admin/content">← Content</a>
      </p>
      {flash && <p class="admin-flash">{flash}</p>}
      <form class="form admin-form-section" method="post" action="/admin/content/settings">
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
          Show breaking news alert on public site
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
            value={breakingNews.expiresAt ? toLocalDatetime(breakingNews.expiresAt) : ''}
          />
        </div>

        <button type="submit" class="btn btn-primary">Save settings</button>
      </form>
    </AdminShell>
  )
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
