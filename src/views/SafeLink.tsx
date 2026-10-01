import { safeHref } from '../lib/security/urls'

type SafeLinkProps = {
  href?: string | null
  class?: string
  target?: string
  rel?: string
  children?: unknown
}

/** Renders an anchor only when `href` uses an allowed scheme. */
export function SafeLink({ href, children, ...attrs }: SafeLinkProps) {
  const safe = safeHref(href)
  if (!safe) return <span class={attrs.class}>{children}</span>
  return (
    <a href={safe} class={attrs.class} target={attrs.target} rel={attrs.rel}>
      {children}
    </a>
  )
}
