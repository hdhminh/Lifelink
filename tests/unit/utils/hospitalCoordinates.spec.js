import { describe, it, expect } from 'vitest'
import { getHospitalCoordinates, HOSPITAL_DATABASE, EVENT_VENUES_DATABASE } from '@/data/hospitalCoordinates.js'

describe('hospitalCoordinates.js Unit Tests', () => {
  it('exports valid HOSPITAL_DATABASE array with lat and lng for all entries', () => {
    expect(Array.isArray(HOSPITAL_DATABASE)).toBe(true)
    expect(HOSPITAL_DATABASE.length).toBeGreaterThan(10)
    HOSPITAL_DATABASE.forEach(item => {
      expect(item.name).toBeDefined()
      expect(typeof item.lat).toBe('number')
      expect(typeof item.lng).toBe('number')
      expect(item.lat).toBeGreaterThan(0)
      expect(item.lng).toBeGreaterThan(0)
    })
  })

  it('exports valid EVENT_VENUES_DATABASE array with lat and lng for all entries', () => {
    expect(Array.isArray(EVENT_VENUES_DATABASE)).toBe(true)
    expect(EVENT_VENUES_DATABASE.length).toBeGreaterThan(5)
    EVENT_VENUES_DATABASE.forEach(item => {
      expect(item.name).toBeDefined()
      expect(typeof item.lat).toBe('number')
      expect(typeof item.lng).toBe('number')
    })
  })

  it('returns exact coordinates for known hospital names', () => {
    const choRay = getHospitalCoordinates('Cho Ray Hospital')
    expect(choRay.lat).toBe(10.7548)
    expect(choRay.lng).toBe(106.6601)

    const bachMai = getHospitalCoordinates('Bach Mai Hospital')
    expect(bachMai.lat).toBe(21.0000)
    expect(bachMai.lng).toBe(105.8426)
  })

  it('returns exact coordinates for event venues', () => {
    const youthCenter = getHospitalCoordinates('Youth Cultural Center HCMC')
    expect(youthCenter.lat).toBe(10.7828)
    expect(youthCenter.lng).toBe(106.6983)
  })

  it('returns city fallback coordinates for unknown hospitals in known cities', () => {
    const langSonFallback = getHospitalCoordinates('Unknown Clinic', 'Lang Son')
    expect(langSonFallback.lat).toBe(21.8528)
    expect(langSonFallback.lng).toBe(106.7618)

    const daNangFallback = getHospitalCoordinates('Unknown Clinic', 'Da Nang')
    expect(daNangFallback.lat).toBe(16.0716)
    expect(daNangFallback.lng).toBe(108.2200)
  })

  it('falls back to Cho Ray Hospital coordinates when hospital name and city are unknown', () => {
    const fallback = getHospitalCoordinates('Random Nowhere Place', 'Unknown City')
    expect(fallback.lat).toBe(10.7548)
    expect(fallback.lng).toBe(106.6601)
  })
})
