import type { Context, MiddlewareHandler } from 'hono'
import type { ThemeId } from '../config/themes'
import type { Env } from '../env'
import type { AdminLayoutProps } from './site-context'
import { resolveAdminContext, type AdminContext } from './admin-context'
import { verifyCsrfRequest } from './security/csrf'

type AdminApp = {
  Bindings: Env
  Variables: {
    theme: ThemeId
    adminSite: AdminLayoutProps
    adminCtx: AdminContext | null
  }
}

const PUBLIC_ADMIN_ROUTES = new Set(['GET /admin/login', 'POST /admin/login'])

function routeKey(method: string, path: string): string {
  return `${method} ${path}`
}

export function isPublicAdminRoute(method: string, path: string): boolean {
  return PUBLIC_ADMIN_ROUTES.has(routeKey(method, path))
}

export function adminAuthMiddleware(): MiddlewareHandler<AdminApp> {
  return async (c, next) => {
    if (!c.req.path.startsWith('/admin')) return next()

    if (isPublicAdminRoute(c.req.method, c.req.path)) {
      c.set('adminCtx', null)
      return next()
    }

    const ctx = await resolveAdminContext(c)
    if (!ctx) {
      if (c.req.path.startsWith('/admin/api/')) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      return c.redirect('/admin/login', 303)
    }

    c.set('adminCtx', ctx)
    return next()
  }
}

export function adminCsrfMiddleware(): MiddlewareHandler<AdminApp> {
  return async (c, next) => {
    if (c.req.method !== 'POST' || !c.req.path.startsWith('/admin')) return next()
    if (c.req.path === '/admin/login') return next()

    const ctx = c.get('adminCtx')
    if (!ctx) return next()

    const ok = await verifyCsrfRequest(c, ctx.csrfToken)
    if (!ok) return c.text('Forbidden', 403)

    return next()
  }
}

export function getAdminCtx(c: Context<AdminApp>): AdminContext {
  const ctx = c.get('adminCtx')
  if (!ctx) throw new Error('Admin context missing — auth middleware should run first')
  return ctx
}
