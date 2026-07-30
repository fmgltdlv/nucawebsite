export type MemberType = 'contractor' | 'associate' | 'institutional'

export const MEMBER_TYPES: MemberType[] = ['contractor', 'associate', 'institutional']

export interface Member {
  id: string
  company: string
  type: MemberType
  website?: string
  phone?: string
  email?: string
  logoUrl?: string
}

export interface Event {
  id: string
  title: string
  date: string
  location: string
  description: string
  registrationUrl?: string
}

export interface Leader {
  name: string
  role: string
}

export const site = {
  name: 'NUCA of Las Vegas',
  phone: '702-577-8556',
  email: 'info@nucalasvegas.com',
  address: 'PO Box 96681, Las Vegas, NV 89193',
}

export const joinBenefits = [
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
]

export const memberTypes = [
  {
    id: 'associate',
    name: 'Associate Member',
    description:
      'Suppliers of equipment, materials, or services to contractors in the excavation and utility construction industry.',
  },
  {
    id: 'contractor',
    name: 'Contractor Member',
    description:
      'Firms engaged in excavation, site work, and construction or rehabilitation of utility systems—including water, sewer, gas, electric, and communications infrastructure.',
  },
  {
    id: 'institutional',
    name: 'Institutional Member',
    description:
      'Schools and governmental entities involved in utility construction and excavation.',
  },
]

export const demoMembers: Member[] = [
  {
    id: '1',
    company: 'Desert Pipeline Contractors',
    type: 'contractor',
    website: 'https://example.com',
    phone: '702-555-0101',
  },
  {
    id: '2',
    company: 'Silver State Utilities LLC',
    type: 'contractor',
    website: 'https://example.com',
    phone: '702-555-0102',
  },
  {
    id: '3',
    company: 'Rocky Mountain Equipment',
    type: 'associate',
    website: 'https://example.com',
    phone: '702-555-0103',
  },
  {
    id: '4',
    company: 'Las Vegas Trenchless Group',
    type: 'contractor',
    website: 'https://example.com',
  },
  {
    id: '5',
    company: 'Clark County Public Works',
    type: 'institutional',
    phone: '702-555-0105',
  },
  {
    id: '6',
    company: 'Southwest Safety Training',
    type: 'associate',
    website: 'https://example.com',
    phone: '702-555-0106',
  },
]

export const demoEvents: Event[] = [
  {
    id: '1',
    title: 'Monthly Membership Meeting',
    date: '2026-04-15T17:30:00',
    location: 'Las Vegas, NV',
    description: 'Networking, chapter updates, and a safety spotlight from a member company.',
    registrationUrl: '#',
  },
  {
    id: '2',
    title: 'Utility Construction Safety Workshop',
    date: '2026-05-08T08:00:00',
    location: 'Las Vegas, NV',
    description: 'Hands-on topics for field leaders: trench safety, traffic control, and new OSHA guidance.',
    registrationUrl: '#',
  },
  {
    id: '3',
    title: 'Annual NUCA Golf Classic',
    date: '2026-09-20T09:00:00',
    location: 'Las Vegas, NV',
    description: 'Chapter fundraiser and member appreciation event. Sponsorships available.',
    registrationUrl: '#',
  },
]

export const demoLeadership: Leader[] = [
  { name: 'Jennifer Bott', role: 'Executive Director' },
  { name: 'Member Representative', role: 'Chapter President' },
  { name: 'Member Representative', role: 'Vice President' },
  { name: 'Member Representative', role: 'Secretary / Treasurer' },
]

export const memberTypeLabel: Record<MemberType, string> = {
  contractor: 'Contractor',
  associate: 'Associate',
  institutional: 'Institutional',
}
