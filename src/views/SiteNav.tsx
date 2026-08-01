import { isNavGroup, type NavEntry, type NavLink } from '../nav/site-nav'

function NavAnchor({ link, nested }: { link: NavLink; nested?: boolean }) {
  const classes = [nested ? 'submenu-link' : '', link.indent ? 'submenu-link-indent' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <a href={link.href} class={classes || undefined}>
      <span>{link.label}</span>
    </a>
  )
}

export function SiteNav({ navigation }: { navigation: NavEntry[] }) {
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
                      <span>{entry.label}</span>
                    </a>
                  ) : (
                    <span class="nav-parent-label">
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
    </nav>
  )
}
