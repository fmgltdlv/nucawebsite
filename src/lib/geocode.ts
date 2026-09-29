const CLARK_COUNTY_GEOCODER =
  'https://maps.clarkcountynv.gov/arcgis/rest/services/Locators/Clark_County_Composite_All_Pro/GeocodeServer/findAddressCandidates'

const WORLD_GEOCODER =
  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'

const CENSUS_GEOCODER = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress'

/** Bias Esri World results to southern Nevada (WGS84 xmin,ymin,xmax,ymax). */
const CLARK_SEARCH_EXTENT = '-115.75,35.0,-113.5,37.5'

const MIN_GEOCODE_SCORE = 70
const DEFAULT_MAX_CANDIDATES = 1
const SUGGEST_MAX_CANDIDATES = 8

// Street-range matches are more reliable on this locator. Its point-address layer
// can score higher while landing on the wrong parcel.
const CLARK_CATEGORY_ORDER = ['Street Address', 'Point Address'] as const

type GeocodeAttributes = {
  StAddr?: string
  City?: string
  Region?: string
  Postal?: string
  LongLabel?: string
}

type GeocodeCandidate = {
  address?: string
  score?: number
  location?: { x: number; y: number }
  attributes?: GeocodeAttributes
}

type GeocodeResponse = {
  error?: { code?: number; message?: string }
  spatialReference?: { wkid?: number; latestWkid?: number }
  candidates?: GeocodeCandidate[]
}

type CensusMatch = {
  matchedAddress?: string
  coordinates?: { x?: number; y?: number }
}

type CensusResponse = {
  result?: { addressMatches?: CensusMatch[] }
}

export type GeocodeResult = {
  lat: number
  lng: number
  formatted: string
  score: number
}

function geocodeRequestHeaders(referer?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'NUCA-LV-Website/1.0 (event geocoding; +https://www.nucalasvegas.com)',
  }
  if (referer) headers.Referer = referer
  return headers
}

/** Clark County locator defaults to State Plane (WKID 3421) unless outSR=4326 is set. */
function isWgs84SpatialReference(sr?: GeocodeResponse['spatialReference']): boolean {
  const wkid = sr?.latestWkid ?? sr?.wkid
  return wkid === 4326 || wkid === 4269
}

/** Reject State Plane values mistaken for lat/lng (e.g. y ≈ 26_713_298). */
function isPlausibleClarkCountyLatLng(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  return lat >= 35 && lat <= 37.5 && lng >= -115.75 && lng <= -113.5
}

function isAcceptableCandidate(
  spatialReference: GeocodeResponse['spatialReference'],
  lat: number,
  lng: number,
): boolean {
  if (!isPlausibleClarkCountyLatLng(lat, lng)) return false
  if (isWgs84SpatialReference(spatialReference)) return true
  // Some responses omit spatialReference even when outSR=4326 was requested.
  return spatialReference == null
}

function formatClarkAddress(candidate: GeocodeCandidate, fallback: string): string {
  const attrs = candidate.attributes ?? {}
  const street = attrs.StAddr?.trim()
  const city = attrs.City?.trim()
  const region = attrs.Region?.trim()
  const postal = attrs.Postal?.trim()
  if (street) {
    const locality = [city, region].filter(Boolean).join(', ')
    const localityLine = [locality, postal].filter(Boolean).join(' ')
    return [street, localityLine].filter(Boolean).join(', ')
  }

  const label = (attrs.LongLabel || candidate.address || fallback).trim()
  return label.replace(/^\d{8,},\s*/, '')
}

function arcgisCandidatesToResults(
  data: GeocodeResponse,
  fallbackAddress: string,
  formatLabel: (candidate: GeocodeCandidate, fallback: string) => string,
  maxLocations: number,
): GeocodeResult[] {
  const results: GeocodeResult[] = []
  for (const candidate of data.candidates ?? []) {
    if (!candidate?.location || (candidate.score ?? 0) < MIN_GEOCODE_SCORE) continue
    const lat = candidate.location.y
    const lng = candidate.location.x
    if (!isAcceptableCandidate(data.spatialReference, lat, lng)) continue
    results.push({
      lng,
      lat,
      formatted: formatLabel(candidate, fallbackAddress),
      score: candidate.score ?? 0,
    })
    if (results.length >= maxLocations) break
  }
  return results
}

async function fetchClarkCategory(
  address: string,
  category: string,
  maxLocations: number,
): Promise<GeocodeResult[]> {
  const url = new URL(CLARK_COUNTY_GEOCODER)
  url.searchParams.set('SingleLine', address)
  url.searchParams.set('category', category)
  url.searchParams.set('f', 'json')
  url.searchParams.set('outSR', '4326')
  url.searchParams.set('maxLocations', String(maxLocations))
  url.searchParams.set('outFields', 'Addr_type,StAddr,City,Region,Postal,LongLabel')

  const response = await fetch(url.toString(), {
    headers: geocodeRequestHeaders('https://maps.clarkcountynv.gov/'),
  })
  if (!response.ok) return []

  const data = (await response.json()) as GeocodeResponse
  if (data.error) return []

  return arcgisCandidatesToResults(data, address, formatClarkAddress, maxLocations)
}

async function fetchClarkCountyCandidates(
  address: string,
  maxLocations: number,
): Promise<GeocodeResult[]> {
  const trimmed = address.trim()
  if (!trimmed) return []

  const results: GeocodeResult[] = []
  const seen = new Set<string>()

  for (const category of CLARK_CATEGORY_ORDER) {
    const batch = await fetchClarkCategory(trimmed, category, maxLocations)
    for (const item of batch) {
      const key = `${item.lat.toFixed(5)},${item.lng.toFixed(5)}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push(item)
      if (results.length >= maxLocations) return results
    }
    if (category === 'Street Address' && results.length > 0) return results
  }

  return results
}

async function fetchWorldCandidates(address: string, maxLocations: number): Promise<GeocodeResult[]> {
  const trimmed = address.trim()
  if (!trimmed) return []

  const url = new URL(WORLD_GEOCODER)
  url.searchParams.set('SingleLine', trimmed)
  url.searchParams.set('f', 'json')
  url.searchParams.set('outSR', '4326')
  url.searchParams.set('maxLocations', String(maxLocations))
  url.searchParams.set('countryCode', 'USA')
  url.searchParams.set('searchExtent', CLARK_SEARCH_EXTENT)

  const response = await fetch(url.toString(), {
    headers: geocodeRequestHeaders('https://www.nucalasvegas.com/'),
  })
  if (!response.ok) return []

  const data = (await response.json()) as GeocodeResponse
  if (data.error) return []

  return arcgisCandidatesToResults(data, trimmed, (_candidate, fallback) => {
    const label = (_candidate.address || fallback).trim()
    return label.replace(/^\d{8,},\s*/, '')
  }, maxLocations)
}

async function fetchCensusCandidates(address: string, maxLocations: number): Promise<GeocodeResult[]> {
  const trimmed = address.trim()
  if (!trimmed) return []

  const url = new URL(CENSUS_GEOCODER)
  url.searchParams.set('address', trimmed)
  url.searchParams.set('benchmark', 'Public_AR_Current')
  url.searchParams.set('format', 'json')

  const response = await fetch(url.toString(), {
    headers: geocodeRequestHeaders(),
  })
  if (!response.ok) return []

  const data = (await response.json()) as CensusResponse
  const results: GeocodeResult[] = []
  for (const match of data.result?.addressMatches ?? []) {
    const lat = match.coordinates?.y
    const lng = match.coordinates?.x
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (!isPlausibleClarkCountyLatLng(lat, lng)) continue
    results.push({
      lat,
      lng,
      formatted: match.matchedAddress?.trim() || trimmed,
      score: MIN_GEOCODE_SCORE,
    })
    if (results.length >= maxLocations) break
  }
  return results
}

async function fetchAddressCandidates(address: string, maxLocations: number): Promise<GeocodeResult[]> {
  const trimmed = address.trim()
  if (!trimmed) return []

  try {
    const clark = await fetchClarkCountyCandidates(trimmed, maxLocations)
    if (clark.length > 0) return clark
  } catch {
    // Clark County may block or fail from the Worker edge; fall back below.
  }

  try {
    const world = await fetchWorldCandidates(trimmed, maxLocations)
    if (world.length > 0) return world
  } catch {
    // Try Census next.
  }

  try {
    return await fetchCensusCandidates(trimmed, maxLocations)
  } catch {
    return []
  }
}

export async function geocodeClarkCountyAddressCandidates(
  address: string,
  maxLocations = SUGGEST_MAX_CANDIDATES,
): Promise<GeocodeResult[]> {
  return fetchAddressCandidates(address, maxLocations)
}

export async function geocodeClarkCountyAddress(address: string): Promise<GeocodeResult | null> {
  const candidates = await fetchAddressCandidates(address, DEFAULT_MAX_CANDIDATES)
  return candidates[0] ?? null
}
