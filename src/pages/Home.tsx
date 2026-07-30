import { Layout } from '../views/Layout'
import { ArchiveCard, ArchiveCardList } from '../views/ArchiveCard'
import { EventCard } from '../views/EventCard'
import type { DirtReleaseRecord } from '../lib/dirt-db'
import type { ExpandedEventRecord } from '../lib/event-repeat'
import type { PostRecord } from '../lib/posts-db'
import type { PageProps } from '../types/page'

export function HomePage({
  theme,
  contact,
  footer,
  breakingNews,
  events,
  dirtReleases,
  posts,
}: PageProps & {
  events: ExpandedEventRecord[]
  dirtReleases: DirtReleaseRecord[]
  posts: PostRecord[]
}) {
  const industryUpdates = posts.length > 0 ? posts.slice(0, 3) : dirtReleases.slice(0, 3)

  return (
    <Layout
      theme={theme}
      contact={contact}
      footer={footer}
      breakingNews={breakingNews}
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

      <section class="section section-muted" id="industry-updates">
        <div class="container">
          <h2>Industry updates</h2>
          <p class="section-lead">
            News, policy, and chapter announcements. See also{' '}
            <a href="/about/the-dirt">THE DIRT</a> archive.
          </p>
          <ArchiveCardList>
            {industryUpdates.map((item) => {
              const isPost = 'slug' in item
              const href = isPost
                ? `/industry-updates/${(item as PostRecord).slug}`
                : `/about/the-dirt/${item.id}`
              const date = isPost
                ? (item as PostRecord).published_at ?? ''
                : (item as DirtReleaseRecord).published_at
              const title = item.title
              const summary = isPost ? (item as PostRecord).excerpt : (item as DirtReleaseRecord).summary
              return (
                <li key={item.id}>
                  <ArchiveCard
                    href={href}
                    date={date}
                    title={title}
                    summary={summary}
                    ctaLabel="Read update →"
                  />
                </li>
              )
            })}
          </ArchiveCardList>
          <p class="section-footer-link">
            <a class="text-link" href="/industry-updates">All industry updates →</a>
          </p>
        </div>
      </section>
    </Layout>
  )
}
