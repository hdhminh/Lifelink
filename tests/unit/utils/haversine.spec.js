import { describe, it, expect } from 'vitest'
import { calculateHaversineDistance, formatDistance, calculateEtaMinutes } from '@/utils/haversine.js'

describe('haversine.js', () => {
  it('returns 0 for identical coordinates', () => {
    const dist = calculateHaversineDistance(10.7548, 106.6601, 10.7548, 106.6601)
    expect(dist).toBe(0)
  })

  it('calculates realistic distance between Cho Ray Hospital and FV Hospital in HCMC', () => {
    // Cho Ray: 10.7548, 106.6601
    // FV Hospital: 10.7296, 106.7222
    const dist = calculateHaversineDistance(10.7548, 106.6601, 10.7296, 106.7222)
    expect(dist).toBeGreaterThan(6500) // ~7km
    expect(dist).toBeLessThan(7500)
  })

  it('formats distance under 1000m as meters', () => {
    expect(formatDistance(450)).toBe('450 m')
    expect(formatDistance(0)).toBe('0 m')
  })

  it('formats distance >= 1000m as kilometers', () => {
    expect(formatDistance(4200)).toBe('4.2 km')
    expect(formatDistance(10500)).toBe('10.5 km')
  })

  it('calculates ETA minutes assuming 25 km/h urban speed', () => {
    // 4.2 km (4200 m) at 25 km/h (416.6 m/min) -> ~11 mins
    const eta = calculateEtaMinutes(4200, 25)
    expect(eta).toBe(11)
  })

  it('returns minimum 1 minute for small non-zero distances', () => {
    const eta = calculateEtaMinutes(50, 25)
    expect(eta).toBe(1)
  })
})
