import { describe, it, expect } from 'vitest'
import { getHospitalCoordinates, HOSPITAL_DATABASE, EVENT_VENUES_DATABASE } from '@/data/hospitalCoordinates.js'

describe('hospitalCoordinates.js Advanced Edge Cases & Boundary Conditions', () => {
  it('handles case-insensitive and whitespace-padded hospital names', () => {
    const coords1 = getHospitalCoordinates('  cho ray hospital  ')
    expect(coords1.lat).toBe(10.7548)
    expect(coords1.lng).toBe(106.6601)

    const coords2 = getHospitalCoordinates('BACH MAI HOSPITAL')
    expect(coords2.lat).toBe(21.0000)
    expect(coords2.lng).toBe(105.8426)
  })

  it('matches partial venue strings correctly against EVENT_VENUES_DATABASE', () => {
    const coords = getHospitalCoordinates('Festival at Youth Cultural Center HCMC Area')
    expect(coords.lat).toBe(10.7828)
    expect(coords.lng).toBe(106.6983)
  })

  it('handles vietnamese city names with accents and varying casing', () => {
    const coordsHanoi = getHospitalCoordinates('Unknown Clinic Name', 'Hà Nội')
    expect(coordsHanoi.lat).toBe(21.0285)
    expect(coordsHanoi.lng).toBe(105.8542)

    const coordsCanTho = getHospitalCoordinates('Unknown Clinic Name', 'Can Tho')
    expect(coordsCanTho.lat).toBe(10.0341)
    expect(coordsCanTho.lng).toBe(105.7557)
  })

  it('returns valid numbers for all city fallback coordinates', () => {
    const cities = ['lang son', 'binh duong', 'da nang', 'hue', 'can tho', 'hai phong', 'nha trang', 'phu tho', 'hoa binh', 'dak lak', 'dong nai']
    cities.forEach(city => {
      const res = getHospitalCoordinates('Random Clinic', city)
      expect(typeof res.lat).toBe('number')
      expect(typeof res.lng).toBe('number')
      expect(isNaN(res.lat)).toBe(false)
      expect(isNaN(res.lng)).toBe(false)
    })
  })

  it('ensures no duplicate hospital names exist in HOSPITAL_DATABASE except intended aliases', () => {
    const names = HOSPITAL_DATABASE.map(h => h.name.toLowerCase())
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBeGreaterThanOrEqual(names.length - 2)
  })
})
