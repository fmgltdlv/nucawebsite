import type { ThemeId } from '../config/themes'
import type { BreakingNews, ContactInfo, FooterInfo } from '../lib/site-settings'

export type SiteLayoutProps = {
  theme: ThemeId
  contact?: ContactInfo
  footer?: FooterInfo
  breakingNews?: BreakingNews | null
}

export type PageProps = SiteLayoutProps
