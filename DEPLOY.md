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

## Admin login (no bootstrap flow)

1. Set Worker secrets (see below).
2. On first visit to `/admin`, the Worker **creates** the admin user from `ADMIN_EMAIL` + `ADMIN_PASSWORD` if the database has no admins.
3. Sign in at **/admin/login** with that email and password.

## Staff roles (`users` table)

| Role | Access |
|------|--------|
| **Admin** | Full portal: members, events, users & roles, content hub |
| **Chair** | Events + committee pages assigned in **Users & roles** |
| **Member** | **My listing** — website, phone, email on linked `members` row |

Admins create Chair/Member accounts at **/admin/users**. Member users request a company link at **/admin/profile**; admins approve requests on **/admin/users** (pending queue at top).

Apply migrations before using roles (`0002_users_roles.sql`) and member link approval (`0003_member_link_approval.sql`).

Default email (Wrangler var): `info@nucalasvegas.com` — change in `wrangler.jsonc` `vars.ADMIN_EMAIL` if needed.

## Secrets (Worker)

| Secret | Purpose |
|--------|---------|
| `JWT_SECRET` | Signs admin session JWT cookies |
| `ADMIN_PASSWORD` | Password for the pre-seeded admin (and login) |

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_PASSWORD
```

Local copies live in **`.dev.vars`** (not committed).

## Local development

```bash
cp .dev.vars.example .dev.vars
npm run dev
```

## Migrations

```bash
npx wrangler d1 migrations apply nuca-lv --remote
```
