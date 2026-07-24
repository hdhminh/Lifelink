/**
 * haversine.js
 *
 * Calculates the great-circle distance between two geographic points (lat/lng)
 * using the Haversine formula. Used for location throttling, radar proximity,
 * and estimated arrival time computation.
 */

/**
 * Calculates distance between two coordinates in meters.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0

  const R = 6371000 // Earth radius in meters
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Formats distance into human-readable text (meters or kilometers).
 * @param {number} meters 
 * @returns {string} E.g., "450 m" or "4.2 km"
 */
export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return 'Unknown'
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Estimates Travel Time (ETA) in minutes based on distance in meters.
 * Assumes average urban emergency transit speed of 25 km/h (including traffic/signals).
 * @param {number} meters 
 * @param {number} [speedKmH=25] Average speed in km/h 
 * @returns {number} Estimated minutes (minimum 1 min if distance > 0)
 */
export function calculateEtaMinutes(meters, speedKmH = 25) {
  if (!meters || meters <= 0) return 0
  const speedMetersPerMin = (speedKmH * 1000) / 60
  const mins = Math.ceil(meters / speedMetersPerMin)
  return Math.max(1, mins)
}
