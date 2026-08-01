import { site } from '../data/demo'
import {
  MEMBERSHIP_APPLICATION_PDF_URL,
  KEY_PERSON_ROW_COUNT,
  associateProducts,
  associateRevenueTiers,
  contractorBusinessAreas,
  contractorRevenueTiers,
  institutionalCategories,
  paymentMethods,
} from '../data/membership-application'
import type { CommitteeRecord } from '../lib/committees-db'
import type { MembershipTypeRecord } from '../lib/membership-types-db'

const JOIN_APPLICATION_STEPS = [
  { id: 'membership', label: 'Membership' },
  { id: 'company', label: 'Company' },
  { id: 'contact', label: 'Contact' },
  { id: 'key-persons', label: 'Key persons' },
  { id: 'details', label: 'Details' },
  { id: 'committees', label: 'Committees' },
  { id: 'payment', label: 'Payment' },
] as const

function applicationDateDefault(): string {
  return new Date().toISOString().slice(0, 10)
}

export function JoinApplyButton({ className = 'btn btn-primary' }: { className?: string }) {
  return (
    <button type="button" class={className} data-join-application-open>
      Apply now
    </button>
  )
}

export function JoinApplicationModal({
  committees,
  membershipTypes = [],
}: {
  committees: CommitteeRecord[]
  membershipTypes?: MembershipTypeRecord[]
}) {
  const today = applicationDateDefault()
  const types =
    membershipTypes.length > 0
      ? membershipTypes
      : [
          { key: 'contractor', name: 'Contractor Member', description: '', sort_order: 0, published: 1 },
          { key: 'associate', name: 'Associate Member', description: '', sort_order: 1, published: 1 },
          { key: 'institutional', name: 'Institutional Member', description: '', sort_order: 2, published: 1 },
        ]

  return (
    <dialog
      id="join-application-dialog"
      class="join-application-dialog"
      aria-labelledby="join-application-dialog-title"
    >
      <article class="join-application-dialog-card">
        <header class="join-application-dialog-header">
          <div>
            <h2 id="join-application-dialog-title">Membership application</h2>
            <p class="join-application-dialog-lead">
              Complete the same information as the{' '}
              <a href={MEMBERSHIP_APPLICATION_PDF_URL} target="_blank" rel="noopener noreferrer">
                printable PDF application
              </a>
              . Membership renews every January.
            </p>
          </div>
          <button type="button" class="join-application-dialog-close" aria-label="Close" data-modal-close>
            ×
          </button>
        </header>

        <ol class="join-application-steps" aria-label="Application steps">
          {JOIN_APPLICATION_STEPS.map((step, index) => (
            <li key={step.id} data-join-step-indicator={step.id} data-step-index={String(index)}>
              <span class="join-application-step-num">{index + 1}</span>
              <span class="join-application-step-label">{step.label}</span>
            </li>
          ))}
        </ol>

        <form class="form form-wide join-application-form" method="post" action="/join" id="join-form">
          <div class="join-application-dialog-body">
            <section class="join-application-step is-active" data-join-step="membership" aria-label="Membership">
              <fieldset class="form-section">
                <legend>Membership</legend>
                <div class="form-row">
                  <div class="form-field">
                    <label for="application_date">Today&apos;s date</label>
                    <input type="date" name="application_date" id="application_date" value={today} required />
                  </div>
                  <div class="form-field">
                    <label for="member_type">Membership type</label>
                    <select name="member_type" id="member_type" required>
                      <option value="">Select…</option>
                      {types.map((t) => (
                        <option value={t.key} key={t.key}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>
            </section>

            <section class="join-application-step" data-join-step="company" aria-label="Company" hidden>
              <fieldset class="form-section">
                <legend>Company</legend>
                <div class="form-field">
                  <label for="company_name">Company name</label>
                  <input type="text" name="company_name" id="company_name" required autoComplete="organization" />
                </div>
                <div class="form-field">
                  <label for="mailing_address">Mailing address</label>
                  <input type="text" name="mailing_address" id="mailing_address" required autoComplete="street-address" />
                </div>
                <div class="form-row form-row-3">
                  <div class="form-field">
                    <label for="city">City</label>
                    <input type="text" name="city" id="city" required autoComplete="address-level2" />
                  </div>
                  <div class="form-field">
                    <label for="state">State</label>
                    <input
                      type="text"
                      name="state"
                      id="state"
                      required
                      autoComplete="address-level1"
                      maxLength={2}
                      placeholder="NV"
                    />
                  </div>
                  <div class="form-field">
                    <label for="zip">Zip</label>
                    <input type="text" name="zip" id="zip" required autoComplete="postal-code" inputMode="numeric" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label for="company_phone">Phone</label>
                    <input type="tel" name="company_phone" id="company_phone" required autoComplete="tel" />
                  </div>
                  <div class="form-field">
                    <label for="website">Website</label>
                    <input type="text" name="website" id="website" placeholder="example.com" autoComplete="url" />
                  </div>
                </div>
              </fieldset>
            </section>

            <section class="join-application-step" data-join-step="contact" aria-label="Main contact" hidden>
              <fieldset class="form-section">
                <legend>Main contact</legend>
                <div class="form-field">
                  <label for="contact_name">Main contact name</label>
                  <input type="text" name="contact_name" id="contact_name" required autoComplete="name" />
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label for="contact_title">Title</label>
                    <input type="text" name="contact_title" id="contact_title" required />
                  </div>
                  <div class="form-field">
                    <label for="contact_email">Email</label>
                    <input type="email" name="contact_email" id="contact_email" required autoComplete="email" />
                  </div>
                </div>
                <div class="form-field">
                  <label for="contact_phone">Phone</label>
                  <input type="tel" name="contact_phone" id="contact_phone" required autoComplete="tel" />
                </div>
              </fieldset>
            </section>

            <section class="join-application-step" data-join-step="key-persons" aria-label="Key persons" hidden>
              <fieldset class="form-section">
                <legend>Other owners, partners, managers, or key persons</legend>
                <p class="form-hint">Optional — list others who should receive notices from NUCA of Las Vegas.</p>
                <div class="key-person-rows">
                  {Array.from({ length: KEY_PERSON_ROW_COUNT }, (_, i) => {
                    const n = i + 1
                    return (
                      <div class="key-person-row" key={n}>
                        <p class="key-person-row-label">Person {n}</p>
                        <div class="form-row form-row-2x2">
                          <div class="form-field">
                            <label for={`key_person_${n}_name`}>Name</label>
                            <input type="text" name={`key_person_${n}_name`} id={`key_person_${n}_name`} />
                          </div>
                          <div class="form-field">
                            <label for={`key_person_${n}_title`}>Title</label>
                            <input type="text" name={`key_person_${n}_title`} id={`key_person_${n}_title`} />
                          </div>
                          <div class="form-field">
                            <label for={`key_person_${n}_email`}>Email</label>
                            <input type="email" name={`key_person_${n}_email`} id={`key_person_${n}_email`} />
                          </div>
                          <div class="form-field">
                            <label for={`key_person_${n}_phone`}>Phone</label>
                            <input type="tel" name={`key_person_${n}_phone`} id={`key_person_${n}_phone`} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </fieldset>
            </section>

            <section class="join-application-step" data-join-step="details" aria-label="Membership details" hidden>
              <p class="form-hint join-type-placeholder" id="join-type-placeholder">
                Select a membership type on step 1 to show dues and category questions for that application.
              </p>
              <fieldset class="form-section" id="join-membership-details">
                <legend>Membership details</legend>

                <div class="join-type-panel" data-member-type="contractor">
                  <h3 class="join-type-panel-title">Contractor member</h3>
                  <p class="form-hint">Dues are based on your company&apos;s total annual utility construction revenue.</p>
                  <ul class="form-radio-list">
                    {contractorRevenueTiers.map((tier) => (
                      <li key={tier.id}>
                        <label class="form-radio-label">
                          <input type="radio" name="revenue_tier" value={tier.id} data-member-type="contractor" />
                          <span>
                            {tier.label} — <strong>{tier.dues}</strong>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <h4 class="join-type-subtitle">Business areas</h4>
                  <p class="form-hint">Check areas that best describe your company&apos;s business.</p>
                  <div class="form-checkbox-grid form-checkbox-grid--compact">
                    {contractorBusinessAreas.map((area) => (
                      <label class="form-check-label" key={area.id}>
                        <input type="checkbox" name="contractor_areas" value={area.id} />
                        <span>{area.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div class="join-type-panel" data-member-type="associate">
                  <h3 class="join-type-panel-title">Associate member</h3>
                  <p class="form-hint">Dues are based on your company&apos;s total annual revenue.</p>
                  <ul class="form-radio-list">
                    {associateRevenueTiers.map((tier) => (
                      <li key={tier.id}>
                        <label class="form-radio-label">
                          <input type="radio" name="revenue_tier" value={tier.id} data-member-type="associate" />
                          <span>
                            {tier.label} — <strong>{tier.dues}</strong>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <h4 class="join-type-subtitle">Products &amp; services</h4>
                  <p class="form-hint">
                    Check up to five that best describe your services (this is how you are listed on nuca.com).
                  </p>
                  <div class="form-checkbox-grid">
                    {associateProducts.map((product) => (
                      <label class="form-check-label" key={product.id}>
                        <input type="checkbox" name="associate_products" value={product.id} />
                        <span>{product.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div class="join-type-panel" data-member-type="institutional">
                  <h3 class="join-type-panel-title">Institutional member</h3>
                  <p class="form-hint">
                    Annual dues of <strong>$1,350</strong> include chapter and national NUCA membership.
                  </p>
                  <h4 class="join-type-subtitle">Entity category</h4>
                  <ul class="form-radio-list">
                    {institutionalCategories.map((cat) => (
                      <li key={cat.id}>
                        <label class="form-radio-label">
                          <input type="radio" name="institutional_category" value={cat.id} />
                          <span>{cat.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div class="form-field">
                    <label for="institutional_other">Other description</label>
                    <input type="text" name="institutional_other" id="institutional_other" />
                  </div>
                </div>
              </fieldset>
            </section>

            <section class="join-application-step" data-join-step="committees" aria-label="Committee participation" hidden>
              <fieldset class="form-section">
                <legend>Committee participation</legend>
                <p class="form-hint">Employees interested in serving on a committee (optional).</p>
                <ul class="committee-interest-list">
                  {committees.map((committee) => (
                    <li key={committee.key}>
                      <p class="committee-interest-label">{committee.name}</p>
                      <div class="form-row">
                        <div class="form-field">
                          <label for={`committee_${committee.key}_name`}>Name</label>
                          <input
                            type="text"
                            name={`committee_${committee.key}_name`}
                            id={`committee_${committee.key}_name`}
                          />
                        </div>
                        <div class="form-field">
                          <label for={`committee_${committee.key}_email`}>Email</label>
                          <input
                            type="email"
                            name={`committee_${committee.key}_email`}
                            id={`committee_${committee.key}_email`}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </section>

            <section class="join-application-step" data-join-step="payment" aria-label="Payment" hidden>
              <fieldset class="form-section">
                <legend>Payment method</legend>
                <ul class="form-radio-list">
                  {paymentMethods.map((method) => (
                    <li key={method.id}>
                      <label class="form-radio-label">
                        <input type="radio" name="payment_method" value={method.id} required />
                        <span>{method.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
              <p class="form-hint form-hint-warn">
                Demo form — submissions are not stored yet. Production will email {site.email} and save to D1.
              </p>
            </section>
          </div>

          <footer class="join-application-dialog-footer">
            <button type="button" class="btn btn-secondary" data-join-step-prev hidden>
              Back
            </button>
            <button type="button" class="btn btn-primary" data-join-step-next>
              Next
            </button>
            <button type="submit" class="btn btn-primary" data-join-step-submit hidden>
              Submit application
            </button>
          </footer>
        </form>
      </article>
    </dialog>
  )
}

export function JoinApplicationAside() {
  return (
    <aside class="join-aside">
      <h3>PDF application</h3>
      <p>
        Prefer paper? Download the application, complete it, and email to{' '}
        <a href="mailto:jennifer@nucalasvegas.com">jennifer@nucalasvegas.com</a> or{' '}
        <a href="mailto:info@nucalasvegas.com">{site.email}</a>.
      </p>
      <a class="btn btn-secondary" href={MEMBERSHIP_APPLICATION_PDF_URL} target="_blank" rel="noopener noreferrer">
        Download PDF application
      </a>
      <p class="aside-note">
        For questions, contact Jennifer Bott at <a href="tel:7025778556">{site.phone}</a>.
      </p>
    </aside>
  )
}
