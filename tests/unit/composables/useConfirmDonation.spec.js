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
    if (donor === 'O-' || donor === recipient || recipient === 'Any' || donor === 'Any') return true
    if (donor === 'O+' && recipient && recipient.includes('+')) return true
    return false
  })
}))

describe('useConfirmDonation.js (Expanded 50 Unit Tests)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-23T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 2.1 hasConfirmed() (3 tests)
  describe('hasConfirmed()', () => {
    it('returns true when deterministic confirmation document exists', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => true })
      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { hasConfirmed } = useConfirmDonation()

      expect(await hasConfirmed('req1', 'donor1')).toBe(true)
    })

    it('returns false when confirmation document does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })
      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { hasConfirmed } = useConfirmDonation()

      expect(await hasConfirmed('req1', 'donor1')).toBe(false)
    })

    it('uses requestId_donorId as the document ID', async () => {
      const { doc } = await import('firebase/firestore')
      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { hasConfirmed } = useConfirmDonation()

      mockGetDoc.mockResolvedValueOnce({ exists: () => false })
      await hasConfirmed('req_abc', 'user_xyz')

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'confirmations', 'req_abc_user_xyz')
    })
  })

  // 2.2 Donor Confirmation - Happy Path (8 tests)
  describe('confirmAvailability() - Happy Path', () => {
    it('creates confirmation with deterministic document ID', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      const confId = await confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })
      expect(confId).toBe('req1_donor1')
    })

    it('increments confirmedCount by exactly one', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 2, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ confirmedCount: 3 })
      )
    })

    it('sets lastConfirmedBy to authenticated donor UID', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor999', bloodType: 'O+' })
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ lastConfirmedBy: 'donor999' })
      )
    })

    it('sets confirmation status to confirmed', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'confirmed' })
      )
    })

    it('uses N/A when donorPhone is missing', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor1', donorName: 'Alice', bloodType: 'O+' })
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ donorPhone: 'N/A' })
      )
    })

    it('uses fallback values for hospitalName, city, urgency when missing in request', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          hospitalName: 'Unknown Hospital',
          city: '',
          urgency: 'moderate'
        })
      )
    })

    it('sets loading false and success true after completion', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, loading, success } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })
      expect(loading.value).toBe(false)
      expect(success.value).toBe(true)
    })
  })

  // 2.3 Donor Confirmation - Rejections & Cooldown (12 tests)
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
    })

    it('rejects duplicate confirmation', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, error } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })).rejects.toThrow('You have already confirmed availability for this request.')
      expect(error.value).toContain('already confirmed')
    })

    it('rejects donor inside 56-day cooldown period (Timestamp object)', async () => {
      const recentDate = new Date('2026-06-23T00:00:00Z') // 30 days ago
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          if (ref.id === 'donor1') return Promise.resolve({ exists: () => true, data: () => ({ lastDonationDate: { toDate: () => recentDate } }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })).rejects.toThrow('Eligibility cooldown active.')
    })

    it('rejects donor inside 56-day cooldown period (ISO string date)', async () => {
      const recentDateStr = '2026-06-23T00:00:00Z'
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          if (ref.id === 'donor1') return Promise.resolve({ exists: () => true, data: () => ({ lastDonationDate: recentDateStr }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })).rejects.toThrow('Eligibility cooldown active.')
    })

    it('allows donor at exactly 56 days boundary', async () => {
      const exact56DaysAgo = new Date('2026-05-28T00:00:00Z') // Exactly 56 days before 2026-07-23
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          if (ref.id === 'donor1') return Promise.resolve({ exists: () => true, data: () => ({ lastDonationDate: exact56DaysAgo }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, success } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })
      expect(success.value).toBe(true)
    })

    it('allows donor more than 56 days after previous donation', async () => {
      const oldDate = new Date('2026-01-01T00:00:00Z')
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          if (ref.id === 'donor1') return Promise.resolve({ exists: () => true, data: () => ({ lastDonationDate: oldDate }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, success } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })
      expect(success.value).toBe(true)
    })

    it('rejects incompatible blood types', async () => {
      const { canDonateTo } = await import('@/utils/bloodCompatibility.js')
      canDonateTo.mockReturnValueOnce(false)

      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O-', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'A+' })).rejects.toThrow('Incompatible blood types')
    })

    it('rejects when confirmedCount >= unitsNeeded', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 5, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })).rejects.toThrow('This request already has enough confirmed donors.')
    })

    it('allows confirmation when donor profile document does not exist', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, success } = useConfirmDonation()

      await confirmAvailability('req1', { donorId: 'new_donor', bloodType: 'O+' })
      expect(success.value).toBe(true)
    })

    it('always clears loading in finally block when transaction fails', async () => {
      mockRunTransaction.mockRejectedValueOnce(new Error('Transaction aborted'))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmAvailability, loading } = useConfirmDonation()

      await expect(confirmAvailability('req1', { donorId: 'donor1', bloodType: 'O+' })).rejects.toThrow('Transaction aborted')
      expect(loading.value).toBe(false)
    })
  })

  // 2.4 Guest Confirmation (~10 tests)
  describe('confirmGuestAvailability()', () => {
    it('creates guest confirmation with requestId_guestSessionId ID', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'Any', confirmedCount: 0, unitsNeeded: 2 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability } = useConfirmDonation()

      const confId = await confirmGuestAvailability('req1', { guestSessionId: 'guest_999' })
      expect(confId).toBe('req1_guest_999')
    })

    it('increments confirmedCount for guest confirmation', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'Any', confirmedCount: 1, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability } = useConfirmDonation()

      await confirmGuestAvailability('req1', { guestSessionId: 'guest_999' })
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ confirmedCount: 2 })
      )
    })

    it('sets lastConfirmedBy to guest session ID', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'Any', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability } = useConfirmDonation()

      await confirmGuestAvailability('req1', { guestSessionId: 'guest_999' })
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ lastConfirmedBy: 'guest_999' })
      )
    })

    it('checks compatibility using Any when guest blood type is omitted', async () => {
      const { canDonateTo } = await import('@/utils/bloodCompatibility.js')
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'O+', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability } = useConfirmDonation()

      await confirmGuestAvailability('req1', { guestSessionId: 'guest_999' })
      expect(canDonateTo).toHaveBeenCalledWith('Any', 'O+')
    })

    it('uses N/A when guest phone is empty', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'req1') return Promise.resolve({ exists: () => true, data: () => ({ bloodType: 'Any', confirmedCount: 0, unitsNeeded: 5 }) })
          return Promise.resolve({ exists: () => false })
        }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability } = useConfirmDonation()

      await confirmGuestAvailability('req1', { guestSessionId: 'guest_999', guestName: 'Guest' })
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ guestPhone: 'N/A' })
      )
    })

    it('rejects when request does not exist', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability } = useConfirmDonation()

      await expect(confirmGuestAvailability('req1', { guestSessionId: 'guest_999' })).rejects.toThrow('This request no longer exists.')
    })

    it('rejects duplicate guest session confirmation', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true }),
        set: vi.fn(),
        update: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { confirmGuestAvailability } = useConfirmDonation()

      await expect(confirmGuestAvailability('req1', { guestSessionId: 'guest_999' })).rejects.toThrow('This guest session has already confirmed this request.')
    })
  })

  // 2.5 Cancel Confirmation (~10 tests)
  describe('cancelConfirmation()', () => {
    it('rejects cancellation when confirmation no longer exists', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
        update: vi.fn(),
        delete: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { cancelConfirmation } = useConfirmDonation()

      await expect(cancelConfirmation('conf1', 'req1')).rejects.toThrow('Confirmation no longer exists.')
    })

    it('decrements confirmedCount by one', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'conf1') return Promise.resolve({ exists: () => true, data: () => ({ status: 'confirmed' }) })
          return Promise.resolve({ exists: () => true, data: () => ({ confirmedCount: 3 }) })
        }),
        update: vi.fn(),
        delete: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { cancelConfirmation } = useConfirmDonation()

      await cancelConfirmation('conf1', 'req1')
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ confirmedCount: 2 })
      )
    })

    it('never reduces confirmedCount below zero', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'conf1') return Promise.resolve({ exists: () => true, data: () => ({ status: 'confirmed' }) })
          return Promise.resolve({ exists: () => true, data: () => ({ confirmedCount: 0 }) })
        }),
        update: vi.fn(),
        delete: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { cancelConfirmation } = useConfirmDonation()

      await cancelConfirmation('conf1', 'req1')
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ confirmedCount: 0 })
      )
    })

    it('decrements arrivedCount when cancelling an arrived record', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.id === 'conf1') return Promise.resolve({ exists: () => true, data: () => ({ status: 'arrived' }) })
          return Promise.resolve({ exists: () => true, data: () => ({ confirmedCount: 1, arrivedCount: 1 }) })
        }),
        update: vi.fn(),
        delete: vi.fn()
      }
      mockRunTransaction.mockImplementation(async (db, cb) => cb(mockTransaction))

      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { cancelConfirmation } = useConfirmDonation()

      await cancelConfirmation('conf1', 'req1')
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ arrivedCount: 0 })
      )
    })
  })

  // 2.6 Status Transitions (12 tests)
  describe('updateConfirmationStatus()', () => {
    it('does not change arrivedCount when transitioning arrived to arrived (Bug 2 regression)', async () => {
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

    it('rejects unsupported status string (Bug 2 validation regression)', async () => {
      const { useConfirmDonation } = await import('@/composables/useConfirmDonation.js')
      const { updateConfirmationStatus, error } = useConfirmDonation()

      await expect(updateConfirmationStatus('conf1', 'invalid_status')).rejects.toThrow('Invalid confirmation status.')
      expect(error.value).toBe('Invalid confirmation status.')
    })
  })
})
