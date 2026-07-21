import { describe, it, expect } from 'vitest'
import { useEligibility } from '@/composables/useEligibility.js'

describe('useEligibility.js', () => {
  const { isEligible, nextEligibleDate, daysUntilEligible } = useEligibility()

  it('returns eligible if no last donation date is provided', () => {
    expect(isEligible(null)).toBe(true)
    expect(isEligible(undefined)).toBe(true)
    expect(nextEligibleDate(null)).toBeNull()
    expect(daysUntilEligible(null)).toBe(0)
  })

  it('returns eligible if last donation was more than 56 days ago', () => {
    const pastDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
    expect(isEligible(pastDate)).toBe(true)
    expect(daysUntilEligible(pastDate)).toBe(0)
  })

  it('returns not eligible if last donation was less than 56 days ago', () => {
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    expect(isEligible(recentDate)).toBe(false)
    expect(daysUntilEligible(recentDate)).toBe(26)
  })

  it('calculates the next eligible date correctly', () => {
    const fixedDate = new Date('2026-01-01T00:00:00Z')
    const expectedDate = new Date(fixedDate.getTime() + 56 * 24 * 60 * 60 * 1000)
    expect(nextEligibleDate(fixedDate)).toEqual(expectedDate)
  })

  it('handles Firestore timestamp mock objects', () => {
    const mockTimestamp = {
      toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    }
    expect(isEligible(mockTimestamp)).toBe(false)
    expect(daysUntilEligible(mockTimestamp)).toBe(46)
  })
})
