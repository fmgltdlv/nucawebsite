import type { Env } from '../env'
import { parseThemeId, type ThemeId } from '../config/themes'
import {
  getBreakingNews,
  getContactInfo,
  getFooterInfo,
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
}

export async function loadPublicSiteContext(
  env: Env,
  cookieTheme?: string | null,
): Promise<PublicSiteContext> {
  const theme = cookieTheme ? parseThemeId(cookieTheme) : await getThemeId(env.DB)
  const [contact, footer, breakingNews] = await Promise.all([
    getContactInfo(env.DB),
    getFooterInfo(env.DB),
    getBreakingNews(env.DB),
  ])
  return { theme, contact, footer, breakingNews }
}
