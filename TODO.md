# NUCA Las Vegas website — To do

Track rebuild work for the Cloudflare (Hono + D1) site. Nav structure below reflects **current product decisions** (not necessarily the old WordPress menu).

## Navigation structure (target)

| Top level | Submenu |
|-----------|---------|
| Home | — |
| About | Q & A, Leadership, Member List, Events |
| Committees | → NUCA Las Vegas Scholarships |
| Industry Updates | → THE DIRT (PDF archive) |
| Resources | — |
| Join NUCA of Las Vegas Today! | — |
| Contact Us | — |

- [x] Demo nav aligned to structure above (`src/nav/site-nav.ts`)
- [ ] Confirm final labels with chapter staff (e.g. “Committees” vs “Advocacy” on live site)
- [ ] Redirect `/advocacy` → `/about/committees` after cutover

## Newsletter submission (must wire up)

**THE DIRT email list** — form on Contact (`#newsletter`) → `POST /newsletter/subscribe` (route exists; demo thank-you only).

- [ ] Decide provider: Mailchimp / Constant Contact / Brevo API vs manual list in D1 + staff export
- [ ] Optional fields: email (required), name, consent timestamp, source URL
- [ ] Turnstile on subscribe form
- [ ] Validate + sanitize email server-side; rate limit per IP
- [ ] On success: add subscriber via provider API **or** row in `newsletter_subscribers` + email staff
- [ ] Cloudflare Email Service: optional confirmation email to subscriber
- [ ] Double opt-in if provider requires it (match current site / legal preference)
- [ ] Error UX on Contact page (inline errors, not silent failure)
- [ ] Remove demo hint on Contact when live
- [ ] Home/footer subscribe widgets if needed (same endpoint)

Implementation hook: `src/index.tsx` → `app.post('/newsletter/subscribe', ...)`.

---

## Content — copy from live site

Status dots in the demo nav: **green** = demo, **orange** = stub, **gray** = not copied.

| Page | Route | Status | Notes |
|------|--------|--------|--------|
| Home | `/` | Demo | Match hero, relocation notice, Roosevelt quote, event teasers |
| About | `/about` | Stub | Chapter overview; link subpages |
| Q & A | `/about/q-and-a` | Stub | **Admin-editable** Q&A list |
| Leadership | `/about/leadership` | Stub | Copy from live; photos optional |
| Member List | `/members` | Demo | Real data from D1 + admin |
| Events | `/events` | Demo | Under About in nav; **admin-managed** |
| Committees | `/about/committees` | Stub | Former Advocacy content + committee info |
| NUCA Las Vegas Scholarships | `/scholarships` | To copy | Under Committees in nav |
| Industry Updates | `/industry-updates` | To copy | Blog/posts listing |
| THE DIRT | `/about/the-dirt` | Demo | PDF archive; in-browser viewer at `/about/the-dirt/:id` |
| Resources | `/resources` | To copy | **Admin-editable** links & documents |
| Join | `/join` | Demo | Benefits, types, application |
| Contact Us | `/contact` | Demo | Form + newsletter; **contact info from admin** |

---

## THE DIRT (PDF archive)

Weekly / periodic **news releases as PDFs**, distinct from Industry Updates (web posts) and the **email subscribe** form on Contact.

- [x] Archive list page (`/about/the-dirt`)
- [x] Per-issue viewer with embedded PDF (`/about/the-dirt/:id`) + download / new tab
- [ ] D1 table `dirt_releases` (exists in schema) — wire public list to D1
- [ ] **Admin:** upload PDF → R2, title, date, summary, publish / unpublish (`/admin` THE DIRT section)
- [ ] Serve PDFs from R2 (public bucket or Worker proxy) so iframe preview stays on-site
- [ ] Migrate historical PDFs from current site / email archive

---

## Q & A (admin-editable)

- [x] Demo page with sample questions including **“What is NUCA?”**
- [ ] D1 table e.g. `qa_items` (`id`, `question`, `answer_md`, `sort_order`, `published`)
- [ ] Admin: add / edit / reorder / hide questions
- [ ] Public: render ordered list; optional expand/collapse UX
- [ ] Seed production with live-site copy for “What is NUCA?” and other FAQs

**Seed content (from live home page — verify before publish):**

> NUCA is the National Utility Contractors Association — the leading trade association working solely for the utility construction and excavation industry in the United States. NUCA’s nationwide network of state/regional Chapters and member companies represent utility contractors, excavators, suppliers, manufacturers, and other providers in the water, sewer, gas, electric, telecommunications, treatment plant, and excavation industries.

---

## Committees & scholarships

- [x] Committees page route (`/about/committees`) — advocacy-style stub
- [ ] Copy committee list, chairs, and meeting info from live site
- [ ] Scholarships content under Committees nav (route `/scholarships`)
- [ ] Clarify: Legislative Affairs / advocacy copy lives on Committees or separate section?

---

## Secretary admin panel

- [x] Auth — JWT login, roles (Admin / Chair / Member)
- [ ] **Members** — CRUD, **current vs pending payment** (`active` / optional `membership_status`), types, export; pending hidden from public list; **company detail page** with linked contacts
- [ ] **Events** — CRUD, dates, registration URL, archive
- [ ] **Leadership** — CRUD, roles, photos (R2)
- [ ] **Q & A** — CRUD, reorder
- [ ] **THE DIRT releases** — upload PDF (R2), metadata, publish (see **THE DIRT** section)
- [ ] **Posts** — Industry Updates
- [ ] **Resources** — admin editor for page body + link/document list (`/resources`)
- [ ] **Editable pages** — markdown (Scholarships body, About, Committees)
- [ ] **Applications** — join form queue, status
- [ ] **Site settings** — **chapter contact info** (phone, email, address) for Contact + footer; footer copy, **default theme** (`theme_id`)
- [ ] **Breaking news** — admin-set alert (title, body, optional link, active until date); site-wide popup / banner

## Site themes (configurable)

- [x] Three CSS presets via `data-theme` on `<html>` (`desert`, `heritage`, `corporate`) — see `src/config/themes.ts`
- [x] Each preset bundles a **layout density** via `data-layout` (`standard`, `spacious`, `compact`): section spacing, page headers, hero, header height
- [x] Demo: footer **Appearance** dropdown → `POST /theme` → cookie `nuca_theme`
- [ ] Admin: set chapter default theme in D1 (`site_settings.theme_id`); optional hide public switcher
- [ ] Add more presets (colors + layout) in `themeOptions` + CSS blocks in `public/styles.css`
- [ ] **Not in scope yet:** alternate nav placement, different page templates, or per-page layouts — only global density tokens

---

## Backend & integrations

- [ ] D1 schema + migrations
- [ ] Cloudflare Email Service — applications, contact form, newsletter notifications
- [ ] Turnstile on public forms (contact, join, **newsletter**)
- [ ] R2 for PDFs, logos, images
- [ ] ~~Newsletter~~ → see **Newsletter submission** section above

---

## Front end / demo

- [x] Hono + JSX theme (no Vite, no React)
- [x] Copy tracker in navigation
- [ ] Home: “We Dig Las Vegas”, upcoming events from data
- [ ] **Photography** — more photos across pages (hero, About, committees, events, leadership); R2 + admin uploads
- [ ] **Scroll-past / parallax-style sections** — horizontal or vertical “scroll past” bands for photo + copy (CSS-only where possible; respect `prefers-reduced-motion`)
- [ ] Remove demo banner before production
- [ ] Accessibility pass (forms, nav, contrast)
- [ ] SEO titles, meta, redirects from old URLs

---

## Deploy & cutover

- [ ] Staging Worker + custom domain
- [ ] Production DNS for `nucalasvegas.com`
- [ ] Redirect map (WordPress slugs → new routes)
- [ ] Staff training doc for admin

---

## Membership workflow (planned — staff note)

When a company **applies** (Join form) and staff save them into D1:

1. **Application row** — `applications` (`status` e.g. `new` → `reviewed` / `approved` / `rejected`); optional link to created `members.id`.
2. **Member row** — create in `members` with **not listed on the public site** until dues are paid.
3. **Admin signal** — portal should show “needs payment” / “not current” so secretary can chase dues before publishing.
4. **Public member list** — only **current, paid** members appear on `/members`.

**Schema alignment (today vs target):**

| Today | Intended use |
|-------|----------------|
| `members.active` (0/1) | Public listing gate: `active = 1` only when membership is **current** (paid). New applicants → `active = 0`. |
| `applications.status` | Queue before/without a member row (`new`, etc.). |

**Optional later (if secretary needs more than on/off):**

- `membership_status` on `members`: `pending_payment` | `current` | `lapsed` (map `current` → public list + `active = 1`).
- Admin members UI: filter tabs **Current** / **Pending payment** / **Lapsed**; bulk “mark current” after payment.
- Auto-create pending member from approved application (still `active = 0` until marked current).

**Not built yet:** Join form → D1, application queue UI, or auto-pending member rows.

---

## Visual design & breaking news (planned — staff note)

**Photos & motion**

- Use **many more photos** on key pages (not just leadership): chapter events, job sites, committees, home hero variants.
- **Scroll-past styling** — sections where imagery and text scroll at different rates or slide into view (tasteful, mobile-safe; avoid heavy JS).
- Store images in **R2**; optional admin picker per page/section later.

**Breaking news popup**

- Admin sets an **active alert**: headline, short message, optional “Read more” URL, optional expiry.
- Public site shows a **modal or top banner** on load (dismissible; cookie/session so repeat visitors aren’t nagged every page).
- Suggested storage: `site_settings` key `breaking_news` or small `site_alerts` table (`active`, `starts_at`, `ends_at`).

---

## Admin-editable content (planned — staff note)

| Area | Public | Admin |
|------|--------|--------|
| **Resources** | `/resources` | Edit page intro + list of links/PDFs (markdown or structured rows in D1) |
| **Contact info** | `/contact`, footer | Phone, email, address, optional hours — `site_settings` (replace hardcoded `site` in `demo.ts` at runtime) |
| **THE DIRT** | `/about/the-dirt` | Upload PDFs to R2, metadata, publish/unpublish |

Resources and contact should **not** require code deploys for routine secretary updates.

---

## Portal users ↔ member companies (planned — staff note)

**Linking**

- Each **portal user** may be linked to **exactly one** member company (`users.member_id` → `members.id` — already in schema).
- **Multiple users** can link to the **same** company (several contacts per firm).
- Admin assigns link when creating/editing users (Member role or any role that should appear as a company contact).

**Public company page**

- Public route e.g. `/members/:id` (or slug) for each **current** (`active = 1`) member company.
- Member list links company name → company page.
- Company page shows firm info (website, phone, etc.) plus **linked users who opted in** as contacts.

**Contact visibility (user choice)**

- Linked users control whether their **personal contact info** is public (phone, email, name display).
- Suggested fields on `users` (migration later): `public_contact_name`, `public_phone`, `public_email`, `show_on_company_page` (0/1) or single `contact_public` flag + which fields to expose.
- Portal **My listing** / profile: toggle “Show me on our company page” and edit public contact fields (separate from login email).
- Public site only renders contacts where `show_on_company_page = 1` (and company is current).

**Today:** Member-role users can edit company website/phone/email on the **member row** via `/admin/profile`; no company detail page, no per-user public opt-in yet.

---

## Open questions

1. Exact WordPress URLs for About parent (404 on `/about/` — verify slugs in `site-nav.ts`).
2. Newsletter provider + list ID / API keys (blocks wiring `POST /newsletter/subscribe`).
3. ~~Member list: fully public vs partial for non-members?~~ → **Decided:** only **current** (paid) members on `/members`; applicants/pending stay off the site until admin marks current (see **Membership workflow**).
