export interface DirtRelease {
  id: string
  title: string
  publishedAt: string
  summary?: string
  /** Demo uses a public sample PDF; production = R2 URL or `/api/files/...` */
  pdfUrl: string
}

/** Public sample PDF for in-browser preview in demo */
const samplePdf =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

export const demoDirtReleases: DirtRelease[] = [
  {
    id: '2026-03-15',
    title: 'THE DIRT — March 15, 2026',
    publishedAt: '2026-03-15',
    summary: 'Chapter meeting recap, upcoming training dates, and member spotlight.',
    pdfUrl: samplePdf,
  },
  {
    id: '2026-03-08',
    title: 'THE DIRT — March 8, 2026',
    publishedAt: '2026-03-08',
    summary: 'Legislative affairs update and Hard Hat Happy Hour reminder.',
    pdfUrl: samplePdf,
  },
  {
    id: '2026-02-28',
    title: 'THE DIRT — February 28, 2026',
    publishedAt: '2026-02-28',
    summary: 'Safety resources and scholarship committee news.',
    pdfUrl: samplePdf,
  },
]

export function getDirtRelease(id: string): DirtRelease | undefined {
  return demoDirtReleases.find((r) => r.id === id)
}
