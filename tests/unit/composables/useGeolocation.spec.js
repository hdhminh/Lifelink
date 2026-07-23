import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGeolocation } from '@/composables/useGeolocation.js'

describe('useGeolocation.js', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('initialises with default null/false state when not previously granted', () => {
    const { userLocation, locationGranted, locationError } = useGeolocation()
    expect(userLocation.value).toBeNull()
    expect(locationGranted.value).toBe(false)
    expect(locationError.value).toBeNull()
  })

  it('builds search query maps URL when user location is not available', () => {
    const { buildMapsUrl, userLocation } = useGeolocation()
    userLocation.value = null

    const url = buildMapsUrl('Cho Ray Hospital')
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Cho%20Ray%20Hospital')
  })

  it('builds direction maps URL when user location is known', () => {
    const { buildMapsUrl, userLocation } = useGeolocation()
    userLocation.value = { lat: 10.762622, lng: 106.660172 }

    const url = buildMapsUrl('Cho Ray Hospital')
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&origin=10.762622,106.660172&destination=Cho%20Ray%20Hospital')
  })

  it('handles successful location request', async () => {
    const mockCoords = { latitude: 10.77, longitude: 106.69 }
    const getCurrentPositionMock = vi.fn((success) =>
      success({ coords: mockCoords })
    )

    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: getCurrentPositionMock }
    })

    const { requestLocation, userLocation, locationGranted, locationError } = useGeolocation()
    const result = await requestLocation()

    expect(result).toEqual({ lat: 10.77, lng: 106.69 })
    expect(userLocation.value).toEqual({ lat: 10.77, lng: 106.69 })
    expect(locationGranted.value).toBe(true)
    expect(locationError.value).toBeNull()
    expect(localStorage.getItem('ll_geo_granted')).toBe('true')
  })

  it('handles location permission denial', async () => {
    const errorMock = { code: 1, PERMISSION_DENIED: 1 }
    const getCurrentPositionMock = vi.fn((_, failure) => failure(errorMock))

    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: getCurrentPositionMock }
    })

    const { requestLocation, locationGranted, locationError } = useGeolocation()

    await expect(requestLocation()).rejects.toEqual(errorMock)
    expect(locationGranted.value).toBe(false)
    expect(locationError.value).toBe('Location permission was denied.')
    expect(localStorage.getItem('ll_geo_granted')).toBe('false')
  })

  it('handles missing geolocation API support in browser', async () => {
    vi.stubGlobal('navigator', {})

    const { requestLocation, locationError } = useGeolocation()

    await expect(requestLocation()).rejects.toThrow('Geolocation is not supported by your browser.')
    expect(locationError.value).toBe('Geolocation is not supported by your browser.')
  })
})
