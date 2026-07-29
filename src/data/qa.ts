export interface QaItem {
  id: string
  question: string
  answer: string
}

/** Demo Q&A — production will load from D1; secretary edits in admin. */
export const demoQaItems: QaItem[] = [
  {
    id: 'what-is-nuca',
    question: 'What is NUCA?',
    answer:
      'NUCA is the National Utility Contractors Association — the leading trade association working solely for the utility construction and excavation industry in the United States. NUCA’s nationwide network of state/regional Chapters and member companies represent utility contractors, excavators, suppliers, manufacturers, and other providers in the water, sewer, gas, electric, telecommunications, treatment plant, and excavation industries.',
  },
  {
    id: 'local-chapter',
    question: 'What does NUCA of Las Vegas do locally?',
    answer:
      'The Las Vegas chapter hosts meetings and training, connects members with peers and vendors, supports scholarships, shares industry updates, and participates in advocacy through NUCA’s national network.',
  },
  {
    id: 'who-can-join',
    question: 'Who can become a member?',
    answer:
      'Contractor members perform utility and excavation work. Associate members supply equipment, materials, or services to the industry. Institutional members include schools and government entities involved in utility construction.',
  },
]
