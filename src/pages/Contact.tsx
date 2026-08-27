import { Layout, PageHeader, pickLayoutSite } from '../views/Layout'
import { StatusPage } from '../views/StatusPage'
import type { ContactInfo } from '../lib/site-settings'
import { phoneTelHref } from '../lib/site-settings'
import { SocialLinksList } from '../views/SocialLinks'
import {
  findPageBlock,
  parsePageBlocks,
  renderPageContent,
  type PageBlock,
} from '../lib/page-blocks'
import type { PageRecord } from '../lib/pages-db'
import type { PageProps } from '../types/page'

const DEFAULT_CONTACT_FORM: Extract<PageBlock, { type: 'contact_form' }> = {
  type: 'contact_form',
  name_label: 'Name',
  email_label: 'Email',
  message_label: 'Message',
  submit_label: 'Send message',
}

export function ContactPage({
  theme,
  contact,
  footer,
  breakingNews,
  logoUrl,
  logoSizePercent,
  navigation,
  staffInboxCount,
  page,
}: PageProps & { contact?: ContactInfo; page?: PageRecord | null }) {
  const title = page?.title ?? 'Contact us'
  const lead =
    page?.meta_description ?? 'Reach the Las Vegas chapter by phone, email, or the form below.'
  const blocks = parsePageBlocks(page?.body_json ?? null)
  const formBlock = findPageBlock(blocks, 'contact_form') ?? DEFAULT_CONTACT_FORM
  const introBlocks = (blocks ?? []).filter(
    (block) => block.type !== 'contact_form' && block.type !== 'newsletter_panel',
  )

  return (
    <Layout
      {...pickLayoutSite({ theme, contact, footer, breakingNews, logoUrl, logoSizePercent, navigation, staffInboxCount })}
      title={title}
      description={page?.meta_description ?? undefined}
    >
      <PageHeader title={title} lead={lead} />
      {introBlocks.length > 0 && (
        <section class="section">
          <div class="container prose">
            {renderPageContent('', JSON.stringify(introBlocks))}
          </div>
        </section>
      )}
      <section class="section">
        <div class="container contact-layout">
          <div class="prose">
            {contact && (
              <>
                <p>
                  <strong>{contact.name}</strong>
                  <br />
                  {contact.address}
                </p>
                <p>
                  Phone: <a href={phoneTelHref(contact.phone)}>{contact.phone}</a>
                  <br />
                  Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
                {contact.hours && <p>Hours: {contact.hours}</p>}
                <SocialLinksList social={contact.social} />
              </>
            )}
            {renderPageContent('', JSON.stringify([formBlock]))}
            <p class="section-lead">
              For THE DIRT email delivery,{' '}
              <a href="/the-dirt#newsletter">subscribe on the THE DIRT page</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export function ContactThanksPage(props: PageProps) {
  return (
    <StatusPage
      {...props}
      title="Message sent"
      heading="Thank you"
      lead="Your message has been sent to the chapter."
      ctaHref="/"
      ctaLabel="Back to home"
    />
  )
}

export function ContactErrorPage({
  error,
  ...props
}: PageProps & { error: string }) {
  return (
    <StatusPage
      {...props}
      title="Contact"
      heading="Contact us"
      lead={error}
      ctaHref="/contact"
      ctaLabel="Try again"
    />
  )
}
