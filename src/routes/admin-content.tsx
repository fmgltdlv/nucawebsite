import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { ThemeId } from '../config/themes'
import { parseThemeId } from '../config/themes'
import type { Env } from '../env'
import { canAccessRole, resolveAdminContext } from '../lib/admin-context'
import { chairCanEditPage } from '../lib/chair-pages'
import {
  createDirtRelease,
  deleteDirtRelease,
  getDirtRelease,
  listDirtReleases,
  updateDirtRelease,
} from '../lib/dirt-db'
import {
  createLeadership,
  deleteLeadership,
  getLeadershipById,
  listLeadership,
  updateLeadership,
} from '../lib/leadership-db'
import { createPost, deletePost, getPostById, listAllPosts, updatePost } from '../lib/posts-db'
import { getPageBySlug, isPageSlug, listPages, upsertPage } from '../lib/pages-db'
import { blocksToMarkdown, parsePageBlocks } from '../lib/page-blocks'
import { renderCmsPage } from '../lib/render-cms-page'
import { createQaItem, deleteQaItem, listQaItems, updateQaItem } from '../lib/qa-db'
import {
  createNavItem,
  deleteNavItem,
  getNavItemById,
  listNavItems,
  listNavParentOptions,
  updateNavItem,
} from '../lib/nav-items-db'
import {
  createResourceItem,
  deleteResourceItem,
  listResourceItems,
  updateResourceItem,
} from '../lib/resource-items-db'
import {
  deleteAsset,
  dirtPdfKey,
  leadershipPhotoKey,
  uploadImage,
  uploadPdf,
} from '../lib/r2-assets'
import { applySiteLogoChange, resolveSiteLogoUrl } from '../lib/site-logo'
import {
  getBreakingNews,
  getContactInfo,
  getFooterInfo,
  getSiteLogoR2Key,
  getThemeId,
  setBreakingNews,
  setContactInfo,
  setFooterInfo,
  setSiteLogoR2Key,
  setThemeId,
  type BreakingNews,
} from '../lib/site-settings'
import { loadPublicSiteContext } from '../lib/site-context'
import { seedContentIfEmpty } from '../lib/seed'
import { THEME_COOKIE } from '../lib/theme'
import { listNewsletterSubscribers } from '../lib/newsletter-db'
import { listContactSubmissions, updateContactSubmissionStatus } from '../lib/contact-db'
import { parseDatetimeLocal } from '../lib/datetime'
import { AdminApplicationsPage } from '../pages/admin/AdminApplications'
import { AdminContactMessagesPage } from '../pages/admin/AdminContactMessages'
import { AdminNewsletterSubscribersPage } from '../pages/admin/AdminNewsletterSubscribers'
import { AdminContentPage } from '../pages/admin/AdminContent'
import { AdminContentDirtPage } from '../pages/admin/content/AdminContentDirt'
import { AdminContentLeadershipPage } from '../pages/admin/content/AdminContentLeadership'
import { AdminContentPageEditPage } from '../pages/admin/content/AdminContentPageEdit'
import { AdminContentPagesPage } from '../pages/admin/content/AdminContentPages'
import { AdminContentPostsPage } from '../pages/admin/content/AdminContentPosts'
import { AdminContentQaPage } from '../pages/admin/content/AdminContentQa'
import { AdminContentResourcesPage } from '../pages/admin/content/AdminContentResources'
import { AdminContentNavigationPage } from '../pages/admin/content/AdminContentNavigation'
import { AdminContentSettingsPage } from '../pages/admin/content/AdminContentSettings'
import { PagePreviewFrame } from '../views/PagePreviewBanner'
import { listApplications, updateApplicationStatus } from '../lib/applications-db'

type AdminVariables = { theme: ThemeId }

function parseSortOrder(value: string): number {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : 0
}

function optionalParentId(body: Record<string, unknown>): string | null {
  const value = body.parent_id
  if (typeof value !== 'string' || !value.trim()) return null
  return value.trim()
}

function navItemFromBody(body: Record<string, unknown>, existing?: { sort_order: number }) {
  return {
    label: typeof body.label === 'string' ? body.label.trim() : '',
    href: typeof body.href === 'string' ? body.href.trim() : '',
    parent_id: optionalParentId(body),
    sort_order: parseSortOrder(typeof body.sort_order === 'string' ? body.sort_order : String(existing?.sort_order ?? 0)),
    published: body.published === '1',
    indent: body.indent === '1',
  }
}

function optionalText(body: Record<string, unknown>, key: string): string | null {
  const value = body[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function leadershipFromBody(body: Record<string, unknown>) {
  return {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    role_title: typeof body.role_title === 'string' ? body.role_title.trim() : '',
    chair_title: optionalText(body, 'chair_title'),
    company: optionalText(body, 'company'),
    website: optionalText(body, 'website'),
    linkedin_url: optionalText(body, 'linkedin_url'),
    bio: optionalText(body, 'bio'),
  }
}

function flashMessage(c: { req: { query: (k: string) => string | undefined } }, key: string): string | undefined {
  return c.req.query('ok') === key ? 'Saved.' : c.req.query('ok') === '1' ? 'Saved.' : undefined
}

async function requireAdmin(c: Parameters<typeof resolveAdminContext>[0]) {
  const ctx = await resolveAdminContext(c)
  if (!ctx) return { kind: 'redirect' as const, to: '/admin/login' }
  if (!canAccessRole(ctx.user, ['admin'])) return { kind: 'redirect' as const, to: '/admin' }
  return { kind: 'ok' as const, ctx }
}

function adminRedirect(c: Parameters<typeof resolveAdminContext>[0], to: string) {
  return c.redirect(to, 303)
}

export function registerAdminContentRoutes(app: Hono<{ Bindings: Env; Variables: AdminVariables }>) {
  app.get('/admin/content', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    return c.html(<AdminContentPage theme={c.get('theme')} ctx={auth.ctx} />)
  })

  app.get('/admin/content/settings', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const contact = await getContactInfo(c.env.DB)
    const footer = await getFooterInfo(c.env.DB)
    const themeId = await getThemeId(c.env.DB)
    const logoR2Key = await getSiteLogoR2Key(c.env.DB)
    const breaking = (await getBreakingNews(c.env.DB)) ?? {
      active: false,
      title: '',
      body: '',
    }
    return c.html(
      <AdminContentSettingsPage
        theme={c.get('theme')}
        ctx={auth.ctx}
        contact={contact}
        footer={footer}
        themeId={themeId}
        breakingNews={breaking}
        logoUrl={resolveSiteLogoUrl(logoR2Key)}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/settings', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const previousLogoKey = await getSiteLogoR2Key(c.env.DB)
    const logoError = await applySiteLogoChange(
      c.env.R2,
      (key) => setSiteLogoR2Key(c.env.DB, key),
      body,
      previousLogoKey,
    )
    if (logoError) {
      return c.redirect(`/admin/content/settings?error=${encodeURIComponent(logoError)}`, 303)
    }
    await setContactInfo(c.env.DB, {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      email: typeof body.email === 'string' ? body.email.trim() : '',
      address: typeof body.address === 'string' ? body.address.trim() : '',
      hours: typeof body.hours === 'string' && body.hours.trim() ? body.hours.trim() : undefined,
    })
    await setFooterInfo(c.env.DB, {
      dirtBlurb: typeof body.dirt_blurb === 'string' ? body.dirt_blurb.trim() : undefined,
      copyrightNote:
        typeof body.copyright_note === 'string' ? body.copyright_note.trim() : undefined,
    })
    await setThemeId(c.env.DB, parseThemeId(typeof body.theme_id === 'string' ? body.theme_id : undefined))
    const breaking: BreakingNews = {
      active: body.breaking_active === '1',
      title: typeof body.breaking_title === 'string' ? body.breaking_title.trim() : '',
      body: typeof body.breaking_body === 'string' ? body.breaking_body.trim() : '',
      link: typeof body.breaking_link === 'string' && body.breaking_link.trim() ? body.breaking_link.trim() : undefined,
      expiresAt:
        typeof body.breaking_expires === 'string' && body.breaking_expires.trim()
          ? parseDatetimeLocal(body.breaking_expires) ?? undefined
          : undefined,
    }
    await setBreakingNews(c.env.DB, breaking)
    return c.redirect('/admin/content/settings?ok=1', 303)
  })

  app.get('/admin/content/navigation', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const items = await listNavItems(c.env.DB)
    const groups = await listNavParentOptions(c.env.DB)
    return c.html(
      <AdminContentNavigationPage
        theme={c.get('theme')}
        ctx={auth.ctx}
        items={items}
        groups={groups}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/navigation', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const fields = navItemFromBody(body)
    if (!fields.label) return c.redirect('/admin/content/navigation?error=Label%20required', 303)
    await createNavItem(c.env.DB, fields)
    return c.redirect('/admin/content/navigation?ok=1', 303)
  })

  app.post('/admin/content/navigation/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const id = c.req.param('id')
    const existing = await getNavItemById(c.env.DB, id)
    if (!existing) return c.redirect('/admin/content/navigation', 303)
    const body = await c.req.parseBody()
    const fields = navItemFromBody(body, existing)
    if (!fields.label) return c.redirect('/admin/content/navigation?error=Label%20required', 303)
    try {
      await updateNavItem(c.env.DB, id, fields)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save navigation item.'
      return c.redirect(`/admin/content/navigation?error=${encodeURIComponent(message)}`, 303)
    }
    return c.redirect('/admin/content/navigation?ok=1', 303)
  })

  app.post('/admin/content/navigation/:id/delete', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    await deleteNavItem(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/content/navigation?ok=1', 303)
  })

  app.get('/admin/content/qa', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const items = await listQaItems(c.env.DB)
    return c.html(
      <AdminContentQaPage theme={c.get('theme')} ctx={auth.ctx} items={items} flash={flashMessage(c, '1')} />,
    )
  })

  app.post('/admin/content/qa', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const answer_md = typeof body.answer_md === 'string' ? body.answer_md.trim() : ''
    if (question && answer_md) await createQaItem(c.env.DB, { question, answer_md })
    return c.redirect('/admin/content/qa?ok=1', 303)
  })

  app.post('/admin/content/qa/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const id = c.req.param('id')
    await updateQaItem(c.env.DB, id, {
      question: typeof body.question === 'string' ? body.question.trim() : '',
      answer_md: typeof body.answer_md === 'string' ? body.answer_md.trim() : '',
      sort_order: parseSortOrder(typeof body.sort_order === 'string' ? body.sort_order : '0'),
      published: body.published === '1',
    })
    return c.redirect('/admin/content/qa?ok=1', 303)
  })

  app.post('/admin/content/qa/:id/delete', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    await deleteQaItem(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/content/qa?ok=1', 303)
  })

  app.get('/admin/content/the-dirt', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const releases = await listDirtReleases(c.env.DB)
    return c.html(
      <AdminContentDirtPage
        theme={c.get('theme')}
        ctx={auth.ctx}
        releases={releases}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/the-dirt', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const published_at = typeof body.published_at === 'string' ? body.published_at : ''
    const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
    const pdf = body.pdf instanceof File ? body.pdf : null
    if (!title || !published_at || !pdf || pdf.size === 0) {
      return c.redirect('/admin/content/the-dirt?error=Title%2C%20date%2C%20and%20PDF%20required', 303)
    }
    const id = crypto.randomUUID()
    const key = dirtPdfKey(id)
    const upload = await uploadPdf(c.env.R2, pdf, key)
    if (!upload.ok) return c.redirect(`/admin/content/the-dirt?error=${encodeURIComponent(upload.error)}`, 303)
    await createDirtRelease(c.env.DB, { id, title, summary: summary || undefined, published_at, pdf_r2_key: key })
    return c.redirect('/admin/content/the-dirt?ok=1', 303)
  })

  app.post('/admin/content/the-dirt/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const id = c.req.param('id')
    const existing = await getDirtRelease(c.env.DB, id)
    if (!existing) return c.redirect('/admin/content/the-dirt', 303)
    const body = await c.req.parseBody()
    const pdf = body.pdf instanceof File && body.pdf.size > 0 ? body.pdf : null
    let pdf_r2_key: string | undefined
    if (pdf) {
      const key = dirtPdfKey(id)
      const upload = await uploadPdf(c.env.R2, pdf, key)
      if (!upload.ok) return c.redirect(`/admin/content/the-dirt?error=${encodeURIComponent(upload.error)}`, 303)
      if (existing.pdf_r2_key !== key) await deleteAsset(c.env.R2, existing.pdf_r2_key)
      pdf_r2_key = key
    }
    await updateDirtRelease(c.env.DB, id, {
      title: typeof body.title === 'string' ? body.title.trim() : existing.title,
      summary: typeof body.summary === 'string' ? body.summary.trim() : null,
      published_at: typeof body.published_at === 'string' ? body.published_at : existing.published_at,
      pdf_r2_key,
      published: body.published === '1',
    })
    return c.redirect('/admin/content/the-dirt?ok=1', 303)
  })

  app.post('/admin/content/the-dirt/:id/delete', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const id = c.req.param('id')
    const existing = await getDirtRelease(c.env.DB, id)
    if (existing) {
      await deleteAsset(c.env.R2, existing.pdf_r2_key)
      await deleteDirtRelease(c.env.DB, id)
    }
    return c.redirect('/admin/content/the-dirt?ok=1', 303)
  })

  app.get('/admin/content/posts', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const posts = await listAllPosts(c.env.DB)
    return c.html(
      <AdminContentPostsPage theme={c.get('theme')} ctx={auth.ctx} posts={posts} flash={flashMessage(c, '1')} />,
    )
  })

  app.post('/admin/content/posts', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const body_md = typeof body.body_md === 'string' ? body.body_md.trim() : ''
    if (title && body_md) {
      await createPost(c.env.DB, {
        title,
        slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
        excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : undefined,
        body_md,
        published: body.published === '1',
      })
    }
    return c.redirect('/admin/content/posts?ok=1', 303)
  })

  app.post('/admin/content/posts/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const id = c.req.param('id')
    const existing = await getPostById(c.env.DB, id)
    if (!existing) return c.redirect('/admin/content/posts', 303)
    const body = await c.req.parseBody()
    const publishedAtRaw = typeof body.published_at === 'string' ? body.published_at : ''
    await updatePost(c.env.DB, id, {
      title: typeof body.title === 'string' ? body.title.trim() : existing.title,
      slug: typeof body.slug === 'string' ? body.slug.trim() : existing.slug,
      excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : null,
      body_md: typeof body.body_md === 'string' ? body.body_md.trim() : existing.body_md,
      published_at: publishedAtRaw ? parseDatetimeLocal(publishedAtRaw) : existing.published_at,
      published: body.published === '1',
    })
    return c.redirect('/admin/content/posts?ok=1', 303)
  })

  app.post('/admin/content/posts/:id/delete', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    await deletePost(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/content/posts?ok=1', 303)
  })

  app.get('/admin/content/pages', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const pages = await listPages(c.env.DB)
    return c.html(<AdminContentPagesPage theme={c.get('theme')} ctx={auth.ctx} pages={pages} />)
  })

  app.get('/admin/content/pages/:slug/preview', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    const slug = c.req.param('slug')
    if (!chairCanEditPage(ctx, slug)) return c.redirect('/admin', 303)
    if (ctx.user.role !== 'admin' && !isPageSlug(slug)) return c.redirect('/admin', 303)

    await seedContentIfEmpty(c.env)
    const page = await getPageBySlug(c.env.DB, slug)
    if (!page) return c.redirect(`/admin/content/pages/${slug}`, 303)

    const site = await loadPublicSiteContext(c.env, getCookie(c, THEME_COOKIE))
    const resourceItems =
      slug === 'resources' ? await listResourceItems(c.env.DB, true) : undefined

    return c.html(
      <PagePreviewFrame slug={slug} published={page.published === 1}>
        {renderCmsPage(site, slug, page, { resourceItems })}
      </PagePreviewFrame>,
    )
  })

  app.get('/admin/content/pages/:slug', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    const slug = c.req.param('slug')
    if (!chairCanEditPage(ctx, slug)) return c.redirect('/admin', 303)
    if (ctx.user.role !== 'admin' && !isPageSlug(slug)) return c.redirect('/admin', 303)
    const page = await getPageBySlug(c.env.DB, slug)
    return c.html(
      <AdminContentPageEditPage
        theme={c.get('theme')}
        ctx={ctx}
        page={page}
        slug={slug}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/content/pages/:slug', async (c) => {
    const ctx = await resolveAdminContext(c)
    if (!ctx) return c.redirect('/admin/login', 303)
    const slug = c.req.param('slug')
    if (!chairCanEditPage(ctx, slug)) return c.redirect('/admin', 303)
    const body = await c.req.parseBody()
    const body_json = typeof body.body_json === 'string' ? body.body_json : null
    const blocks = parsePageBlocks(body_json)
    const body_md =
      blocks && blocks.length > 0
        ? blocksToMarkdown(blocks)
        : typeof body.body_md === 'string'
          ? body.body_md
          : ''
    await upsertPage(c.env.DB, {
      slug,
      title: typeof body.title === 'string' ? body.title.trim() : slug,
      body_md,
      body_json: blocks && blocks.length > 0 ? body_json : null,
      meta_description:
        typeof body.meta_description === 'string' ? body.meta_description.trim() : null,
      published: body.published === '1',
    })
    return c.redirect(`/admin/content/pages/${slug}?ok=1`, 303)
  })

  app.get('/admin/content/leadership', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const leaders = await listLeadership(c.env.DB)
    return c.html(
      <AdminContentLeadershipPage
        theme={c.get('theme')}
        ctx={auth.ctx}
        leaders={leaders}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/content/leadership', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const fields = leadershipFromBody(body)
    if (!fields.name || !fields.role_title) return c.redirect('/admin/content/leadership', 303)
    const id = await createLeadership(c.env.DB, fields)
    const photo = body.photo instanceof File && body.photo.size > 0 ? body.photo : null
    if (photo) {
      const key = leadershipPhotoKey(id, photo.name)
      const upload = await uploadImage(c.env.R2, photo, key)
      if (upload.ok) {
        await updateLeadership(c.env.DB, id, {
          ...fields,
          sort_order: 0,
          photo_r2_key: key,
          published: true,
        })
      }
    }
    return c.redirect('/admin/content/leadership?ok=1', 303)
  })

  app.post('/admin/content/leadership/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const id = c.req.param('id')
    const existing = await getLeadershipById(c.env.DB, id)
    if (!existing) return c.redirect('/admin/content/leadership', 303)
    const body = await c.req.parseBody()
    const photo = body.photo instanceof File && body.photo.size > 0 ? body.photo : null
    let photo_r2_key = existing.photo_r2_key
    if (photo) {
      const key = leadershipPhotoKey(id, photo.name)
      const upload = await uploadImage(c.env.R2, photo, key)
      if (upload.ok) {
        if (existing.photo_r2_key) await deleteAsset(c.env.R2, existing.photo_r2_key)
        photo_r2_key = key
      }
    }
    await updateLeadership(c.env.DB, id, {
      ...leadershipFromBody(body),
      name: typeof body.name === 'string' ? body.name.trim() : existing.name,
      role_title: typeof body.role_title === 'string' ? body.role_title.trim() : existing.role_title,
      sort_order: parseSortOrder(typeof body.sort_order === 'string' ? body.sort_order : '0'),
      photo_r2_key,
      published: body.published === '1',
    })
    return c.redirect('/admin/content/leadership?ok=1', 303)
  })

  app.post('/admin/content/leadership/:id/delete', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const id = c.req.param('id')
    const existing = await getLeadershipById(c.env.DB, id)
    if (existing?.photo_r2_key) await deleteAsset(c.env.R2, existing.photo_r2_key)
    await deleteLeadership(c.env.DB, id)
    return c.redirect('/admin/content/leadership?ok=1', 303)
  })

  app.get('/admin/content/resources', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const items = await listResourceItems(c.env.DB)
    return c.html(
      <AdminContentResourcesPage
        theme={c.get('theme')}
        ctx={auth.ctx}
        items={items}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/content/resources', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const label = typeof body.label === 'string' ? body.label.trim() : ''
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    if (label && url) await createResourceItem(c.env.DB, { label, url, category })
    return c.redirect('/admin/content/resources?ok=1', 303)
  })

  app.post('/admin/content/resources/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    await updateResourceItem(c.env.DB, c.req.param('id'), {
      label: typeof body.label === 'string' ? body.label.trim() : '',
      url: typeof body.url === 'string' ? body.url.trim() : '',
      category: typeof body.category === 'string' ? body.category.trim() : '',
      sort_order: parseSortOrder(typeof body.sort_order === 'string' ? body.sort_order : '0'),
      published: body.published === '1',
    })
    return c.redirect('/admin/content/resources?ok=1', 303)
  })

  app.post('/admin/content/resources/:id/delete', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    await deleteResourceItem(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/content/resources?ok=1', 303)
  })

  app.get('/admin/newsletter', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const subscribers = await listNewsletterSubscribers(c.env.DB)
    return c.html(
      <AdminNewsletterSubscribersPage theme={c.get('theme')} ctx={auth.ctx} subscribers={subscribers} />,
    )
  })

  app.get('/admin/contact-messages', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const submissions = await listContactSubmissions(c.env.DB)
    return c.html(
      <AdminContactMessagesPage
        theme={c.get('theme')}
        ctx={auth.ctx}
        submissions={submissions}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/contact-messages/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const status = typeof body.status === 'string' ? body.status : 'new'
    await updateContactSubmissionStatus(c.env.DB, c.req.param('id'), status)
    return c.redirect('/admin/contact-messages?ok=1', 303)
  })

  app.get('/admin/applications', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const applications = await listApplications(c.env.DB)
    return c.html(
      <AdminApplicationsPage
        theme={c.get('theme')}
        ctx={auth.ctx}
        applications={applications}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/applications/:id', async (c) => {
    const auth = await requireAdmin(c)
    if (auth.kind === 'redirect') return adminRedirect(c, auth.to)
    const body = await c.req.parseBody()
    const status = typeof body.status === 'string' ? body.status : 'new'
    await updateApplicationStatus(c.env.DB, c.req.param('id'), status)
    return c.redirect('/admin/applications?ok=1', 303)
  })
}
