import { memberTypes, site } from '../data/demo'
import {
  MEMBERSHIP_APPLICATION_PDF_URL,
  KEY_PERSON_ROW_COUNT,
  applicationCommittees,
  associateProducts,
  associateRevenueTiers,
  contractorBusinessAreas,
  contractorRevenueTiers,
  institutionalCategories,
  paymentMethods,
} from '../data/membership-application'

function applicationDateDefault(): string {
  return new Date().toISOString().slice(0, 10)
}

export function JoinApplicationForm() {
  const today = applicationDateDefault()

  return (
    <form class="form form-wide join-application-form" method="post" action="/join" id="join-form">
      <fieldset class="form-section">
        <legend>Membership application</legend>
        <p class="form-hint">
          Fields mirror the{' '}
          <a href={MEMBERSHIP_APPLICATION_PDF_URL} target="_blank" rel="noopener noreferrer">
            printable PDF application
          </a>
          . Membership renews every January.
        </p>
        <div class="form-row">
          <div class="form-field">
            <label for="application_date">Today&apos;s date</label>
            <input type="date" name="application_date" id="application_date" value={today} required />
          </div>
          <div class="form-field">
            <label for="member_type">Membership type</label>
            <select name="member_type" id="member_type" required>
              <option value="">Select…</option>
              {memberTypes.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

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
            <input type="text" name="state" id="state" required autoComplete="address-level1" maxLength={2} placeholder="NV" />
          </div>
          <div class="form-field">
            <label for="zip">Zip</label>
            <div class="zip-row">
              <input type="text" name="zip" id="zip" required autoComplete="postal-code" inputMode="numeric" />
              <span class="zip-sep">–</span>
              <input
                type="text"
                name="zip_ext"
                id="zip_ext"
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={4}
                placeholder="Plus 4"
                aria-label="Zip extension"
              />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="company_phone">Phone</label>
            <input type="tel" name="company_phone" id="company_phone" required autoComplete="tel" />
          </div>
          <div class="form-field">
            <label for="website">Website</label>
            <input type="url" name="website" id="website" placeholder="https://" autoComplete="url" />
          </div>
        </div>
      </fieldset>

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

      <p class="form-hint join-type-placeholder" id="join-type-placeholder">
        Select a membership type above to show dues and category questions for that application.
      </p>

      <fieldset class="form-section" id="join-membership-details" hidden>
        <legend>Membership details</legend>

        <div class="join-type-panel" data-member-type="contractor" hidden>
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

        <div class="join-type-panel" data-member-type="associate" hidden>
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

        <div class="join-type-panel" data-member-type="institutional" hidden>
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

      <fieldset class="form-section">
        <legend>Committee participation</legend>
        <p class="form-hint">Employees interested in serving on a committee (optional).</p>
        <ul class="committee-interest-list">
          {applicationCommittees.map((committee) => (
            <li key={committee.id}>
              <p class="committee-interest-label">{committee.label}</p>
              <div class="form-row">
                <div class="form-field">
                  <label for={`committee_${committee.id}_name`}>Name</label>
                  <input type="text" name={`committee_${committee.id}_name`} id={`committee_${committee.id}_name`} />
                </div>
                <div class="form-field">
                  <label for={`committee_${committee.id}_email`}>Email</label>
                  <input type="email" name={`committee_${committee.id}_email`} id={`committee_${committee.id}_email`} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </fieldset>

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
      <button type="submit" class="btn btn-primary">
        Submit application (demo)
      </button>
    </form>
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
