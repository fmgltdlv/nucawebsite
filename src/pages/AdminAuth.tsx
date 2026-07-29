import { Layout, PageHeader } from '../views/Layout'
import type { PageProps } from '../types/page'

export function AdminLoginPage({ theme, error }: PageProps & { error?: string }) {
  return (
    <Layout theme={theme} title="Admin sign in">
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
            <button type="submit" class="btn btn-primary">Sign in</button>
          </form>
          <p class="form-hint">
            Default admin is created from <code>ADMIN_EMAIL</code> + <code>ADMIN_PASSWORD</code> on the Worker
            when no account exists yet.
          </p>
        </div>
      </section>
    </Layout>
  )
}

