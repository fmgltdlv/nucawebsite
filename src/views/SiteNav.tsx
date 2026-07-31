import {
  isNavGroup,
  statusLegend,
  type NavEntry,
  type NavLink,
  type PageStatus,
} from '../nav/site-nav'

function StatusMark({ status }: { status: PageStatus }) {
  return (
    <span
      class={`nav-status nav-status-${status}`}
      title={statusLegend[status]}
      aria-label={statusLegend[status]}
    />
  )
}

function NavAnchor({ link, nested }: { link: NavLink; nested?: boolean }) {
  const classes = [nested ? 'submenu-link' : '', link.indent ? 'submenu-link-indent' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <a href={link.href} class={classes || undefined}>
      {link.status && <StatusMark status={link.status} />}
      <span>{link.label}</span>
    </a>
  )
}

function navHasStatus(entries: NavEntry[]): boolean {
  return entries.some((entry) => {
    if (isNavGroup(entry)) {
      return Boolean(entry.status) || entry.children.some((child) => Boolean(child.status))
    }
    return Boolean(entry.status)
  })
}

export function SiteNav({ navigation }: { navigation: NavEntry[] }) {
  const showStatusLegend = navHasStatus(navigation)

  return (
    <nav class="site-nav" id="site-nav" aria-label="Primary">
      <ul class="nav-root">
        {navigation.map((entry) => {
          if (isNavGroup(entry)) {
            return (
              <li class="nav-item has-submenu" key={entry.label}>
                <div class="nav-parent-row">
                  {entry.href ? (
                    <a href={entry.href} class="nav-parent-link">
                      {entry.status && <StatusMark status={entry.status} />}
                      <span>{entry.label}</span>
                    </a>
                  ) : (
                    <span class="nav-parent-label">
                      {entry.status && <StatusMark status={entry.status} />}
                      <span>{entry.label}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    class="submenu-toggle"
                    aria-expanded="false"
                    aria-label={`${entry.label} submenu`}
                  >
                    ▾
                  </button>
                </div>
                <ul class="submenu">
                  {entry.children.map((child) => (
                    <li key={child.href}>
                      <NavAnchor link={child} nested />
                    </li>
                  ))}
                </ul>
              </li>
            )
          }

          return (
            <li class="nav-item" key={entry.href}>
              <NavAnchor link={entry} />
            </li>
          )
        })}
      </ul>
      {showStatusLegend && (
        <p class="nav-legend" id="nav-legend">
          <span class="nav-legend-title">Copy status</span>
          <span class="nav-legend-item">
            <span class="nav-status nav-status-demo" /> Demo
          </span>
          <span class="nav-legend-item">
            <span class="nav-status nav-status-stub" /> Stub
          </span>
          <span class="nav-legend-item">
            <span class="nav-status nav-status-todo" /> To copy
          </span>
        </p>
      )}
    </nav>
  )
}
