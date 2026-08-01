export type MemberType = string

/** Fallback keys when membership_types table is empty. */
export const MEMBER_TYPES = ['contractor', 'associate', 'institutional'] as const

export interface Member {
  id: string
  company: string
  type: MemberType
  description?: string
  website?: string
  phone?: string
  email?: string
  logoUrl?: string
  contacts?: MemberContact[]
}

export type MemberSummary = Pick<Member, 'id' | 'company' | 'type' | 'logoUrl'>

export interface MemberContact {
  name: string
  email: string
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

export const memberTypeLabel: Record<string, string> = {
  contractor: 'Contractor',
  associate: 'Associate',
  institutional: 'Institutional',
}

export function resolveMemberTypeLabel(
  key: string,
  labels?: Record<string, string>,
): string {
  return labels?.[key] ?? memberTypeLabel[key] ?? key
}
