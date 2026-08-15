import type { ExpandedEventRecord } from '../lib/event-repeat'
import type { CommitteeRecord } from '../lib/committees-db'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'
import { EVENTS_LIST_PAGE_SIZE } from '../lib/events'
import { renderPageContent } from '../lib/page-blocks'
import { EventCard, EventMapThumbAssets } from '../views/EventCard'
import { JsonScript } from '../views/JsonScript'
import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'

export type EventsView = 'list' | 'week' | 'month'

export function EventsPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  events,
  calendarEvents,
  view,
  page,
  totalPages,
  totalEvents,
  focusDate,
  committeeKey,
  committees,
  cmsPage,
}: PageProps & {
  events: ExpandedEventRecord[]
  calendarEvents: ExpandedEventRecord[]
  view: EventsView
  page: number
  totalPages: number
  totalEvents: number
  focusDate: string
  committeeKey: string | null
  committees: CommitteeRecord[]
  cmsPage?: PageRecord | null
}) {
  const views: { id: EventsView; label: string }[] = [
    { id: 'list', label: 'List' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ]
  const title = cmsPage?.title ?? 'Events'
  const lead =
    cmsPage?.meta_description ??
    'Chapter meetings, training, and member gatherings across Las Vegas.'
  const intro = cmsPage?.body_json || cmsPage?.body_md?.trim()

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })}
      title={title}
      description={cmsPage?.meta_description ?? undefined}
    >
      <PageHeader title={title} lead={lead} />
      {intro && (
        <section class="section">
          <div class="container prose">
            {renderPageContent(cmsPage?.body_md ?? '', cmsPage?.body_json)}
          </div>
        </section>
      )}
      <section
        class="section"
        id="events-page"
        data-view={view}
        data-focus-date={focusDate}
        data-committee={committeeKey ?? ''}
        data-list-page-size={EVENTS_LIST_PAGE_SIZE}
      >
        <div class="container">
          <div class="events-toolbar">
            <div class="filter-pills" id="events-view-tabs" role="tablist" aria-label="Events view">
              {views.map((item) => {
                const active = view === item.id
                return (
                  <button
                    type="button"
                    key={item.id}
                    class={`pill ${active ? 'pill-active' : ''}`}
                    data-view={item.id}
                    role="tab"
                    aria-selected={active}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
            <div
              class="filter-pills events-committee-filters"
              id="events-committee-filters"
              role="group"
              aria-label="Filter by committee"
            >
              <button
                type="button"
                class={`pill ${!committeeKey ? 'pill-active' : ''}`}
                data-committee=""
              >
                All committees
              </button>
              {committees.map((committee) => {
                const active = committeeKey === committee.key
                return (
                  <button
                    type="button"
                    key={committee.key}
                    class={`pill ${active ? 'pill-active' : ''}`}
                    data-committee={committee.key}
                  >
                    {committee.name.replace(' Committee', '')}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            id="events-view-list"
            class="events-view"
            hidden={view !== 'list' ? true : undefined}
            role="tabpanel"
          >
            <div class="event-list" id="events-list">
              {events.map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
            <p class="prose" id="events-list-empty" hidden={events.length > 0 ? true : undefined}>
              No upcoming events scheduled.
            </p>

            <nav
              class="events-pagination"
              id="events-pagination"
              aria-label="Events list pagination"
              hidden={totalPages <= 1 ? true : undefined}
            >
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                id="events-page-prev"
                disabled={page <= 1 ? true : undefined}
              >
                Previous
              </button>
              <span class="events-page-info" id="events-page-info">
                Page {page} of {totalPages} ({totalEvents} upcoming)
              </span>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                id="events-page-next"
                disabled={page >= totalPages ? true : undefined}
              >
                Next
              </button>
            </nav>
          </div>

          <div
            id="events-view-week"
            class="events-view"
            hidden={view !== 'week' ? true : undefined}
            role="tabpanel"
          >
            <div class="events-cal-toolbar">
              <button type="button" class="btn btn-secondary btn-sm" id="events-week-prev">
                Previous week
              </button>
              <h2 class="events-cal-label" id="events-week-label" />
              <button type="button" class="btn btn-secondary btn-sm" id="events-week-next">
                Next week
              </button>
            </div>
            <div id="events-week-grid" class="events-week-grid" />
            <noscript>
              <p class="table-note">Week view requires JavaScript. Use the list view instead.</p>
            </noscript>
          </div>

          <div
            id="events-view-month"
            class="events-view"
            hidden={view !== 'month' ? true : undefined}
            role="tabpanel"
          >
            <div class="events-cal-toolbar">
              <button type="button" class="btn btn-secondary btn-sm" id="events-month-prev">
                Previous month
              </button>
              <h2 class="events-cal-label" id="events-month-label" />
              <button type="button" class="btn btn-secondary btn-sm" id="events-month-next">
                Next month
              </button>
            </div>
            <div class="events-month-weekdays" aria-hidden="true">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div id="events-month-grid" class="events-month-grid" />
            <noscript>
              <p class="table-note">Month view requires JavaScript. Use the list view instead.</p>
            </noscript>
          </div>

          <JsonScript id="events-calendar-data" json={JSON.stringify(calendarEvents)} />
        </div>
      </section>
      <EventMapThumbAssets />
    </Layout>
  )
}
