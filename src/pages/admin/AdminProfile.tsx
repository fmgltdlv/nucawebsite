import type { Member } from '../../data/demo'
import { memberTypeLabel } from '../../data/demo'
import { padPointsOfContact } from '../../lib/member-contacts'
import { AdminShell } from '../../views/AdminShell'
import { MemberPointsOfContactFields } from '../../views/admin/MemberPointsOfContactFields'
import { MemberLinkStatusDot } from '../../views/MemberLinkStatus'
import type { AdminContext } from '../../lib/admin-context'
import type { PageProps } from '../../types/page'

export function AdminProfilePage({
  theme,
  ctx,
  member,
  pendingMember,
  companies,
  flash,
  error,
}: PageProps & {
  ctx: AdminContext
  member: Member | null
  pendingMember: Member | null
  companies: Member[]
  flash?: string
  error?: string
}) {
  const { user } = ctx
  const isPending = user.member_link_status === 'pending'
  const canEditListing = Boolean(user.member_id && user.member_link_status !== 'none')

  return (
    <AdminShell
      theme={theme}
      user={ctx.user}
      chairCommittees={ctx.chairCommittees}
      title="My listing"
      activePath="/admin/profile"
    >
      {flash && <p class="admin-flash">{flash}</p>}
      {error && <p class="form-hint-warn">{error}</p>}

      <section class="admin-form-section">
        <h2>Member company</h2>
        <p class="section-lead">
          Select your company from the chapter directory. Changes require admin approval before they take effect on the public site.
        </p>

        {member && (
          <div class="member-link-row">
            <MemberLinkStatusDot status="approved" />
            <p>
              <strong>Current listing:</strong> {member.company} ({memberTypeLabel[member.type]})
            </p>
          </div>
        )}

        {isPending && pendingMember && (
          <div class="member-link-row member-link-row-pending">
            <MemberLinkStatusDot status="pending" />
            <p>
              <strong>Requested change:</strong> {pendingMember.company} ({memberTypeLabel[pendingMember.type]})
              — waiting for admin approval. Your public listing is unchanged until then.
            </p>
          </div>
        )}

        {!isPending && (
          <form class="form" method="post" action="/admin/profile/link">
            <div class="form-field">
              <label for="member_id">
                {member ? 'Change to a different company' : 'Select your company'}
              </label>
              <select name="member_id" id="member_id" required>
                <option value="">Choose a company…</option>
                {companies.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    selected={c.id === user.member_id}
                  >
                    {c.company} ({memberTypeLabel[c.type]})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" class="btn btn-primary">
              {member ? 'Request company change' : 'Request company link'}
            </button>
          </form>
        )}

        {user.member_link_status === 'rejected' && !member && (
          <p class="form-hint-warn">
            Your last company link request was declined. You can submit a new request above.
          </p>
        )}
      </section>

      {canEditListing && member ? (
        <section class="admin-form-section">
          <h2>Listing contact info</h2>
          <p class="section-lead">
            Company name and type are managed by staff. You can update website, phone, email, and points of contact for your approved listing.
          </p>
          <form class="form" method="post" action="/admin/profile">
            <div class="form-field">
              <label for="website">Website</label>
              <input type="url" name="website" id="website" value={member.website ?? ''} />
            </div>
            <div class="form-field">
              <label for="phone">Phone</label>
              <input type="tel" name="phone" id="phone" value={member.phone ?? ''} />
            </div>
            <div class="form-field">
              <label for="email">Public email</label>
              <input type="email" name="email" id="email" value={member.email ?? ''} />
            </div>
            <MemberPointsOfContactFields contacts={padPointsOfContact(member.contacts ?? [])} />
            <button type="submit" class="btn btn-primary">Save changes</button>
          </form>
        </section>
      ) : !member && !isPending ? (
        <p class="form-hint-warn">
          Once your company link is approved, you can edit your listing contact info here.
        </p>
      ) : null}
    </AdminShell>
  )
}
