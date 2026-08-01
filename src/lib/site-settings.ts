import { DEFAULT_THEME, parseThemeId, type ThemeId } from '../config/themes'
import { site as defaultSite } from '../data/demo'
import {
  DEFAULT_LOGO_SIZE_PERCENT,
  parseLogoSizePercent,
} from './site-logo'

export type ContactInfo = {
  name: string
  phone: string
  email: string
  address: string
  hours?: string
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

const DEFAULT_BREAKING_NEWS: BreakingNews = {
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

export async function getFooterInfo(db: D1Database): Promise<FooterInfo> {
  const stored = await getSetting<FooterInfo>(db, 'footer')
  return (
    stored ?? {
      dirtBlurb: 'Weekly chapter news and event updates.',
      copyrightNote: '',
    }
  )
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

export async function getBreakingNews(db: D1Database): Promise<BreakingNews | null> {
  const stored = await getBreakingNewsSettings(db)
  if (!stored.active && !stored.showPopup) return null
  if (stored.expiresAt) {
    const expires = new Date(stored.expiresAt)
    if (!Number.isNaN(expires.getTime()) && expires.getTime() < Date.now()) return null
  }
  return stored
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

export function phoneTelHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`
}

export const DEFAULT_COPYRIGHT_NOTE = ''
