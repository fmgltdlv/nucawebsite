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

### Turnstile (optional bot protection)

Turnstile is **wired but off** until you add **both** keys. If only one key is set, login and public forms fail closed (the security check is rejected).

1. In [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), create a widget for your site hostname.
2. Set the **site key** (public) as a Worker var and the **secret key** as a Worker secret:

```bash
# wrangler.jsonc vars (or dashboard → Settings → Variables)
"TURNSTILE_SITE_KEY": "0x..."

npx wrangler secret put TURNSTILE_SECRET_KEY
```

3. Redeploy. The login form and public POST forms (contact, join, newsletter, RSVP) show the widget when `TURNSTILE_SITE_KEY` is set.
4. The Worker verifies `cf-turnstile-response` when `TURNSTILE_SECRET_KEY` is set.

If **neither** Turnstile key is set, forms work as before (rate limiting still applies).

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
| `TURNSTILE_SITE_KEY` | Optional Turnstile widget (public var) |
| `TURNSTILE_SECRET_KEY` | Optional Turnstile verification (secret) |

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_PASSWORD
# optional:
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
