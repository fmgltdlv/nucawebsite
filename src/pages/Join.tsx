import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { JoinApplicationAside, JoinApplicationModal, JoinApplyButton } from '../views/JoinApplicationForm'
import { StatusPage } from '../views/StatusPage'
import { renderPageContent } from '../lib/page-blocks'
import type { CommitteeRecord } from '../lib/committees-db'
import type { MembershipTypeRecord } from '../lib/membership-types-db'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

export function JoinPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  committees,
  page,
  membershipTypes = [],
}: PageProps & {
  committees: CommitteeRecord[]
  page?: PageRecord | null
  membershipTypes?: MembershipTypeRecord[]
}) {
  const title = page?.title ?? 'Join NUCA of Las Vegas'
  const lead =
    page?.meta_description ??
    'Membership connects your firm to advocacy, safety resources, events, and a network of industry peers.'
  const hasBlocks = Boolean(page?.body_json || page?.body_md?.trim())

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })}
      title={title}
      description={page?.meta_description ?? undefined}
    >
      <PageHeader title={title} lead={lead} actions={<JoinApplyButton />} />

      {hasBlocks ? (
        <section class="section">
          <div class="container">
            {renderPageContent(page?.body_md ?? '', page?.body_json, {
              membershipTypes: membershipTypes.map((t) => ({
                key: t.key,
                name: t.name,
                description: t.description,
              })),
            })}
          </div>
        </section>
      ) : null}

      <section class="section">
        <div class="container join-grid join-grid--application">
          <div>
            <h2>Apply online</h2>
            <p class="section-lead">
              Complete the same information as the chapter membership application. You can also download the PDF and
              return it by email.
            </p>
            <JoinApplyButton />
          </div>
          <JoinApplicationAside />
        </div>
      </section>

      <JoinApplicationModal committees={committees} membershipTypes={membershipTypes} />
    </Layout>
  )
}

export function JoinThanksPage(props: PageProps) {
  return (
    <StatusPage
      {...props}
      title="Application received"
      heading="Thank you"
      lead="Your membership application has been received. Chapter staff will follow up with next steps."
      prose
    >
      <p>Questions? Contact the chapter through the <a href="/contact">Contact page</a>.</p>
      <a class="btn btn-primary" href="/">Back to home</a>
    </StatusPage>
  )
}
