import type { Env } from '../env'
import { parseThemeId, type ThemeId } from '../config/themes'
import type { NavEntry } from '../nav/site-nav'
import type { AdminInboxCounts } from './admin-inbox-counts'
import { totalInboxCount } from './admin-inbox-counts'
import { getPublishedSiteNavigation } from './nav-items-db'
import { seedContentIfEmpty } from './seed'
import { resolveSiteLogoUrl } from './site-logo'
import {
  getBreakingNews,
  getContactInfo,
  getFooterInfo,
  getSiteLogoR2Key,
  getSiteLogoSizePercent,
  getThemeId,
  type BreakingNews,
  type ContactInfo,
  type FooterInfo,
} from './site-settings'

export type PublicSiteContext = {
  theme: ThemeId
  contact: ContactInfo
  footer: FooterInfo
  breakingNews: BreakingNews | null
  logoUrl: string
  logoSizePercent: number
  navigation: NavEntry[]
}

export type AdminLayoutProps = PublicSiteContext & {
  staffInboxCount?: number
}

export async function loadPublicSiteContext(
  env: Env,
  cookieTheme?: string | null,
): Promise<PublicSiteContext> {
  const theme = cookieTheme ? parseThemeId(cookieTheme) : await getThemeId(env.DB)
  const [contact, footer, breakingNews, logoR2Key, logoSizePercent, navigation] = await Promise.all([
    getContactInfo(env.DB),
    getFooterInfo(env.DB),
    getBreakingNews(env.DB),
    getSiteLogoR2Key(env.DB),
    getSiteLogoSizePercent(env.DB),
    getPublishedSiteNavigation(env.DB),
  ])
  return {
    theme,
    contact,
    footer,
    breakingNews,
    logoUrl: resolveSiteLogoUrl(logoR2Key),
    logoSizePercent,
    navigation,
  }
}

export async function loadAdminLayoutProps(
  env: Env,
  cookieTheme?: string | null,
  inboxCounts?: AdminInboxCounts,
): Promise<AdminLayoutProps> {
  await seedContentIfEmpty(env)
  const site = await loadPublicSiteContext(env, cookieTheme)
  const total = inboxCounts ? totalInboxCount(inboxCounts) : 0
  return {
    ...site,
    staffInboxCount: total > 0 ? total : undefined,
  }
}
