import type { Env } from '../env'
import { parseThemeId, type ThemeId } from '../config/themes'
import { site as defaultSite } from '../data/demo'
import type { NavEntry } from '../nav/site-nav'
import type { AdminInboxCounts } from './admin-inbox-counts'
import { totalInboxCount } from './admin-inbox-counts'
import { getPublishedSiteNavigation } from './nav-items-db'
import { seedContentIfEmpty } from './seed'
import { DEFAULT_LOGO_SIZE_PERCENT, parseLogoSizePercent, resolveSiteLogoUrl } from './site-logo'
import {
  DEFAULT_BREAKING_NEWS,
  DEFAULT_FOOTER,
  loadSiteSettingsMap,
  parseHeaderBranding,
  resolveBreakingNews,
  settingFromMap,
  type BreakingNews,
  type ContactInfo,
  type FooterInfo,
  type HeaderBranding,
} from './site-settings'

export type PublicSiteContext = {
  theme: ThemeId
  contact: ContactInfo
  footer: FooterInfo
  breakingNews: BreakingNews | null
  logoUrl: string
  logoSizePercent: number
  headerBranding: HeaderBranding
  navigation: NavEntry[]
}

export type AdminLayoutProps = PublicSiteContext & {
  staffInboxCount?: number
}

export async function loadPublicSiteContext(env: Env): Promise<PublicSiteContext> {
  const [settings, navigation] = await Promise.all([
    loadSiteSettingsMap(env.DB),
    getPublishedSiteNavigation(env.DB),
  ])
  const contact = settingFromMap<ContactInfo>(settings, 'contact') ?? { ...defaultSite }
  const footer = settingFromMap<FooterInfo>(settings, 'footer') ?? { ...DEFAULT_FOOTER }
  const breakingStored =
    settingFromMap<BreakingNews>(settings, 'breaking_news') ?? { ...DEFAULT_BREAKING_NEWS }
  const logoR2Key = settingFromMap<string>(settings, 'logo_r2_key')
  const logoSizeStored = settingFromMap<number>(settings, 'logo_size_percent')
  return {
    theme: parseThemeId(settingFromMap<string>(settings, 'theme_id')),
    contact,
    footer,
    breakingNews: resolveBreakingNews(breakingStored),
    logoUrl: resolveSiteLogoUrl(logoR2Key),
    logoSizePercent: parseLogoSizePercent(logoSizeStored ?? DEFAULT_LOGO_SIZE_PERCENT),
    headerBranding: parseHeaderBranding(settingFromMap(settings, 'header_branding')),
    navigation,
  }
}

export async function loadAdminLayoutProps(
  env: Env,
  inboxCounts?: AdminInboxCounts,
): Promise<AdminLayoutProps> {
  await seedContentIfEmpty(env)
  const site = await loadPublicSiteContext(env)
  const total = inboxCounts ? totalInboxCount(inboxCounts) : 0
  return {
    ...site,
    staffInboxCount: total > 0 ? total : undefined,
  }
}
