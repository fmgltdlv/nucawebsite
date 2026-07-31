import type { PageBlock } from './page-blocks'
import { parsePageBlocks, serializePageBlocks } from './page-blocks'

export function defaultHomeBlocks(): PageBlock[] {
  return [
    {
      type: 'hero',
      eyebrow: 'National Utility Contractors Association',
      title: 'Building Southern Nevada’s utility construction community',
      lead:
        'Connect with contractors, suppliers, and public partners. Advocate for the industry, sharpen safety practices, and grow your business through the local NUCA chapter.',
      cta_primary_label: 'Join the chapter',
      cta_primary_href: '/join',
      cta_secondary_label: 'View member list',
      cta_secondary_href: '/members',
    },
    {
      type: 'events_feed',
      title: 'Calendar events',
      lead: 'Chapter meetings, training, and member gatherings across Las Vegas.',
      limit: 3,
    },
    {
      type: 'dirt_feed',
      title: 'THE DIRT',
      lead: 'News, policy, and chapter announcements.',
      limit: 3,
    },
  ]
}

export function homeBlocksFromPage(body_json: string | null | undefined): PageBlock[] {
  const fromJson = parsePageBlocks(body_json)
  if (fromJson && fromJson.length > 0) return fromJson
  return defaultHomeBlocks()
}

export function defaultHomePageSeed() {
  const blocks = defaultHomeBlocks()
  return {
    slug: 'home',
    title: 'Home',
    body_md: '',
    body_json: serializePageBlocks(blocks),
    meta_description:
      'NUCA of Las Vegas chapter — members, events, advocacy, and industry resources.',
    published: true,
  }
}

export function homePageIncludesEventsFeed(blocks: PageBlock[]): boolean {
  return blocks.some((block) => block.type === 'events_feed')
}
