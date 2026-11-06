import type { ThemeId } from '../config/themes'
import type { BreakingNews, ContactInfo, FooterInfo, HeaderBranding } from '../lib/site-settings'
import type { ServerLastUpdated } from '../lib/worker-version'
import type { NavEntry } from '../nav/site-nav'

export type SiteLayoutProps = {
  theme: ThemeId
  contact?: ContactInfo
  footer?: FooterInfo
  breakingNews?: BreakingNews | null
  logoUrl?: string
  logoSizePercent?: number
  headerBranding?: HeaderBranding
  navigation?: NavEntry[]
  turnstileSiteKey?: string
  staffInboxCount?: number
  serverLastUpdated?: ServerLastUpdated
}

export type PageProps = SiteLayoutProps
