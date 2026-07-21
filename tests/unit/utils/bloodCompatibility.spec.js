import { describe, it, expect } from 'vitest'
import { canDonateTo, getCompatibleRecipientTypes, getCompatibleDonorTypes } from '@/utils/bloodCompatibility.js'

describe('bloodCompatibility.js', () => {
  describe('canDonateTo', () => {
    it('returns true for O- to all blood types', () => {
      const types = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
      types.forEach(recipient => {
        expect(canDonateTo('O-', recipient)).toBe(true)
      })
    })

    it('returns correct compatibility for other matches', () => {
      expect(canDonateTo('A+', 'AB+')).toBe(true)
      expect(canDonateTo('A+', 'O+')).toBe(false)
      expect(canDonateTo('AB+', 'AB+')).toBe(true)
      expect(canDonateTo('AB+', 'O-')).toBe(false)
    })

    it('handles Any blood type correctly', () => {
      expect(canDonateTo('Any', 'A+')).toBe(true)
      expect(canDonateTo('O+', 'Any')).toBe(true)
    })

    it('returns false for invalid or missing inputs', () => {
      expect(canDonateTo(null, 'O+')).toBe(false)
      expect(canDonateTo('O+', undefined)).toBe(false)
      expect(canDonateTo('XYZ', 'O+')).toBe(false)
    })
  })

  describe('getCompatibleRecipientTypes', () => {
    it('returns all recipient types for donor O-', () => {
      const recipients = getCompatibleRecipientTypes('O-')
      expect(recipients).toContain('O-')
      expect(recipients).toContain('AB+')
      expect(recipients.length).toBe(8)
    })

    it('returns only AB+ for AB+ donor', () => {
      expect(getCompatibleRecipientTypes('AB+')).toEqual(['AB+'])
    })

    it('returns empty array for invalid inputs', () => {
      expect(getCompatibleRecipientTypes('')).toEqual([])
      expect(getCompatibleRecipientTypes('XYZ')).toEqual([])
    })
  })

  describe('getCompatibleDonorTypes', () => {
    it('returns only O- for recipient O-', () => {
      expect(getCompatibleDonorTypes('O-')).toEqual(['O-'])
    })

    it('returns all types for recipient AB+', () => {
      const donors = getCompatibleDonorTypes('AB+')
      expect(donors.length).toBe(8)
    })

    it('returns empty array for invalid inputs', () => {
      expect(getCompatibleDonorTypes(null)).toEqual([])
    })
  })
})
