import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/firebase.js', () => ({ db: {} }))

const mockRunTransaction = vi.fn()
const mockGetDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, path, id) => ({ path: `${path}/${id}`, id })),
  getDoc: (...args) => mockGetDoc(...args),
  runTransaction: (...args) => mockRunTransaction(...args),
  serverTimestamp: () => 'MOCK_TIMESTAMP'
}))

vi.mock('@/utils/bloodCompatibility.js', () => ({
  canDonateTo: vi.fn((donor, recipient) => {
    if (donor === 'O-' || donor === recipient || recipient === 'Any') return true
    if (donor === 'O+' && recipient.includes('+')) return true
    return false
  })
}))

describe('useConfirmDonation.js (Full Unit Test Suite)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-23T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 2.1 hasConfirmed()
  describe('hasConfirmed()', () => {
    it('returns true when deterministic confirmation document exists', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => true })
      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { hasConfirmed } = useConfirmDonation()

      const result = await hasConfirmed('req1', 'donor1')
      expect(result).toBe(true)
    })

    it('returns false when confirmation document does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })
      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { hasConfirmed } = useConfirmDonation()

      const result = await hasConfirmed('req1', 'donor1')
      expect(result).toBe(false)
    })
  })

  // 2.2 Donor Confirmation - Happy Path
  describe('confirmAvailability() - Happy Path', () => {
    it('creates confirmation with deterministic ID and increments confirmedCount', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') {
            return Promise.resolve({
              exists: () => true,
              data: () => ({ bloodType: 'O+', confirmedCount: 2, unitsNeeded: 5, hospitalName: 'Cho Ray' })
            })
          }
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }

      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, success, loading } = useConfirmDonation()

      const confId = await confirmAvailability('req1', {
        donorId: 'donor1',
        donorName: 'John Doe',
        donorPhone: '0901234567',
        bloodType: 'O+'
      })

      expect(confId).toBe('req1_donor1')
      expect(success.value).toBe(true)
      expect(loading.value).toBe(false)
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          requestId: 'req1',
          donorId: 'donor1',
          donorName: 'John Doe',
          donorPhone: '0901234567',
          bloodType: 'O+',
          status: 'confirmed'
        })
      )
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          confirmedCount: 3,
          lastConfirmedBy: 'donor1'
        })
      )
    })
  })

  // 2.3 Donor Confirmation - Rejections & Cooldown
  describe('confirmAvailability() - Rejections & Cooldown', () => {
    it('rejects confirmation when request no longer exists', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, error } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })).rejects.toThrow('This request no longer exists.')
      expect(error.value).toBe('This request no longer exists.')
      expect(mockTransaction.set).not.toHaveBeenCalled()
    })

    it('rejects donor inside 56-day cooldown period', async () => {
      // 30 days ago
      const recentDonation = new Date('2026-06-23T00:00:00Z')

      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+' }) })
          if (ref.id === 'donor1') return Promise.resolve({ exists: () => true, data: () => ({ lastDonationDate: recentDonation }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, error } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })).rejects.toThrow('Eligibility cooldown active.')
      expect(error.value).toContain('Eligibility cooldown active')
    })
  })

  // 2.4 Guest Confirmation
  describe('confirmGuestAvailability()', () => {
    it('creates guest confirmation and increments count', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') {
            return Promise.resolve({
              exists: () => true,
              data: () => ({ bloodType: 'Any', confirmedCount: 0, unitsNeeded: 2 })
            })
          }
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability, success } = useConfirmDonation()

      const confId = await confirmGuestAvailability('req1', {
        guestSessionId: 'guest_123',
        guestName: 'Guest User',
        guestPhone: '0987654321',
        bloodType: 'B+'
      })

      expect(confId).toBe('req1_guest_123')
      expect(success.value).toBe(true)
      expect(mockTransaction.set).toHaveBeenCalled()
    })
  })

  // 2.5 Cancel Confirmation
  describe('cancelConfirmation()', () => {
    it('decrements confirmedCount and deletes confirmation doc', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'conf1') return Promise.resolve({ exists: () => true, data: () => ({ status: 'confirmed' }) })
          return Promise.resolve({ exists: () => true, data: () => ({ confirmedCount: 2 }) })
        }),
        update: vi.fn(),
        delete: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { cancelConfirmation, success } = useConfirmDonation()

      await cancelConfirmation('conf1', 'req1')

      expect(success.value).toBe(true)
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ confirmedCount: 1 })
      )
      expect(mockTransaction.delete).toHaveBeenCalled()
    })
  })

  // 2.6 Status Transitions
  describe('updateConfirmationStatus()', () => {
    it('does not change arrivedCount when transitioning arrived to arrived', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'conf1') return Promise.resolve({ exists: () => true, data: () => ({ status: 'arrived', requestId: 'req1' }) })
          return Promise.resolve({ exists: () => true, data: () => ({ arrivedCount: 2 }) })
        }),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { updateConfirmationStatus } = useConfirmDonation()

      await updateConfirmationStatus('conf1', 'arrived')

      expect(mockTransaction.update).not.toHaveBeenCalled()
    })

    it('rejects unsupported status string', async () => {
      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { updateConfirmationStatus, error } = useConfirmDonation()

      await expect(updateConfirmationStatus('conf1', 'invalid_status')).rejects.toThrow('Invalid confirmation status.')
      expect(error.value).toBe('Invalid confirmation status.')
    })
  })
})
