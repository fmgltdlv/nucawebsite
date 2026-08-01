import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import type { PageProps } from '../types/page'

export function AdminLoginPage({
  error,
  turnstileSiteKey,
  ...site
}: PageProps & { error?: string; turnstileSiteKey?: string }) {
  return (
    <Layout {...pickLayoutSite(site)} title="Admin sign in">
      <PageHeader title="Staff sign in" lead="Secretary and authorized staff only." />
      <section class="section">
        <div class="container">
          {error && <p class="form-hint form-hint-warn">{error}</p>}
          <form class="form" method="post" action="/admin/login">
            <div class="form-field">
              <label for="email">Email</label>
              <input type="email" name="email" id="email" required autocomplete="username" />
            </div>
            <div class="form-field">
              <label for="password">Password</label>
              <input type="password" name="password" id="password" required autocomplete="current-password" />
            </div>
            {turnstileSiteKey ? (
              <div class="form-field">
                <div class="cf-turnstile" data-sitekey={turnstileSiteKey} />
              </div>
            ) : null}
            <button type="submit" class="btn btn-primary">Sign in</button>
          </form>
        </div>
      </section>
      {turnstileSiteKey ? (
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      ) : null}
    </Layout>
  )
}
