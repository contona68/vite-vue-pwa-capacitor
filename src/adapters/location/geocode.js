/**
 * Reverse geocode — نام محل از مختصات (Nominatim / OSM)
 */

/**
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ placeName: string, address: string|null }>}
 */
export async function reverseGeocode(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { placeName: '', address: null }
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('accept-language', 'fa')
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('دریافت نام محل ناموفق بود.')
  }

  const data = await response.json()
  const placeName = buildPlaceName(data)
  const address = typeof data?.display_name === 'string' ? data.display_name : null

  return {
    placeName: placeName || address || 'محل نامشخص',
    address,
  }
}

function buildPlaceName(data) {
  const address = data?.address || {}
  const parts = [
    address.neighbourhood,
    address.suburb,
    address.quarter,
    address.village,
    address.town,
    address.city_district,
    address.city,
    address.county,
    address.state,
    address.country,
  ].filter((part) => typeof part === 'string' && part.trim())

  const unique = [...new Set(parts)]
  if (unique.length) {
    return unique.slice(0, 4).join('، ')
  }

  if (typeof data?.name === 'string' && data.name.trim()) {
    return data.name.trim()
  }

  return ''
}
