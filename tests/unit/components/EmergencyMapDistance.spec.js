import { describe, it, expect } from 'vitest'
import {
  calculateHaversineDistance,
  calculateRoadDistance,
  formatDistance
} from '@/utils/haversine.js'

describe('EmergencyMap Live Distance Measurement Integration', () => {
  it('calculates exact Haversine distance between user location and hospital marker', () => {
    const userLat = 10.8012
    const userLng = 106.6983

    const destLat = 10.7578
    const destLng = 106.6596

    const meters = calculateHaversineDistance(userLat, userLng, destLat, destLng)
    expect(meters).toBeGreaterThan(5000)
    expect(meters).toBeLessThan(7500)

    const formatted = formatDistance(meters)
    expect(formatted).toMatch(/km$/)
  })

  it('calculates realistic urban road distance accounting for road network factor', () => {
    const userLat = 10.8012
    const userLng = 106.6983

    const destLat = 10.7578
    const destLng = 106.6596

    const straightMeters = calculateHaversineDistance(userLat, userLng, destLat, destLng)
    const roadMeters = calculateRoadDistance(userLat, userLng, destLat, destLng)

    expect(roadMeters).toBeGreaterThan(straightMeters)
    expect(roadMeters).toBeCloseTo(straightMeters * 1.32, -1)
  })

  it('formats short distance under 1000m into meters unit', () => {
    const userLat = 10.8012
    const userLng = 106.6983

    const destLat = 10.803
    const destLng = 106.699

    const meters = calculateHaversineDistance(userLat, userLng, destLat, destLng)
    expect(meters).toBeLessThan(1000)

    const formatted = formatDistance(meters)
    expect(formatted).toMatch(/m$/)
  })
})
