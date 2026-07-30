const CLARK_COUNTY_GEOCODER =
  'https://maps.clarkcountynv.gov/arcgis/rest/services/Locators/Clark_County_Composite/GeocodeServer/findAddressCandidates'

const MIN_GEOCODE_SCORE = 70

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
}

export async function geocodeClarkCountyAddress(address: string): Promise<GeocodeResult | null> {
  const trimmed = address.trim()
  if (!trimmed) return null

  const url = new URL(CLARK_COUNTY_GEOCODER)
  url.searchParams.set('SingleLine', trimmed)
  url.searchParams.set('f', 'json')
  url.searchParams.set('outSR', '4326')
  url.searchParams.set('maxLocations', '1')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) return null

  const data = (await response.json()) as GeocodeResponse
  const candidate = data.candidates?.[0]
  if (!candidate?.location || (candidate.score ?? 0) < MIN_GEOCODE_SCORE) return null

  return {
    lng: candidate.location.x,
    lat: candidate.location.y,
    formatted: candidate.address?.trim() || trimmed,
  }
}
