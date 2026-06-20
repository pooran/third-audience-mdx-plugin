let geoip: typeof import('geoip-lite') | null = null

function loadGeoip() {
  if (geoip) return geoip
  try {
    geoip = require('geoip-lite') as typeof import('geoip-lite')
  } catch {
    geoip = null
  }
  return geoip
}

/** Returns ISO 3166-1 alpha-2 country code, or null if lookup fails. */
export function getCountry(ip: string): string | null {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('::')) return null
  const geo = loadGeoip()
  if (!geo) return null
  try {
    const result = geo.lookup(ip)
    return result?.country ?? null
  } catch {
    return null
  }
}
