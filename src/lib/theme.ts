import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { parseThemeId, type ThemeId } from '../config/themes'

export const THEME_COOKIE = 'nuca_theme'

export function themeFromRequest(c: Context): ThemeId {
  return parseThemeId(getCookie(c, THEME_COOKIE))
}
