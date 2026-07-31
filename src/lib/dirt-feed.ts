import type { DirtReleaseRecord } from './dirt-db'
import type { PostRecord } from './posts-db'

export type DirtFeedItem =
  | { kind: 'post'; post: PostRecord }
  | { kind: 'release'; release: DirtReleaseRecord }

export function mergeDirtFeed(posts: PostRecord[], releases: DirtReleaseRecord[]): DirtFeedItem[] {
  const items: DirtFeedItem[] = [
    ...posts.map((post) => ({ kind: 'post' as const, post })),
    ...releases.map((release) => ({ kind: 'release' as const, release })),
  ]
  return items.sort((a, b) => {
    const dateA = a.kind === 'post' ? (a.post.published_at ?? '') : a.release.published_at
    const dateB = b.kind === 'post' ? (b.post.published_at ?? '') : b.release.published_at
    return dateB.localeCompare(dateA)
  })
}
