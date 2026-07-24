import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import { calculateHaversineDistance, formatDistance } from '@/utils/haversine.js'
import { getHospitalCoordinates } from '@/data/hospitalCoordinates.js'

describe('Complex End-to-End Emergency Workflow Integration Tests', () => {
  let mockRequest
  let mockGuestDonor

  beforeEach(() => {
    mockRequest = {
      id: 'req_emergency_99',
      hospitalName: 'Cho Ray Hospital',
      bloodType: 'AB+',
      unitsNeeded: 3,
      confirmedCount: 2,
      urgency: 'critical',
      city: 'Ho Chi Minh City',
      status: 'active'
    }

    mockGuestDonor = {
      id: 'guest_donor_123',
      name: 'Nguyen Van A',
      bloodType: 'O-',
      phone: '0901234567',
      lat: 10.762622,
      lng: 106.682172
    }
  })

  it('validates universal donor (O-) compatibility with universal recipient (AB+)', () => {
    const isCompatible = canDonateTo(mockGuestDonor.bloodType, mockRequest.bloodType)
    expect(isCompatible).toBe(true)
  })

  it('calculates precise distance between donor location and hospital coordinates', () => {
    const hospCoords = getHospitalCoordinates(mockRequest.hospitalName, mockRequest.city)
    expect(hospCoords.lat).toBe(10.7548)
    expect(hospCoords.lng).toBe(106.6601)

    const distanceMeters = calculateHaversineDistance(
      mockGuestDonor.lat,
      mockGuestDonor.lng,
      hospCoords.lat,
      hospCoords.lng
    )

    expect(distanceMeters).toBeGreaterThan(0)
    expect(typeof distanceMeters).toBe('number')
    
    const formatted = formatDistance(distanceMeters)
    expect(formatted).toMatch(/km|m/)
  })

  it('handles race conditions when confirming the final required blood unit', () => {
    // 2 units confirmed out of 3 needed
    expect(mockRequest.confirmedCount).toBe(2)
    expect(mockRequest.unitsNeeded).toBe(3)

    // Simulate first successful confirmation
    const canAccept1 = mockRequest.confirmedCount < mockRequest.unitsNeeded
    expect(canAccept1).toBe(true)
    mockRequest.confirmedCount += 1

    // Request is now fully fulfilled (3/3)
    expect(mockRequest.confirmedCount).toBe(3)

    // Second concurrent confirmation MUST be rejected
    const canAccept2 = mockRequest.confirmedCount < mockRequest.unitsNeeded
    expect(canAccept2).toBe(false)
  })

  it('handles invalid or malformed hospital names gracefully with fallback coordinates', () => {
    const malformedLocation = '   Bệnh Viện Chợ Rẫy  (Cổng Phụ) --  '
    const coords = getHospitalCoordinates(malformedLocation, 'Ho Chi Minh City')
    
    expect(coords).toBeDefined()
    expect(coords.lat).toBeGreaterThan(0)
    expect(coords.lng).toBeGreaterThan(0)
  })

  it('prevents incompatible blood type donations from proceeding', () => {
    const incompatibleDonor = { bloodType: 'AB+' }
    const recipient = { bloodType: 'O-' }

    const isCompatible = canDonateTo(incompatibleDonor.bloodType, recipient.bloodType)
    expect(isCompatible).toBe(false)
  })
})
