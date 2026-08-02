import { Hono } from 'hono'
import type { ThemeId } from '../config/themes'
import type { AdminLayoutProps } from '../lib/site-context'
import { parseThemeId } from '../config/themes'
import type { Env } from '../env'
import { getAdminCtx } from '../lib/admin-guard'
import { writeAuditLog } from '../lib/security/audit-log'
import { clientIp } from '../lib/security/rate-limit'
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
import { createPost, deletePost, getPostById, listAllPosts, clampCoverWidthPct, updatePost } from '../lib/posts-db'
import { buildPageLabels, createCustomPage, deleteCustomPage, getPageBySlug, listCustomPages, listPages, upsertPage } from '../lib/pages-db'
import { listSiteInternalLinks } from '../lib/site-internal-links'
import { blocksToMarkdown, parsePageBlocks } from '../lib/page-blocks'
import { loadCmsPageExtras } from '../lib/cms-page-extras'
import { renderCmsPage } from '../lib/render-cms-page'
import { createQaItem, deleteQaItem, listQaItems, updateQaItem } from '../lib/qa-db'
import {
  createCommittee,
  deleteCommittee,
  getCommitteeById,
  listCommittees,
  slugifyCommitteeKey,
  updateCommittee,
} from '../lib/committees-db'
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
  createMembershipType,
  deleteMembershipType,
  listMembershipTypes,
  updateMembershipType,
} from '../lib/membership-types-db'
import { deleteAssetIfUnreferenced } from '../lib/asset-references'
import { resolveExistingImageKey } from '../lib/asset-select'
import {
  committeePhotoKey,
  deleteAsset,
  dirtPdfKey,
  leadershipPhotoKey,
  uploadImage,
  uploadPdf,
} from '../lib/r2-assets'
import { applySiteLogoChange, parseLogoSizePercent, resolveSiteLogoUrl } from '../lib/site-logo'
import {
  getBreakingNewsSettings,
  getContactInfo,
  getFooterInfo,
  getSiteLogoR2Key,
  getSiteLogoSizePercent,
  getThemeId,
  setBreakingNews,
  setContactInfo,
  setFooterInfo,
  setSiteLogoR2Key,
  setSiteLogoSizePercent,
  setThemeId,
  type BreakingNews,
} from '../lib/site-settings'
import { loadPublicSiteContext } from '../lib/site-context'
import { seedContentIfEmpty } from '../lib/seed'
import { listNewsletterSubscribers, updateNewsletterSubscriberStatus, deleteNewsletterSubscriber, acknowledgeAllNewsletterSubscribers, listAllNewsletterSubscribers, buildNewsletterSubscribersCsv, newsletterSubscribersExportFilename } from '../lib/newsletter-db'
import { listContactSubmissions, updateContactSubmissionStatus, deleteContactSubmission, acknowledgeAllContactSubmissions } from '../lib/contact-db'
import { parseDatetimeLocal } from '../lib/datetime'
import { sanitizePostHtml } from '../lib/sanitize-html'
import { AdminApplicationsPage } from '../pages/admin/AdminApplications'
import { AdminContactMessagesPage } from '../pages/admin/AdminContactMessages'
import { AdminNewsletterSubscribersPage } from '../pages/admin/AdminNewsletterSubscribers'
import { AdminContentPage } from '../pages/admin/AdminContent'
import { AdminContentDirtPage } from '../pages/admin/content/AdminContentDirt'
import { AdminContentPostEditPage } from '../pages/admin/content/AdminContentPostEdit'
import { AdminContentLeadershipPage } from '../pages/admin/content/AdminContentLeadership'
import { AdminContentPageEditPage } from '../pages/admin/content/AdminContentPageEdit'
import { AdminContentPagesPage } from '../pages/admin/content/AdminContentPages'
import { AdminContentCommitteesPage } from '../pages/admin/content/AdminContentCommittees'
import { AdminContentQaPage } from '../pages/admin/content/AdminContentQa'
import { AdminContentResourcesPage } from '../pages/admin/content/AdminContentResources'
import { AdminContentMemberTypesPage } from '../pages/admin/content/AdminContentMemberTypes'
import { AdminContentNavigationPage } from '../pages/admin/content/AdminContentNavigation'
import { AdminContentSettingsPage } from '../pages/admin/content/AdminContentSettings'
import { PagePreviewFrame } from '../views/PagePreviewBanner'
import { listApplications, updateApplicationStatus, deleteApplication, acknowledgeAllApplications } from '../lib/applications-db'

type AdminVariables = { theme: ThemeId; adminSite: AdminLayoutProps; adminCtx: import('../lib/admin-context').AdminContext | null }

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

async function resolveCommitteePhotoR2Key(
  r2: R2Bucket,
  committeeId: string,
  existingKey: string | null,
  body: Record<string, File | string>,
): Promise<
  { photo_r2_key: string | null; previousKey: string | null } | { error: string }
> {
  const photo = body.photo instanceof File && body.photo.size > 0 ? body.photo : null
  if (photo) {
    const key = committeePhotoKey(committeeId, photo.name)
    const upload = await uploadImage(r2, photo, key)
    if (!upload.ok) return { error: upload.error }
    return { photo_r2_key: key, previousKey: existingKey }
  }

  const libraryKey = await resolveExistingImageKey(r2, body, 'existing_photo_key')
  if (libraryKey && typeof libraryKey === 'object') return { error: libraryKey.error }
  if (typeof libraryKey === 'string' && libraryKey !== existingKey) {
    return { photo_r2_key: libraryKey, previousKey: existingKey }
  }

  const clearedKey =
    typeof body.existing_photo_key === 'string' ? body.existing_photo_key.trim() : undefined
  if (clearedKey === '' && existingKey) {
    return { photo_r2_key: null, previousKey: existingKey }
  }

  return { photo_r2_key: existingKey, previousKey: null }
}

async function cleanupCommitteePhotoReplacement(
  r2: R2Bucket,
  db: D1Database,
  previousKey: string | null,
  nextKey: string | null,
): Promise<void> {
  if (previousKey && previousKey !== nextKey) {
    await deleteAssetIfUnreferenced(r2, db, previousKey)
  }
}

function flashMessage(c: { req: { query: (k: string) => string | undefined } }, key: string): string | undefined {
  return c.req.query('ok') === key ? 'Saved.' : c.req.query('ok') === '1' ? 'Saved.' : undefined
}

export function registerAdminContentRoutes(app: Hono<{ Bindings: Env; Variables: AdminVariables }>) {
  app.get('/admin/content', async (c) => {
    const ctx = getAdminCtx(c)
    return c.html(<AdminContentPage {...c.get('adminSite')} ctx={ctx} />)
  })

  app.get('/admin/content/settings', async (c) => {
    const ctx = getAdminCtx(c)
    const contact = await getContactInfo(c.env.DB)
    const footer = await getFooterInfo(c.env.DB)
    const themeId = await getThemeId(c.env.DB)
    const logoR2Key = await getSiteLogoR2Key(c.env.DB)
    const logoSizePercent = await getSiteLogoSizePercent(c.env.DB)
    const breaking = await getBreakingNewsSettings(c.env.DB)
    return c.html(
      <AdminContentSettingsPage
        {...c.get('adminSite')}
        ctx={ctx}
        contact={contact}
        footer={footer}
        themeId={themeId}
        breakingNews={breaking}
        logoUrl={resolveSiteLogoUrl(logoR2Key)}
        logoSizePercent={logoSizePercent}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/settings', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const previousLogoKey = await getSiteLogoR2Key(c.env.DB)
    const logoError = await applySiteLogoChange(
      c.env.R2,
      c.env.DB,
      (key) => setSiteLogoR2Key(c.env.DB, key),
      body,
      previousLogoKey,
    )
    if (logoError) {
      return c.redirect(`/admin/content/settings?error=${encodeURIComponent(logoError)}`, 303)
    }
    await setSiteLogoSizePercent(
      c.env.DB,
      parseLogoSizePercent(
        typeof body.logo_size_percent === 'string' ? body.logo_size_percent : undefined,
      ),
    )
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
      showPopup: body.breaking_popup === '1',
    }
    await setBreakingNews(c.env.DB, breaking)
    await writeAuditLog(c.env.DB, {
      userId: ctx.user.id,
      action: 'settings.update',
      resource: 'site_settings',
      ip: clientIp(c.req.raw.headers),
    })
    return c.redirect('/admin/content/settings?ok=1', 303)
  })

  app.get('/admin/content/navigation', async (c) => {
    const ctx = getAdminCtx(c)
    const [items, groups, internalLinks] = await Promise.all([
      listNavItems(c.env.DB),
      listNavParentOptions(c.env.DB),
      listSiteInternalLinks(c.env.DB),
    ])
    return c.html(
      <AdminContentNavigationPage
        {...c.get('adminSite')}
        ctx={ctx}
        items={items}
        groups={groups}
        internalLinks={internalLinks}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/navigation', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const fields = navItemFromBody(body)
    if (!fields.label) return c.redirect('/admin/content/navigation?error=Label%20required', 303)
    await createNavItem(c.env.DB, fields)
    return c.redirect('/admin/content/navigation?ok=1', 303)
  })

  app.post('/admin/content/navigation/:id', async (c) => {
    const ctx = getAdminCtx(c)
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
    const ctx = getAdminCtx(c)
    await deleteNavItem(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/content/navigation?ok=1', 303)
  })

  app.get('/admin/content/qa', async (c) => {
    const ctx = getAdminCtx(c)
    const items = await listQaItems(c.env.DB)
    return c.html(
      <AdminContentQaPage {...c.get('adminSite')} ctx={ctx} items={items} flash={flashMessage(c, '1')} />,
    )
  })

  app.post('/admin/content/qa', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const answer_md = typeof body.answer_md === 'string' ? body.answer_md.trim() : ''
    if (question && answer_md) await createQaItem(c.env.DB, { question, answer_md })
    return c.redirect('/admin/content/qa?ok=1', 303)
  })

  app.post('/admin/content/qa/:id', async (c) => {
    const ctx = getAdminCtx(c)
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
    const ctx = getAdminCtx(c)
    await deleteQaItem(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/content/qa?ok=1', 303)
  })

  app.get('/admin/content/committees', async (c) => {
    const ctx = getAdminCtx(c)
    const items = await listCommittees(c.env.DB)
    return c.html(
      <AdminContentCommitteesPage
        {...c.get('adminSite')}
        ctx={ctx}
        items={items}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/committees', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const keyInput = typeof body.key === 'string' ? body.key.trim() : ''
    const key = keyInput || slugifyCommitteeKey(name)
    if (!name || !key) {
      return c.redirect('/admin/content/committees?error=Name%20required', 303)
    }

    const id = crypto.randomUUID()
    const photoResult = await resolveCommitteePhotoR2Key(c.env.R2, id, null, body)
    if ('error' in photoResult) {
      return c.redirect(`/admin/content/committees?error=${encodeURIComponent(photoResult.error)}`, 303)
    }

    try {
      await createCommittee(c.env.DB, {
        id,
        key,
        name,
        photo_r2_key: photoResult.photo_r2_key,
      })
    } catch (err) {
      if (photoResult.photo_r2_key) {
        await deleteAsset(c.env.R2, photoResult.photo_r2_key)
      }
      const message = err instanceof Error ? err.message : 'Could not create committee.'
      return c.redirect(`/admin/content/committees?error=${encodeURIComponent(message)}`, 303)
    }
    return c.redirect('/admin/content/committees?ok=1', 303)
  })

  app.post('/admin/content/committees/:id', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const id = c.req.param('id')
    const existing = await getCommitteeById(c.env.DB, id)
    if (!existing) {
      return c.redirect('/admin/content/committees?error=Committee%20not%20found', 303)
    }
    const photoResult = await resolveCommitteePhotoR2Key(
      c.env.R2,
      id,
      existing.photo_r2_key,
      body,
    )
    if ('error' in photoResult) {
      return c.redirect(`/admin/content/committees?error=${encodeURIComponent(photoResult.error)}`, 303)
    }
    try {
      await updateCommittee(c.env.DB, id, {
        name: typeof body.name === 'string' ? body.name.trim() : existing.name,
        sort_order: parseSortOrder(typeof body.sort_order === 'string' ? body.sort_order : '0'),
        published: body.published === '1',
        photo_r2_key: photoResult.photo_r2_key,
      })
    } catch (err) {
      if (
        photoResult.photo_r2_key &&
        photoResult.photo_r2_key !== existing.photo_r2_key
      ) {
        await deleteAsset(c.env.R2, photoResult.photo_r2_key)
      }
      const message = err instanceof Error ? err.message : 'Could not save committee.'
      return c.redirect(`/admin/content/committees?error=${encodeURIComponent(message)}`, 303)
    }
    await cleanupCommitteePhotoReplacement(
      c.env.R2,
      c.env.DB,
      photoResult.previousKey,
      photoResult.photo_r2_key,
    )
    return c.redirect('/admin/content/committees?ok=1', 303)
  })

  app.post('/admin/content/committees/:id/delete', async (c) => {
    const ctx = getAdminCtx(c)
    const id = c.req.param('id')
    const existing = await getCommitteeById(c.env.DB, id)
    await deleteCommittee(c.env.DB, id)
    if (existing?.photo_r2_key) {
      await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, existing.photo_r2_key)
    }
    return c.redirect('/admin/content/committees?ok=1', 303)
  })

  app.get('/admin/content/the-dirt', async (c) => {
    const ctx = getAdminCtx(c)
    const [releases, posts] = await Promise.all([listDirtReleases(c.env.DB), listAllPosts(c.env.DB)])
    return c.html(
      <AdminContentDirtPage
        {...c.get('adminSite')}
        ctx={ctx}
        releases={releases}
        posts={posts}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  async function resolvePostCover(
    r2: R2Bucket,
    body: Record<string, unknown>,
    existingKey: string | null,
  ): Promise<{ key: string | null; error?: string }> {
    if (body.remove_cover === '1') return { key: null }
    const libraryKey = await resolveExistingImageKey(
      r2,
      body as Record<string, File | string>,
      'existing_cover_key',
    )
    if (libraryKey && typeof libraryKey === 'object' && 'error' in libraryKey) {
      return { key: existingKey, error: libraryKey.error }
    }
    if (typeof libraryKey === 'string') return { key: libraryKey }
    return { key: existingKey }
  }

  function readCoverWidthPct(body: Record<string, unknown>, fallback = 100): number {
    return clampCoverWidthPct(
      typeof body.cover_width_pct === 'string' || typeof body.cover_width_pct === 'number'
        ? body.cover_width_pct
        : fallback,
      fallback,
    )
  }

  app.get('/admin/content/the-dirt/posts/new', (c) => {
    const ctx = getAdminCtx(c)
    return c.html(
      <AdminContentPostEditPage
        {...c.get('adminSite')}
        ctx={ctx}
        post={null}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/the-dirt/posts/new', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const body_html_raw = typeof body.body_html === 'string' ? body.body_html : ''
    const body_html = sanitizePostHtml(body_html_raw)
    if (!title || !body_html) {
      return c.redirect(
        '/admin/content/the-dirt/posts/new?error=Title%20and%20body%20are%20required',
        303,
      )
    }
    const publishedAtRaw = typeof body.published_at === 'string' ? body.published_at : ''
    const coverWidth = readCoverWidthPct(body as Record<string, unknown>, 100)
    const id = await createPost(c.env.DB, {
      title,
      slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
      excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : undefined,
      body_html,
      published_at: publishedAtRaw ? parseDatetimeLocal(publishedAtRaw) ?? undefined : undefined,
      published: body.published === '1',
      cover_alt: typeof body.cover_alt === 'string' ? body.cover_alt.trim() : null,
      cover_width_pct: coverWidth,
    })
    const cover = await resolvePostCover(c.env.R2, body as Record<string, unknown>, null)
    if (cover.error) {
      return c.redirect(
        `/admin/content/the-dirt/posts/${id}?error=${encodeURIComponent(cover.error)}`,
        303,
      )
    }
    if (cover.key) {
      await updatePost(c.env.DB, id, {
        title,
        slug: typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : (await getPostById(c.env.DB, id))!.slug,
        excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : null,
        body_html,
        cover_r2_key: cover.key,
        cover_alt: typeof body.cover_alt === 'string' ? body.cover_alt.trim() : null,
        cover_width_pct: coverWidth,
        published_at: publishedAtRaw ? parseDatetimeLocal(publishedAtRaw) : null,
        published: body.published === '1',
      })
    }
    return c.redirect(`/admin/content/the-dirt/posts/${id}?ok=1`, 303)
  })

  app.get('/admin/content/the-dirt/posts/:id', async (c) => {
    const ctx = getAdminCtx(c)
    const post = await getPostById(c.env.DB, c.req.param('id'))
    if (!post) return c.redirect('/admin/content/the-dirt', 303)
    return c.html(
      <AdminContentPostEditPage
        {...c.get('adminSite')}
        ctx={ctx}
        post={post}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/the-dirt/posts/:id', async (c) => {
    const ctx = getAdminCtx(c)
    const id = c.req.param('id')
    const existing = await getPostById(c.env.DB, id)
    if (!existing) return c.redirect('/admin/content/the-dirt', 303)
    const body = await c.req.parseBody()
    const title = typeof body.title === 'string' ? body.title.trim() : existing.title
    const slug = typeof body.slug === 'string' ? body.slug.trim() : existing.slug
    const body_html = sanitizePostHtml(typeof body.body_html === 'string' ? body.body_html : '')
    if (!title || !slug || !body_html) {
      return c.redirect(
        `/admin/content/the-dirt/posts/${id}?error=Title%2C%20slug%2C%20and%20body%20are%20required`,
        303,
      )
    }
    const cover = await resolvePostCover(
      c.env.R2,
      body as Record<string, unknown>,
      existing.cover_r2_key,
    )
    if (cover.error) {
      return c.redirect(
        `/admin/content/the-dirt/posts/${id}?error=${encodeURIComponent(cover.error)}`,
        303,
      )
    }
    if (existing.cover_r2_key && existing.cover_r2_key !== cover.key) {
      await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, existing.cover_r2_key)
    }
    const publishedAtRaw = typeof body.published_at === 'string' ? body.published_at : ''
    await updatePost(c.env.DB, id, {
      title,
      slug,
      excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : null,
      body_html,
      cover_r2_key: cover.key,
      cover_alt: typeof body.cover_alt === 'string' ? body.cover_alt.trim() : null,
      cover_width_pct: readCoverWidthPct(body as Record<string, unknown>, existing.cover_width_pct),
      published_at: publishedAtRaw ? parseDatetimeLocal(publishedAtRaw) : existing.published_at,
      published: body.published === '1',
    })
    return c.redirect(`/admin/content/the-dirt/posts/${id}?ok=1`, 303)
  })

  app.post('/admin/content/the-dirt/posts/:id/delete', async (c) => {
    const ctx = getAdminCtx(c)
    const id = c.req.param('id')
    const existing = await getPostById(c.env.DB, id)
    if (existing?.cover_r2_key) {
      await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, existing.cover_r2_key)
    }
    await deletePost(c.env.DB, id)
    return c.redirect('/admin/content/the-dirt?ok=1', 303)
  })

  app.post('/admin/content/the-dirt', async (c) => {
    const ctx = getAdminCtx(c)
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
    const ctx = getAdminCtx(c)
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
      if (existing.pdf_r2_key !== key) await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, existing.pdf_r2_key)
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
    const ctx = getAdminCtx(c)
    const id = c.req.param('id')
    const existing = await getDirtRelease(c.env.DB, id)
    if (existing) {
      await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, existing.pdf_r2_key)
      await deleteDirtRelease(c.env.DB, id)
    }
    return c.redirect('/admin/content/the-dirt?ok=1', 303)
  })

  app.get('/admin/content/posts', (c) => c.redirect('/admin/content/the-dirt', 302))

  app.get('/admin/content/pages', async (c) => {
    const ctx = getAdminCtx(c)
    const [pages, customPages, committees] = await Promise.all([
      listPages(c.env.DB),
      listCustomPages(c.env.DB),
      listCommittees(c.env.DB),
    ])
    return c.html(
      <AdminContentPagesPage
        {...c.get('adminSite')}
        ctx={ctx}
        pages={pages}
        customPages={customPages}
        committees={committees}
        flash={flashMessage(c, '1')}
        error={c.req.query('error')}
      />,
    )
  })

  app.post('/admin/content/pages', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const title = typeof body.title === 'string' ? body.title : ''
    const slug = typeof body.slug === 'string' ? body.slug : ''
    const meta_description =
      typeof body.meta_description === 'string' ? body.meta_description.trim() : null
    const result = await createCustomPage(c.env.DB, {
      title,
      slug: slug || undefined,
      meta_description: meta_description || null,
      published: body.published === '1',
    })
    if (!result.ok) {
      return c.redirect(`/admin/content/pages?error=${encodeURIComponent(result.error)}`, 303)
    }
    return c.redirect(`/admin/content/pages/${result.slug}`, 303)
  })

  app.get('/admin/content/pages/:slug/preview', async (c) => {
    const ctx = getAdminCtx(c)
    const slug = c.req.param('slug')

    await seedContentIfEmpty(c.env)
    const page = await getPageBySlug(c.env.DB, slug)
    if (!page) return c.redirect(`/admin/content/pages/${slug}`, 303)

    const site = await loadPublicSiteContext(c.env)
    const extras = await loadCmsPageExtras(c.env.DB, slug, page)

    return c.html(
      <PagePreviewFrame slug={slug} published={page.published === 1}>
        {renderCmsPage(site, slug, page, extras)}
      </PagePreviewFrame>,
    )
  })

  app.post('/admin/content/pages/:slug/preview-draft', async (c) => {
    getAdminCtx(c)
    const slug = c.req.param('slug')

    let payload: { title?: string; meta_description?: string; body_json?: string }
    try {
      payload = await c.req.json()
    } catch {
      return c.text('Invalid JSON', 400)
    }

    const body_json = typeof payload.body_json === 'string' ? payload.body_json : null
    const blocks = parsePageBlocks(body_json)
    const body_md =
      blocks && blocks.length > 0
        ? blocksToMarkdown(blocks)
        : ''

    const page = {
      slug,
      title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : slug,
      body_md,
      body_json: blocks && blocks.length > 0 ? body_json : null,
      meta_description:
        typeof payload.meta_description === 'string' ? payload.meta_description.trim() : null,
      published: 0,
      is_custom: 0,
      updated_at: new Date().toISOString(),
    }

    await seedContentIfEmpty(c.env)
    const site = await loadPublicSiteContext(c.env)
    const extras = await loadCmsPageExtras(c.env.DB, slug, page)

    // Return a single <html> document for iframe srcdoc — PagePreviewFrame would prepend a
    // sibling <div> and break parsing/styles inside the live preview panel.
    const preview = renderCmsPage(site, slug, page, extras)
    return c.html(preview as string | Promise<string>)
  })

  app.get('/admin/content/pages/:slug', async (c) => {
    const ctx = getAdminCtx(c)
    const slug = c.req.param('slug')
    const page = await getPageBySlug(c.env.DB, slug)
    const [committees, customPages, internalLinks] = await Promise.all([
      listCommittees(c.env.DB),
      listCustomPages(c.env.DB),
      listSiteInternalLinks(c.env.DB),
    ])
    const pageLabels = buildPageLabels(committees, customPages)
    return c.html(
      <AdminContentPageEditPage
        {...c.get('adminSite')}
        ctx={ctx}
        page={page}
        slug={slug}
        pageLabel={pageLabels[slug] ?? page?.title ?? slug}
        committees={committees}
        internalLinks={internalLinks}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/content/pages/:slug/delete', async (c) => {
    const ctx = getAdminCtx(c)
    const slug = c.req.param('slug')
    const deleted = await deleteCustomPage(c.env.DB, slug)
    if (!deleted) {
      return c.redirect('/admin/content/pages?error=Only%20custom%20pages%20can%20be%20deleted', 303)
    }
    return c.redirect('/admin/content/pages?ok=1', 303)
  })

  app.post('/admin/content/pages/:slug', async (c) => {
    const ctx = getAdminCtx(c)
    const slug = c.req.param('slug')
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
    const ctx = getAdminCtx(c)
    const leaders = await listLeadership(c.env.DB)
    return c.html(
      <AdminContentLeadershipPage
        {...c.get('adminSite')}
        ctx={ctx}
        leaders={leaders}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/content/leadership', async (c) => {
    const ctx = getAdminCtx(c)
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
    const ctx = getAdminCtx(c)
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
        if (existing.photo_r2_key) await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, existing.photo_r2_key)
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
    const ctx = getAdminCtx(c)
    const id = c.req.param('id')
    const existing = await getLeadershipById(c.env.DB, id)
    if (existing?.photo_r2_key) await deleteAssetIfUnreferenced(c.env.R2, c.env.DB, existing.photo_r2_key)
    await deleteLeadership(c.env.DB, id)
    return c.redirect('/admin/content/leadership?ok=1', 303)
  })

  app.get('/admin/content/resources', async (c) => {
    const ctx = getAdminCtx(c)
    const items = await listResourceItems(c.env.DB)
    return c.html(
      <AdminContentResourcesPage
        {...c.get('adminSite')}
        ctx={ctx}
        items={items}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/content/resources', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const label = typeof body.label === 'string' ? body.label.trim() : ''
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    if (label && url) await createResourceItem(c.env.DB, { label, url, category })
    return c.redirect('/admin/content/resources?ok=1', 303)
  })

  app.post('/admin/content/resources/:id', async (c) => {
    const ctx = getAdminCtx(c)
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
    const ctx = getAdminCtx(c)
    await deleteResourceItem(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/content/resources?ok=1', 303)
  })

  app.get('/admin/content/member-types', async (c) => {
    const ctx = getAdminCtx(c)
    const items = await listMembershipTypes(c.env.DB)
    return c.html(
      <AdminContentMemberTypesPage
        {...c.get('adminSite')}
        ctx={ctx}
        items={items}
        flash={flashMessage(c, '1')}
        error={c.req.query('error') || undefined}
      />,
    )
  })

  app.post('/admin/content/member-types', async (c) => {
    getAdminCtx(c)
    const body = await c.req.parseBody()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const key = typeof body.key === 'string' ? body.key.trim() : undefined
    const result = await createMembershipType(c.env.DB, { name, description, key })
    if (!result.ok) {
      return c.redirect(`/admin/content/member-types?error=${encodeURIComponent(result.error)}`, 303)
    }
    return c.redirect('/admin/content/member-types?ok=1', 303)
  })

  app.post('/admin/content/member-types/:key', async (c) => {
    getAdminCtx(c)
    const body = await c.req.parseBody()
    await updateMembershipType(c.env.DB, c.req.param('key'), {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      description: typeof body.description === 'string' ? body.description.trim() : '',
      sort_order: parseSortOrder(typeof body.sort_order === 'string' ? body.sort_order : '0'),
      published: body.published === '1',
    })
    return c.redirect('/admin/content/member-types?ok=1', 303)
  })

  app.post('/admin/content/member-types/:key/delete', async (c) => {
    getAdminCtx(c)
    const result = await deleteMembershipType(c.env.DB, c.req.param('key'))
    if (!result.ok) {
      return c.redirect(`/admin/content/member-types?error=${encodeURIComponent(result.error)}`, 303)
    }
    return c.redirect('/admin/content/member-types?ok=1', 303)
  })

  app.get('/admin/newsletter', async (c) => {
    const ctx = getAdminCtx(c)
    const subscribers = await listNewsletterSubscribers(c.env.DB)
    return c.html(
      <AdminNewsletterSubscribersPage
        {...c.get('adminSite')}
        ctx={ctx}
        subscribers={subscribers}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.get('/admin/newsletter/export', async (c) => {
    const ctx = getAdminCtx(c)
    const subscribers = await listAllNewsletterSubscribers(c.env.DB)
    await writeAuditLog(c.env.DB, {
      userId: ctx.user.id,
      action: 'newsletter.export',
      resource: 'newsletter_subscribers',
      ip: clientIp(c.req.raw.headers),
      details: `${subscribers.length} subscribers`,
    })
    const csv = buildNewsletterSubscribersCsv(subscribers)
    const filename = newsletterSubscribersExportFilename()
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  })

  app.post('/admin/newsletter/acknowledge-all', async (c) => {
    const ctx = getAdminCtx(c)
    await acknowledgeAllNewsletterSubscribers(c.env.DB)
    return c.redirect('/admin/newsletter?ok=1', 303)
  })

  app.post('/admin/newsletter/:id', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const status = typeof body.status === 'string' ? body.status : 'acknowledged'
    await updateNewsletterSubscriberStatus(c.env.DB, c.req.param('id'), status)
    return c.redirect('/admin/newsletter?ok=1', 303)
  })

  app.post('/admin/newsletter/:id/delete', async (c) => {
    const ctx = getAdminCtx(c)
    await deleteNewsletterSubscriber(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/newsletter?ok=1', 303)
  })

  app.get('/admin/contact-messages', async (c) => {
    const ctx = getAdminCtx(c)
    const submissions = await listContactSubmissions(c.env.DB)
    return c.html(
      <AdminContactMessagesPage
        {...c.get('adminSite')}
        ctx={ctx}
        submissions={submissions}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/contact-messages/:id', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const status = typeof body.status === 'string' ? body.status : 'new'
    await updateContactSubmissionStatus(c.env.DB, c.req.param('id'), status)
    return c.redirect('/admin/contact-messages?ok=1', 303)
  })

  app.post('/admin/contact-messages/:id/delete', async (c) => {
    const ctx = getAdminCtx(c)
    await deleteContactSubmission(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/contact-messages?ok=1', 303)
  })

  app.post('/admin/contact-messages/acknowledge-all', async (c) => {
    const ctx = getAdminCtx(c)
    await acknowledgeAllContactSubmissions(c.env.DB)
    return c.redirect('/admin/contact-messages?ok=1', 303)
  })

  app.get('/admin/applications', async (c) => {
    const ctx = getAdminCtx(c)
    const applications = await listApplications(c.env.DB)
    return c.html(
      <AdminApplicationsPage
        {...c.get('adminSite')}
        ctx={ctx}
        applications={applications}
        flash={flashMessage(c, '1')}
      />,
    )
  })

  app.post('/admin/applications/:id', async (c) => {
    const ctx = getAdminCtx(c)
    const body = await c.req.parseBody()
    const status = typeof body.status === 'string' ? body.status : 'new'
    await updateApplicationStatus(c.env.DB, c.req.param('id'), status)
    return c.redirect('/admin/applications?ok=1', 303)
  })

  app.post('/admin/applications/:id/delete', async (c) => {
    const ctx = getAdminCtx(c)
    await deleteApplication(c.env.DB, c.req.param('id'))
    return c.redirect('/admin/applications?ok=1', 303)
  })

  app.post('/admin/applications/acknowledge-all', async (c) => {
    const ctx = getAdminCtx(c)
    await acknowledgeAllApplications(c.env.DB)
    return c.redirect('/admin/applications?ok=1', 303)
  })
}
