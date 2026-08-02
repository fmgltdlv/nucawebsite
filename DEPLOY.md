# Cloudflare deployment

Worker URL: **https://nucawebsite.thefieldmappinggroup.workers.dev**

## Resources

| Resource | Name | Binding |
|----------|------|---------|
| Worker | `nucawebsite` | — |
| D1 | `nuca-lv` | `DB` |
| R2 | `nuca-lv-assets` | `R2` |
| Email | Cloudflare Email Service | `EMAIL` |
| Static assets | `public/` | `ASSETS` |

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
| Session invalidation | `users.session_version` checked on each request |
| Audit log | D1 `admin_audit_log` — login, logout, user create, settings, newsletter export |
| Response headers | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` |

Apply migration `0021_security.sql` before deploying security updates.

### Login rate limiting: code vs Cloudflare dashboard

**In-code (implemented):** Uses D1, versioned with your app, works on any plan. Slight Worker/DB cost per login attempt.

**Cloudflare dashboard rule (optional extra layer):** Blocks brute-force at the edge before your Worker runs. Recommended on paid plans if login abuse is a concern. Configure a rate limiting rule for `POST /admin/login` (e.g. 10 requests / minute / IP).

Use both for defense in depth, or code-only if you prefer everything in the repo.

### Turnstile (optional bot protection)

Turnstile is **wired but off** until you add keys.

1. In [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), create a widget for your site hostname.
2. Set the **site key** (public) as a Worker var and the **secret key** as a Worker secret:

```bash
# wrangler.jsonc vars (or dashboard → Settings → Variables)
"TURNSTILE_SITE_KEY": "0x..."

npx wrangler secret put TURNSTILE_SECRET_KEY
```

3. Redeploy. The login form shows the Turnstile widget automatically when `TURNSTILE_SITE_KEY` is set.
4. The Worker verifies `cf-turnstile-response` on POST `/admin/login` when `TURNSTILE_SECRET_KEY` is set.

If neither Turnstile key is set, login works as before (rate limiting still applies).

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
