export interface DemoResourceItem {
  category: string
  label: string
  url: string
}

/** Resource links from nucalasvegas.com/resources/ — secretary edits in admin. */
export const demoResourceItems: DemoResourceItem[] = [
  // Local Utilities
  { category: 'Local Utilities', label: 'Century Link', url: 'https://www.centurylinkquote.com/nevada/las-vegas' },
  { category: 'Local Utilities', label: 'Cox Communications', url: 'https://www.cox.com/' },
  { category: 'Local Utilities', label: 'Las Vegas Valley Water District', url: 'https://www.lvvwd.com/' },
  { category: 'Local Utilities', label: 'NV Energy', url: 'https://www.nvenergy.com/' },
  { category: 'Local Utilities', label: 'Southwest Gas Corporation', url: 'https://www.swgas.com/' },
  { category: 'Local Utilities', label: 'Kern River Gas Transmission', url: 'https://www.kernrivergas.com/' },
  { category: 'Local Utilities', label: 'Southern Nevada Water Authority', url: 'https://www.snwa.com/' },
  { category: 'Local Utilities', label: 'Kinder Morgan (CalNev, LLC)', url: 'https://www.kindermorgan.com/' },
  { category: 'Local Utilities', label: 'Regional Transportation Commission', url: 'https://www.rtcnv.com/' },
  // National Links
  {
    category: 'National Links',
    label: 'National Utility Contractors Association (NUCA National)',
    url: 'https://www.nuca.com/',
  },
  { category: 'National Links', label: 'Common Ground Alliance', url: 'https://www.commongroundalliance.com/' },
  { category: 'National Links', label: 'OSHA (Federal)', url: 'https://www.osha.gov/' },
  // State Organizations
  {
    category: 'State Organizations',
    label: 'Nevada Regional Common Ground Alliance',
    url: 'https://www.nevada811.org/',
  },
  { category: 'State Organizations', label: 'Nevada OSHA', url: 'https://dir.nv.gov/' },
  {
    category: 'State Organizations',
    label: 'OSHA Safety Training and Consultation',
    url: 'https://www.4safenv.state.nv.us/',
  },
  {
    category: 'State Organizations',
    label: 'Nevada Public Utilities Commission',
    url: 'https://puc.nv.gov/',
  },
  {
    category: 'State Organizations',
    label: 'Underground Service Alert North (811)',
    url: 'https://www.usanorth.org/',
  },
  // Southern Nevada Municipalities
  {
    category: 'Southern Nevada Municipalities',
    label: 'Bureau of Land Management',
    url: 'https://www.blm.gov/nevada',
  },
  { category: 'Southern Nevada Municipalities', label: 'City of Boulder City', url: 'https://www.bcnv.org/' },
  { category: 'Southern Nevada Municipalities', label: 'Clark County', url: 'https://www.clarkcountynv.gov/' },
  { category: 'Southern Nevada Municipalities', label: 'City of Henderson', url: 'https://www.cityofhenderson.com/' },
  { category: 'Southern Nevada Municipalities', label: 'City of Las Vegas', url: 'https://www.lasvegasnevada.gov/' },
  {
    category: 'Southern Nevada Municipalities',
    label: 'City of North Las Vegas',
    url: 'https://www.cityofnorthlasvegas.com/',
  },
  {
    category: 'Southern Nevada Municipalities',
    label: 'Nevada Department of Transportation',
    url: 'https://www.dot.nv.gov/',
  },
]
