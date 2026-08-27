export type SocialLinks = {
  facebook?: string
  instagram?: string
  linkedin?: string
  x?: string
  youtube?: string
}

export const SOCIAL_PLATFORMS: ReadonlyArray<{
  key: keyof SocialLinks
  label: string
  placeholder: string
}> = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/…' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/…' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/…' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/…' },
]

export function hasSocialLinks(social?: SocialLinks): boolean {
  if (!social) return false
  return SOCIAL_PLATFORMS.some((platform) => social[platform.key]?.trim())
}

export function parseSocialLinksFromBody(body: Record<string, unknown>): SocialLinks | undefined {
  const social: SocialLinks = {}
  for (const platform of SOCIAL_PLATFORMS) {
    const field = `social_${platform.key}`
    const value = body[field]
    if (typeof value === 'string' && value.trim()) {
      social[platform.key] = value.trim()
    }
  }
  return hasSocialLinks(social) ? social : undefined
}
