import type { PageBlock } from './page-blocks'
import { serializePageBlocks } from './page-blocks'

export const DEFAULT_JOIN_BLOCKS: PageBlock[] = [
  {
    type: 'section',
    title: 'Why members join',
    background: 'none',
    muted: false,
    blocks: [
      {
        type: 'text',
        body:
          'From Washington advocacy to local networking, NUCA gives utility and excavation firms a voice and a playbook.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'Member pricing on chapter events',
          'Committee leadership and board pathways',
          'Safety and training resources',
          'Full national NUCA member benefits',
        ],
      },
    ],
  },
  {
    type: 'stats_panel',
    items: [
      { value: '50+', label: 'Years of national NUCA safety leadership' },
      { value: 'Local', label: 'Las Vegas chapter focused on Nevada projects & policy' },
      { value: 'Industry', label: 'Contractors, associates, and institutional partners' },
    ],
  },
  {
    type: 'benefits_grid',
    title: 'Member benefits',
    items: [
      {
        title: 'Member pricing for NUCA events',
        body: 'Save on registration and connect with industry peers at local chapter events.',
      },
      {
        title: 'Committees & leadership paths',
        body: 'Serve on committees and be considered for local and national board roles.',
      },
      {
        title: 'Advocacy in Washington',
        body: 'NUCA’s national team tracks federal policy and mobilizes members when it matters.',
      },
      {
        title: 'Safety & training',
        body: 'Stay ahead of regulations and training expectations that affect utility construction.',
      },
      {
        title: 'National NUCA benefits',
        body: 'Full access to resources and programs available to NUCA members nationwide.',
      },
    ],
  },
  {
    type: 'member_types',
    title: 'Membership types',
  },
]

export const DEFAULT_CONTACT_BLOCKS: PageBlock[] = [
  {
    type: 'contact_form',
    name_label: 'Name',
    email_label: 'Email',
    message_label: 'Message',
    submit_label: 'Send message',
  },
  {
    type: 'newsletter_panel',
    title: 'Newsletter — THE DIRT',
    body: 'Join the mailing list for chapter news and upcoming events.',
    consent_hint:
      'By subscribing you agree to receive chapter emails. We will not sell your information.',
    button_label: 'Subscribe',
  },
]

export function defaultJoinPageSeed() {
  return {
    slug: 'join',
    title: 'Join NUCA of Las Vegas',
    body_md: '',
    body_json: serializePageBlocks(DEFAULT_JOIN_BLOCKS),
    meta_description:
      'Membership connects your firm to advocacy, safety resources, events, and a network of industry peers.',
    published: true,
  }
}

export function defaultContactPageSeed() {
  return {
    slug: 'contact',
    title: 'Contact us',
    body_md: '',
    body_json: serializePageBlocks(DEFAULT_CONTACT_BLOCKS),
    meta_description: 'Reach the Las Vegas chapter by phone, email, or the form below.',
    published: true,
  }
}
