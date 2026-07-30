import type { ExpandedEventRecord } from '../lib/event-repeat'
import type { PageProps } from '../types/page'
import { EventCard } from '../views/EventCard'
import { JsonScript } from '../views/JsonScript'
import { Layout, PageHeader } from '../views/Layout'

export type EventsView = 'list' | 'week' | 'month'

function eventsViewHref(view: EventsView, focusDate: string, page = 1): string {
  const params = new URLSearchParams()
  if (view !== 'list') params.set('view', view)
  if (view === 'list' && page > 1) params.set('page', String(page))
  if (view !== 'list') params.set('date', focusDate)
  const qs = params.toString()
  return qs ? `/events?${qs}` : '/events'
}

export function EventsPage({
  theme,
  contact,
  footer,
  breakingNews,
  events,
  calendarEvents,
  view,
  page,
  totalPages,
  totalEvents,
  focusDate,
}: PageProps & {
  events: ExpandedEventRecord[]
  calendarEvents: ExpandedEventRecord[]
  view: EventsView
  page: number
  totalPages: number
  totalEvents: number
  focusDate: string
}) {
  const views: { id: EventsView; label: string }[] = [
    { id: 'list', label: 'List' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ]

  return (
    <Layout theme={theme} contact={contact} footer={footer} breakingNews={breakingNews} title="Events">
      <PageHeader
        title="Events"
        lead="Chapter meetings, training, and member gatherings across Las Vegas."
      />
      <section class="section" id="events-page" data-view={view} data-focus-date={focusDate}>
        <div class="container">
          <div class="events-toolbar">
            <div class="filter-pills" role="tablist" aria-label="Events view">
              {views.map((item) => {
                const active = view === item.id
                return (
                  <a
                    key={item.id}
                    class={`pill ${active ? 'pill-active' : ''}`}
                    href={eventsViewHref(item.id, focusDate)}
                    role="tab"
                    aria-selected={active}
                  >
                    {item.label}
                  </a>
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
            <div class="event-list">
              {events.map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
              {events.length === 0 && <p class="prose">No upcoming events scheduled.</p>}
            </div>

            {totalPages > 1 && (
              <nav class="events-pagination" aria-label="Events list pagination">
                {page > 1 ? (
                  <a
                    class="btn btn-secondary btn-sm"
                    href={eventsViewHref('list', focusDate, page - 1)}
                    rel="prev"
                  >
                    Previous
                  </a>
                ) : (
                  <span class="btn btn-secondary btn-sm" aria-disabled="true">
                    Previous
                  </span>
                )}
                <span class="events-page-info">
                  Page {page} of {totalPages} ({totalEvents} upcoming)
                </span>
                {page < totalPages ? (
                  <a
                    class="btn btn-secondary btn-sm"
                    href={eventsViewHref('list', focusDate, page + 1)}
                    rel="next"
                  >
                    Next
                  </a>
                ) : (
                  <span class="btn btn-secondary btn-sm" aria-disabled="true">
                    Next
                  </span>
                )}
              </nav>
            )}
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
    </Layout>
  )
}