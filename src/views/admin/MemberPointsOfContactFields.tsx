import type { MemberContact } from '../../data/demo'
import { MAX_MEMBER_POINTS_OF_CONTACT } from '../../lib/member-contacts'

export function MemberPointsOfContactFields({
  formIdPrefix = '',
  contacts,
}: {
  formIdPrefix?: string
  contacts?: MemberContact[]
}) {
  const slots = Array.from({ length: MAX_MEMBER_POINTS_OF_CONTACT }, (_, index) => ({
    index,
    name: contacts?.[index]?.name ?? '',
    email: contacts?.[index]?.email ?? '',
  }))

  return (
    <fieldset class="admin-fieldset member-poc-list">
      <legend>Points of contact</legend>
      <p class="form-hint">Up to {MAX_MEMBER_POINTS_OF_CONTACT}. Empty rows are hidden on the public member listing.</p>
      <div class="member-poc-list">
        {slots.map(({ index, name, email }) => {
          const nameId = `${formIdPrefix}poc-${index}-name`
          const emailId = `${formIdPrefix}poc-${index}-email`
          return (
            <div class="form-row member-poc-row" key={index}>
              <div class="form-field">
                <label for={nameId}>Name</label>
                <input
                  type="text"
                  name={`poc_${index}_name`}
                  id={nameId}
                  value={name}
                  autoComplete="name"
                />
              </div>
              <div class="form-field">
                <label for={emailId}>Email</label>
                <input
                  type="email"
                  name={`poc_${index}_email`}
                  id={emailId}
                  value={email}
                  autoComplete="email"
                />
              </div>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
