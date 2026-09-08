import { DEFAULT_THEME, parseThemeId, type ThemeId } from '../config/themes'
import { site as defaultSite } from '../data/demo'
import {
  DEFAULT_MEMBER_GRID_LOGO_SIZE,
  DEFAULT_MEMBER_LIST_PAGINATION,
  parseMemberGridLogoSize,
  parseMemberListPaginationEnabled,
  type MemberGridLogoSizeId,
} from './member-directory-settings'
import {
  DEFAULT_LOGO_SIZE_PERCENT,
  parseLogoSizePercent,
} from './site-logo'
import type { SocialLinks } from './social-links'

export type ContactInfo = {
  name: string
  phone: string
  email: string
  address: string
  hours?: string
  social?: SocialLinks
}

export type FooterInfo = {
  dirtBlurb?: string
  copyrightNote?: string
}

export type BreakingNews = {
  active: boolean
  title: string
  body: string
  link?: string
  expiresAt?: string
  showPopup?: boolean
}

export type HeaderTitlePlacement = 'none' | 'beside' | 'below'

export type HeaderBranding = {
  title: string
  subtitle?: string
  placement: HeaderTitlePlacement
}

const DEFAULT_HEADER_BRANDING: HeaderBranding = {
  title: '',
  subtitle: '',
  placement: 'none',
}

export const DEFAULT_BREAKING_NEWS: BreakingNews = {
  active: false,
  title: '',
  body: '',
  showPopup: false,
}

export async function getSetting<T>(db: D1Database, key: string): Promise<T | null> {
  const row = await db
    .prepare('SELECT value_json FROM site_settings WHERE key = ?')
    .bind(key)
    .first<{ value_json: string }>()
  if (!row) return null
  try {
    return JSON.parse(row.value_json) as T
  } catch {
    return null
  }
}

/** Load all site_settings rows in one query (public layout reads several keys per request). */
export async function loadSiteSettingsMap(db: D1Database): Promise<Map<string, unknown>> {
  const { results } = await db
    .prepare('SELECT key, value_json FROM site_settings')
    .all<{ key: string; value_json: string }>()
  const map = new Map<string, unknown>()
  for (const row of results ?? []) {
    try {
      map.set(row.key, JSON.parse(row.value_json) as unknown)
    } catch {
      // Skip malformed rows; callers fall back to defaults.
    }
  }
  return map
}

export function settingFromMap<T>(map: Map<string, unknown>, key: string): T | null {
  if (!map.has(key)) return null
  return map.get(key) as T
}

export async function setSetting(db: D1Database, key: string, value: unknown): Promise<void> {
  await db
    .prepare(
      `INSERT INTO site_settings (key, value_json, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = datetime('now')`,
    )
    .bind(key, JSON.stringify(value))
    .run()
}

export async function getContactInfo(db: D1Database): Promise<ContactInfo> {
  const stored = await getSetting<ContactInfo>(db, 'contact')
  return stored ?? { ...defaultSite }
}

export async function setContactInfo(db: D1Database, contact: ContactInfo): Promise<void> {
  await setSetting(db, 'contact', contact)
}

export const DEFAULT_FOOTER: FooterInfo = {
  dirtBlurb: 'Weekly chapter news and event updates.',
  copyrightNote: '',
}

export async function getFooterInfo(db: D1Database): Promise<FooterInfo> {
  const stored = await getSetting<FooterInfo>(db, 'footer')
  return stored ?? { ...DEFAULT_FOOTER }
}

export async function setFooterInfo(db: D1Database, footer: FooterInfo): Promise<void> {
  await setSetting(db, 'footer', footer)
}

export async function getThemeId(db: D1Database): Promise<ThemeId> {
  const stored = await getSetting<string>(db, 'theme_id')
  return parseThemeId(stored)
}

export async function setThemeId(db: D1Database, themeId: ThemeId): Promise<void> {
  await setSetting(db, 'theme_id', themeId)
}

export async function getBreakingNewsSettings(db: D1Database): Promise<BreakingNews> {
  const stored = await getSetting<BreakingNews>(db, 'breaking_news')
  return stored ?? { ...DEFAULT_BREAKING_NEWS }
}

export function resolveBreakingNews(stored: BreakingNews): BreakingNews | null {
  if (!stored.active && !stored.showPopup) return null
  if (stored.expiresAt) {
    const expires = new Date(stored.expiresAt)
    if (!Number.isNaN(expires.getTime()) && expires.getTime() < Date.now()) return null
  }
  return stored
}

export async function getBreakingNews(db: D1Database): Promise<BreakingNews | null> {
  return resolveBreakingNews(await getBreakingNewsSettings(db))
}

export async function setBreakingNews(db: D1Database, news: BreakingNews): Promise<void> {
  await setSetting(db, 'breaking_news', news)
}

export async function getSiteLogoR2Key(db: D1Database): Promise<string | null> {
  const stored = await getSetting<string>(db, 'logo_r2_key')
  return stored ?? null
}

export async function setSiteLogoR2Key(db: D1Database, key: string | null): Promise<void> {
  if (key === null) {
    await db.prepare('DELETE FROM site_settings WHERE key = ?').bind('logo_r2_key').run()
    return
  }
  await setSetting(db, 'logo_r2_key', key)
}

export async function getSiteLogoSizePercent(db: D1Database): Promise<number> {
  const stored = await getSetting<number>(db, 'logo_size_percent')
  return parseLogoSizePercent(stored ?? DEFAULT_LOGO_SIZE_PERCENT)
}

export async function setSiteLogoSizePercent(db: D1Database, percent: number): Promise<void> {
  const value = parseLogoSizePercent(percent)
  if (value === DEFAULT_LOGO_SIZE_PERCENT) {
    await db.prepare('DELETE FROM site_settings WHERE key = ?').bind('logo_size_percent').run()
    return
  }
  await setSetting(db, 'logo_size_percent', value)
}

export function parseHeaderTitlePlacement(value: unknown): HeaderTitlePlacement {
  if (value === 'beside' || value === 'below') return value
  return 'none'
}

export function parseHeaderBranding(value: unknown): HeaderBranding {
  if (!value || typeof value !== 'object') return { ...DEFAULT_HEADER_BRANDING }
  const raw = value as Partial<HeaderBranding>
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const subtitle = typeof raw.subtitle === 'string' ? raw.subtitle.trim() : ''
  const placement = parseHeaderTitlePlacement(raw.placement)
  return {
    title,
    ...(subtitle ? { subtitle } : {}),
    placement,
  }
}

export async function getHeaderBranding(db: D1Database): Promise<HeaderBranding> {
  const stored = await getSetting<HeaderBranding>(db, 'header_branding')
  return parseHeaderBranding(stored)
}

export async function setHeaderBranding(db: D1Database, branding: HeaderBranding): Promise<void> {
  const value = parseHeaderBranding(branding)
  const isDefault =
    value.title === '' &&
    !value.subtitle &&
    value.placement === DEFAULT_HEADER_BRANDING.placement
  if (isDefault) {
    await db.prepare('DELETE FROM site_settings WHERE key = ?').bind('header_branding').run()
    return
  }
  await setSetting(db, 'header_branding', value)
}

export async function getMemberGridLogoSize(db: D1Database): Promise<MemberGridLogoSizeId> {
  const stored = await getSetting<string>(db, 'member_grid_logo_size')
  return parseMemberGridLogoSize(stored ?? DEFAULT_MEMBER_GRID_LOGO_SIZE)
}

export async function setMemberGridLogoSize(
  db: D1Database,
  size: MemberGridLogoSizeId,
): Promise<void> {
  const value = parseMemberGridLogoSize(size)
  if (value === DEFAULT_MEMBER_GRID_LOGO_SIZE) {
    await db.prepare('DELETE FROM site_settings WHERE key = ?').bind('member_grid_logo_size').run()
    return
  }
  await setSetting(db, 'member_grid_logo_size', value)
}

export async function getMemberListPaginationEnabled(db: D1Database): Promise<boolean> {
  const stored = await getSetting<boolean>(db, 'member_list_pagination')
  return parseMemberListPaginationEnabled(stored ?? DEFAULT_MEMBER_LIST_PAGINATION)
}

export async function setMemberListPaginationEnabled(db: D1Database, enabled: boolean): Promise<void> {
  const value = parseMemberListPaginationEnabled(enabled)
  if (value === DEFAULT_MEMBER_LIST_PAGINATION) {
    await db.prepare('DELETE FROM site_settings WHERE key = ?').bind('member_list_pagination').run()
    return
  }
  await setSetting(db, 'member_list_pagination', value)
}

export function phoneTelHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`
}

export const DEFAULT_COPYRIGHT_NOTE = ''
