import { SOCIAL_PLATFORMS, type SocialLinks } from '../lib/social-links'

export function SocialLinksList({
  social,
  className = 'social-links',
}: {
  social?: SocialLinks
  className?: string
}) {
  if (!social) return null

  const items = SOCIAL_PLATFORMS.filter((platform) => social[platform.key]?.trim())
  if (items.length === 0) return null

  return (
    <ul class={className}>
      {items.map((platform) => (
        <li key={platform.key}>
          <a href={social[platform.key]!} rel="noopener noreferrer" target="_blank">
            {platform.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
