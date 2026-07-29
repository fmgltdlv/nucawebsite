import { themeOptions, type ThemeId } from '../config/themes'

export function ThemeSwitcher({ activeTheme }: { activeTheme: ThemeId }) {
  return (
    <form class="theme-switcher" method="post" action="/theme">
      <label class="theme-switcher-label" for="theme-select">Appearance</label>
      <select
        name="theme"
        id="theme-select"
        class="theme-select"
        aria-label="Site color theme"
        onchange="this.form.submit()"
      >
        {themeOptions.map((opt) => (
          <option value={opt.id} key={opt.id} selected={opt.id === activeTheme}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  )
}
