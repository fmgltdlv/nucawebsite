import { Layout, pickLayoutSite } from '../views/Layout'
import { ArchiveCard, ArchiveCardList } from '../views/ArchiveCard'
import { EventCard } from '../views/EventCard'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import { mergeDirtFeed } from '../lib/dirt-feed'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

export function HomePage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  events,
  dirtReleases,
  posts,
}: PageProps & {
  events: ExpandedEventRecord[]
  dirtReleases: DirtReleaseRecord[]
  posts: PostRecord[]
}) {
  const dirtItems = mergeDirtFeed(posts, dirtReleases).slice(0, 3)

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl })}
      title="Home"
      description="NUCA of Las Vegas chapter — members, events, advocacy, and industry resources."
    >
      <section class="hero">
        <div class="container hero-copy">
          <p class="eyebrow">National Utility Contractors Association</p>
          <h1>Building Southern Nevada’s utility construction community</h1>
          <p class="hero-lead">
            Connect with contractors, suppliers, and public partners. Advocate for the industry, sharpen safety
            practices, and grow your business through the local NUCA chapter.
          </p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="/join">Join the chapter</a>
            <a class="btn btn-secondary" href="/members">View member list</a>
          </div>
        </div>
      </section>

      <section class="section" id="events">
        <div class="container">
          <h2>Calendar events</h2>
          <p class="section-lead">Chapter meetings, training, and member gatherings across Las Vegas.</p>
          <div class="event-list">
            {events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
          <p class="section-footer-link">
            <a class="text-link" href="/events">Full events calendar →</a>
          </p>
        </div>
      </section>

      <section class="section section-muted" id="the-dirt">
        <div class="container">
          <h2>THE DIRT</h2>
          <p class="section-lead">News, policy, and chapter announcements.</p>
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
                      ctaLabel="Read update →"
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
                    ctaLabel="Read update →"
                  />
                </li>
              )
            })}
          </ArchiveCardList>
          <p class="section-footer-link">
            <a class="text-link" href="/the-dirt">All THE DIRT →</a>
          </p>
        </div>
      </section>
    </Layout>
  )
}
