# Cloudflare deployment

**Account:** Nucalv.it@gmail.com (`ded6f41ae76367e770374f96348202dc`)

| URL | Purpose |
|-----|---------|
| **https://www.nucalasvegas.com** | Production (Worker custom domain) |
| **https://nucalasvegas.com** | Production apex (Worker custom domain) |
| **https://nucawebsite.nucalv-it.workers.dev** | Worker direct (`workers.dev`) |

## Domain & DNS

| Layer | Provider | Notes |
|-------|----------|--------|
| Registrar | GoDaddy | Owns `nucalasvegas.com` |
| DNS | Cloudflare | Zone on Nucalv.it account; nameservers at GoDaddy point to Cloudflare |
| Hosting | Cloudflare Worker | `nucawebsite` with custom domains on apex and www |

The legacy **Pages front-door** (`frontdoor/`, `nucawebsite.pages.dev`, `test.nucalasvegas.com`, SiteGround web DNS) is **retired**. Confirm **MX / SPF / DKIM** for chapter email in the Cloudflare zone before changing mail records.

## Resources

| Resource | Name | Binding |
|----------|------|---------|
| Worker | `nucawebsite` | — |
| D1 | `nuca-lv` | `DB` |
| R2 | `nuca-lv-assets` | `R2` |
| Email | Cloudflare Email Service | `EMAIL` |
| Static assets | `public/` | `ASSETS` |

## Deploy

```bash
npm run deploy
```

Optional legacy script `npm run deploy:frontdoor` only applies if you intentionally use `frontdoor/` again.

### Verify

| Check | URL |
|-------|-----|
| Homepage | https://www.nucalasvegas.com and https://nucalasvegas.com |
| Admin login | https://www.nucalasvegas.com/admin/login |
| R2 assets | Member logos, event flyers, PDFs |
| Contact form | Submit a test message |
| Email | Send to `info@nucalasvegas.com` (per MX in Cloudflare DNS) |

---

## Admin access

All staff portal users are **admins** with full access. (Legacy chair/member roles were removed in migration `0019_admins_only.sql`.)

1. Set Worker secrets (see below).
2. On first visit to `/admin`, the Worker creates the first admin from `ADMIN_EMAIL` + `ADMIN_PASSWORD` when the database has no users.
3. Sign in at **/admin/login**.

Default email (Wrangler var): `info@nucalasvegas.com` — change in `wrangler.jsonc` `vars.ADMIN_EMAIL` if needed.

## Security features

| Feature | Implementation |
|---------|----------------|
| Session cookies | HttpOnly JWT, `Secure` on HTTPS, `SameSite=Lax`, 24-hour TTL |
| CSRF | Token in JWT; `admin-security.js` adds to forms and `fetch` POSTs |
| Login rate limit | 5 failed attempts / IP / 15 min (D1 `login_attempts` table) |
| Public form rate limit | 8 submissions / IP / action / 15 min (D1 `form_attempts`; contact, join, newsletter, RSVP) |
| Session invalidation | `users.session_version` checked on each request |
| JWT in production | Worker refuses admin sessions if `JWT_SECRET` is missing, under 32 characters, or a known dev default |
| Private R2 objects | `applications/` is admin-only; public `/assets/*` cannot fetch membership PDFs |
| Audit log | D1 `admin_audit_log` — login, logout, user create, settings, newsletter export |
| Response headers | `Content-Security-Policy`, `Strict-Transport-Security` (HTTPS), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` |

Apply migrations `0021_security.sql` and `0030_form_attempts.sql` before deploying these updates.

### Login rate limiting: code vs Cloudflare dashboard

**In-code (implemented):** Uses D1, versioned with your app, works on any plan. Slight Worker/DB cost per login attempt.

**Cloudflare dashboard rule (optional extra layer):** Blocks brute-force at the edge before your Worker runs. Recommended on paid plans if login abuse is a concern. Configure a rate limiting rule for `POST /admin/login` (e.g. 10 requests / minute / IP).

Use both for defense in depth, or code-only if you prefer everything in the repo.

### Turnstile (bot protection)

Turnstile is **on** when both keys are set. If only one key is set, login and public forms fail closed.

The Worker also requires Siteverify `action` to match the form (`contact`, `join`, `newsletter`, `rsvp`, `login`) and `hostname` to be listed in `TURNSTILE_HOSTNAMES`. Production hostnames must not include `localhost` or `127.0.0.1`.

1. Create a managed widget for `www.nucalasvegas.com`, `nucalasvegas.com`, `localhost`, and `127.0.0.1`.
2. Set the **site key** (public) and hostname allowlist as Worker vars, and the **secret key** as a Worker secret:

```bash
# wrangler.jsonc vars
"TURNSTILE_SITE_KEY": "0x..."
"TURNSTILE_HOSTNAMES": "www.nucalasvegas.com,nucalasvegas.com"

npx wrangler secret put TURNSTILE_SECRET_KEY
```

3. Redeploy. The login form and public POST forms (contact, join, newsletter, RSVP) show the widget when `TURNSTILE_SITE_KEY` is set.
4. The Worker verifies `cf-turnstile-response` with Siteverify.

If **neither** Turnstile key is set, forms work as before (rate limiting still applies). Local `.dev.vars` should set `TURNSTILE_HOSTNAMES=localhost,127.0.0.1`.

### Bootstrap admin password

`ADMIN_PASSWORD` is only used to create the first admin when the `users` table is empty. After you sign in and (if you want) create another admin:

1. Change the seeded account password in **Staff portal → Profile**.
2. Remove the Worker secret (`npx wrangler secret delete ADMIN_PASSWORD`) so wiping `users` cannot recreate that password.

Keep `JWT_SECRET` as a long random value (32+ characters). Production login returns 500 if it is missing, too short, or still a documented dev default.

## Secrets (Worker)

| Secret / var | Purpose |
|--------------|---------|
| `JWT_SECRET` | Signs admin session JWT cookies (use 32+ random characters) |
| `ADMIN_PASSWORD` | Password for the pre-seeded admin |
| `TURNSTILE_SITE_KEY` | Turnstile widget (public var) |
| `TURNSTILE_SECRET_KEY` | Turnstile verification (secret) |
| `TURNSTILE_HOSTNAMES` | Comma-separated frontend hostnames allowed by Siteverify |

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Local copies live in **`.dev.vars`** (not committed).

## Local development

```bash
cp .dev.vars.example .dev.vars
npm run dev
```

## Migrations

```bash
npm run migrate
npm run migrate:local
```
