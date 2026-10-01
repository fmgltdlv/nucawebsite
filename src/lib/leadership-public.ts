import type { LeadershipRecord } from './leadership-db'
import { getAssetUrl } from './r2-assets'

export type LeadershipPublicProfile = {
  id: string
  name: string
  role_title: string
  chair_title: string | null
  company: string | null
  website: string | null
  linkedin_url: string | null
  bio: string | null
  photoUrl: string | null
}

import { optionalSafeHref } from './security/urls'

export function toLeadershipPublicProfile(person: LeadershipRecord): LeadershipPublicProfile {
  return {
    id: person.id,
    name: person.name,
    role_title: person.role_title,
    chair_title: person.chair_title,
    company: person.company,
    website: optionalSafeHref(person.website) ?? null,
    linkedin_url: optionalSafeHref(person.linkedin_url) ?? null,
    bio: person.bio,
    photoUrl: person.photo_r2_key ? getAssetUrl(person.photo_r2_key) : null,
  }
}

export function serializeLeadershipRoster(profiles: LeadershipPublicProfile[]): string {
  return JSON.stringify(profiles).replace(/</g, '\\u003c')
}
