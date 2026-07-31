import type { ThemeId } from '../config/themes'
import type { BreakingNews, ContactInfo, FooterInfo } from '../lib/site-settings'
import type { NavEntry } from '../nav/site-nav'

export type SiteLayoutProps = {
  theme: ThemeId
  contact?: ContactInfo
  footer?: FooterInfo
  breakingNews?: BreakingNews | null
  logoUrl?: string
  navigation?: NavEntry[]
}

export type PageProps = SiteLayoutProps
