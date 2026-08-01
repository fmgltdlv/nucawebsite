# NUCA Las Vegas website — To do

Track remaining work for the Cloudflare (Hono + D1) site. Admin/CMS capabilities below reflect **current implementation** (as of website editing improvements).

## Navigation

| Top level | Submenu |
|-----------|---------|
| Home | — |
| About | FAQ, Leadership, Member List, Events, Resources |
| Committees | → NUCA Las Vegas Scholarships |
| Industry Updates | → THE DIRT (PDF archive + web posts) |
| Join NUCA of Las Vegas Today! | — |
| Contact Us | — |

- [x] Nav editable in admin (`/admin/content/navigation`) with D1-backed items
- [ ] Confirm final labels with chapter staff (e.g. “Committees” vs “Advocacy”)
- [x] Redirect `/advocacy` → `/about/committees`

## Editable without a code deploy (admin)

| Area | Admin path |
|------|------------|
| Site settings (logo, contact, footer, theme, breaking news) | `/admin/content/settings` |
| Navigation | `/admin/content/navigation` |
| Block-based pages (home, about, training, resources, scholarships, committees, FAQ/Leadership/Events/THE DIRT shells, Join, Contact, custom) | `/admin/content/pages` |
| FAQ items | `/admin/content/qa` |
| Leadership roster | `/admin/content/leadership` |
| Committees | `/admin/content/committees` |
| Resource links | `/admin/content/resources` |
| Membership types | `/admin/content/member-types` |
| THE DIRT PDFs + web posts | `/admin/content/the-dirt`, `/admin/content/posts` |
| Events, members | `/admin/events`, `/admin/members` |
| Asset library uploads | `/admin/assets` |
| Profile password change | `/admin/profile` |
| Admin users (create, reset password, delete) | `/admin/users` |
| Form inboxes | Applications, contact, newsletter |

## Newsletter (optional backlog)

D1 subscriber list + CSV export work today. Remaining product decisions:

- [ ] Decide provider: Mailchimp / Constant Contact / Brevo API vs D1-only + staff export
- [ ] Turnstile on subscribe form
- [ ] Optional confirmation email / double opt-in
- [ ] Inline error UX on Contact subscribe

## Content copy from live site

CMS shells and lists are live; remaining work is **content accuracy**, not wiring:

| Page | Route | CMS? | Notes |
|------|--------|------|--------|
| Home | `/` | Blocks | Match live hero / teasers as needed |
| About | `/about` | Blocks | Chapter overview |
| FAQ | `/about/faq` | Shell + Q&A admin | Seed live FAQs |
| Leadership | `/about/leadership` | Shell + roster admin | Photos optional |
| Members | `/members` | Data admin | Directory shell is fixed UI |
| Events | `/events` | Shell + events admin | |
| Resources | `/resources` | Blocks + links admin | |
| Committees | `/about/committees` | Blocks + committees admin | |
| Scholarships | `/scholarships` | Blocks | |
| THE DIRT | `/the-dirt` | Shell + PDF/posts admin | |
| Join | `/join` | Blocks + membership types | Application form structure still code |
| Contact | `/contact` | Blocks + site settings | |

## Out of scope / future

- [ ] Page revision history / server autosave
- [ ] Rich-text WYSIWYG (markdown + blocks today)
- [ ] Editable join application field schema (`membership-application.ts`)
- [ ] Alternate nav layouts / per-page templates
