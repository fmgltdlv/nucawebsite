import type { Env } from '../env'
import { parseThemeId, type ThemeId } from '../config/themes'
import { resolveSiteLogoUrl } from './site-logo'
import {
  getBreakingNews,
  getContactInfo,
  getFooterInfo,
  getSiteLogoR2Key,
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
}

export async function loadPublicSiteContext(
  env: Env,
  cookieTheme?: string | null,
): Promise<PublicSiteContext> {
  const theme = cookieTheme ? parseThemeId(cookieTheme) : await getThemeId(env.DB)
  const [contact, footer, breakingNews, logoR2Key] = await Promise.all([
    getContactInfo(env.DB),
    getFooterInfo(env.DB),
    getBreakingNews(env.DB),
    getSiteLogoR2Key(env.DB),
  ])
  return { theme, contact, footer, breakingNews, logoUrl: resolveSiteLogoUrl(logoR2Key) }
}
