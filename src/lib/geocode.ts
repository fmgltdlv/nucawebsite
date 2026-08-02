const CLARK_COUNTY_GEOCODER =
  'https://maps.clarkcountynv.gov/arcgis/rest/services/Locators/Clark_County_Composite/GeocodeServer/findAddressCandidates'

const MIN_GEOCODE_SCORE = 70
const DEFAULT_MAX_CANDIDATES = 1
const SUGGEST_MAX_CANDIDATES = 8

type GeocodeCandidate = {
  address?: string
  score?: number
  location?: { x: number; y: number }
}

type GeocodeResponse = {
  candidates?: GeocodeCandidate[]
}

export type GeocodeResult = {
  lat: number
  lng: number
  formatted: string
  score: number
}

async function fetchClarkCountyCandidates(
  address: string,
  maxLocations: number,
): Promise<GeocodeResult[]> {
  const trimmed = address.trim()
  if (!trimmed) return []

  const url = new URL(CLARK_COUNTY_GEOCODER)
  url.searchParams.set('SingleLine', trimmed)
  url.searchParams.set('f', 'json')
  url.searchParams.set('outSR', '4326')
  url.searchParams.set('maxLocations', String(maxLocations))

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return []

  const data = (await response.json()) as GeocodeResponse
  const results: GeocodeResult[] = []
  for (const candidate of data.candidates ?? []) {
    if (!candidate?.location || (candidate.score ?? 0) < MIN_GEOCODE_SCORE) continue
    results.push({
      lng: candidate.location.x,
      lat: candidate.location.y,
      formatted: candidate.address?.trim() || trimmed,
      score: candidate.score ?? 0,
    })
  }
  return results
}

export async function geocodeClarkCountyAddressCandidates(
  address: string,
  maxLocations = SUGGEST_MAX_CANDIDATES,
): Promise<GeocodeResult[]> {
  return fetchClarkCountyCandidates(address, maxLocations)
}

export async function geocodeClarkCountyAddress(address: string): Promise<GeocodeResult | null> {
  const candidates = await fetchClarkCountyCandidates(address, DEFAULT_MAX_CANDIDATES)
  return candidates[0] ?? null
}
