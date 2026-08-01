import { BreakingNewsPopup } from '../views/BreakingNewsPopup'
import { Layout, pickLayoutSite } from '../views/Layout'
import { ArchiveCard, ArchiveCardList } from '../views/ArchiveCard'
import { EventCard, EventMapThumbAssets } from '../views/EventCard'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import { mergeDirtFeed } from '../lib/dirt-feed'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import { homeBlocksFromPage, homePageIncludesEventsFeed } from '../lib/home-page'
import type { PageBlock } from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

const HOME_DESCRIPTION =
  'NUCA of Las Vegas chapter — members, events, advocacy, and industry resources.'

function HomeHeroBlock({ block }: { block: PageBlock & { type: 'hero' } }) {
  return (
    <section class="hero">
      <div class="container hero-copy">
        {block.eyebrow.trim() ? <p class="eyebrow">{block.eyebrow}</p> : null}
        <h1>{block.title}</h1>
        {block.lead.trim() ? <p class="hero-lead">{block.lead}</p> : null}
        <div class="hero-cta">
          {block.cta_primary_label.trim() ? (
            <a class="btn btn-primary" href={block.cta_primary_href}>
              {block.cta_primary_label}
            </a>
          ) : null}
          {block.cta_secondary_label.trim() ? (
            <a class="btn btn-secondary" href={block.cta_secondary_href}>
              {block.cta_secondary_label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function HomeEventsFeedBlock({
  block,
  events,
}: {
  block: PageBlock & { type: 'events_feed' }
  events: ExpandedEventRecord[]
}) {
  const shown = events.slice(0, block.limit)

  return (
    <section class="section" id="events">
      <div class="container">
        <h2>{block.title}</h2>
        {block.lead.trim() ? <p class="section-lead">{block.lead}</p> : null}
        <div class="event-list">
          {shown.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
        <p class="section-footer-link">
          <a class="text-link" href="/events">
            Full events calendar →
          </a>
        </p>
      </div>
    </section>
  )
}

function HomeDirtFeedBlock({
  block,
  dirtReleases,
  posts,
}: {
  block: PageBlock & { type: 'dirt_feed' }
  dirtReleases: DirtReleaseRecord[]
  posts: PostRecord[]
}) {
  const dirtItems = mergeDirtFeed(posts, dirtReleases).slice(0, block.limit)

  return (
    <section class="section section-muted" id="the-dirt">
      <div class="container">
        <h2>{block.title}</h2>
        {block.lead.trim() ? <p class="section-lead">{block.lead}</p> : null}
        <ArchiveCardList>
          {dirtItems.map((item) => {
            if (item.kind === 'post') {
              const post = item.post
              return (
                <li key={`post-${post.id}`}>
                  <ArchiveCard
                    href={`/industry-updates/${post.slug}`}
                    date={post.published_at ?? ''}
                    title={post.title}
                    summary={post.excerpt}
                  />
                </li>
              )
            }

            const release = item.release
            return (
              <li key={`release-${release.id}`}>
                <ArchiveCard
                  href={`/about/the-dirt/${release.id}`}
                  date={release.published_at}
                  title={release.title}
                  summary={release.summary}
                />
              </li>
            )
          })}
        </ArchiveCardList>
        <p class="section-footer-link">
          <a class="text-link" href="/the-dirt">
            All THE DIRT →
          </a>
        </p>
      </div>
    </section>
  )
}

function renderHomeBlock(
  block: PageBlock,
  index: number,
  data: {
    events: ExpandedEventRecord[]
    dirtReleases: DirtReleaseRecord[]
    posts: PostRecord[]
  },
) {
  let content = null
  switch (block.type) {
    case 'hero':
      content = <HomeHeroBlock block={block} />
      break
    case 'events_feed':
      content = <HomeEventsFeedBlock block={block} events={data.events} />
      break
    case 'dirt_feed':
      content = (
        <HomeDirtFeedBlock
          block={block}
          dirtReleases={data.dirtReleases}
          posts={data.posts}
        />
      )
      break
    default:
      return null
  }

  return (
    <div class="cms-preview-block" data-cms-block-index={String(index)} key={`block-${index}`}>
      {content}
    </div>
  )
}

export function HomePage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  navigation,
  staffInboxCount,
  page,
  events,
  dirtReleases,
  posts,
}: PageProps & {
  page: PageRecord | null
  events: ExpandedEventRecord[]
  dirtReleases: DirtReleaseRecord[]
  posts: PostRecord[]
}) {
  const blocks = homeBlocksFromPage(page?.body_json)
  const showEventMapAssets = homePageIncludesEventsFeed(blocks)

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, navigation, staffInboxCount })}
      title="Home"
      description={page?.meta_description ?? HOME_DESCRIPTION}
    >
      {blocks.map((block, index) => renderHomeBlock(block, index, { events, dirtReleases, posts }))}
      {showEventMapAssets ? <EventMapThumbAssets /> : null}
      {breakingNews?.showPopup ? <BreakingNewsPopup news={breakingNews} /> : null}
    </Layout>
  )
}
