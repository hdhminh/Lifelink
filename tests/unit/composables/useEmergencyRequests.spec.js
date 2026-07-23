import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/firebase.js', () => ({ db: {} }))

const mockOnSnapshot = vi.fn()
const mockGetDocs = vi.fn()
const mockAddDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockDeleteDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn((db, path, id) => ({ path: `${path}/${id}`, id })),
  serverTimestamp: () => 'MOCK_SERVER_TIMESTAMP',
  onSnapshot: (...args) => mockOnSnapshot(...args),
  getDocs: (...args) => mockGetDocs(...args),
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args)
}))

describe('useEmergencyRequests.js (Full Unit Test Suite)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Default safe snapshot mock
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          { id: 'req1', data: () => ({ hospitalName: 'Hospital A', status: 'active' }) }
        ]
      })
      return vi.fn()
    })
  })

  // 1.1 Listener & Cache
  describe('Listener & Cache', () => {
    it('initialises with loading true when no cached requests exist', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { loading } = useEmergencyRequests()
      expect(loading.value).toBe(true)
    })

    it('immediately exposes cached requests without showing loading', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, requests, loading } = useEmergencyRequests()

      startListening()
      expect(loading.value).toBe(false)
      expect(requests.value).toHaveLength(1)

      const instance2 = useEmergencyRequests()
      expect(instance2.loading.value).toBe(false)
      expect(instance2.requests.value).toHaveLength(1)
    })

    it('unsubscribes the previous listener before starting a new one', async () => {
      const firstUnsubscribe = vi.fn()
      mockOnSnapshot.mockReturnValueOnce(firstUnsubscribe)

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening } = useEmergencyRequests()

      startListening()
      startListening()

      expect(firstUnsubscribe).toHaveBeenCalledTimes(1)
    })

    it('calls unsubscribe exactly once when stopListening is invoked', async () => {
      const unsubMock = vi.fn()
      mockOnSnapshot.mockReturnValue(unsubMock)

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, stopListening } = useEmergencyRequests()

      startListening()
      stopListening()

      expect(unsubMock).toHaveBeenCalledTimes(1)
    })

    it('does nothing when stopListening is called without an active listener', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { stopListening } = useEmergencyRequests()

      expect(() => stopListening()).not.toThrow()
    })

    it('handles snapshot error by setting error message and clearing loading', async () => {
      mockOnSnapshot.mockImplementation((q, success, errorCb) => {
        errorCb(new Error('Network error'))
        return vi.fn()
      })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, error, loading } = useEmergencyRequests()

      startListening()
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Could not load emergency requests. Please check your connection.')
    })
  })

  // 1.2 Admin One-Time Query
  describe('Admin One-Time Query', () => {
    it('fetches all requests without applying active-status filter', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: '1', data: () => ({ status: 'active', hospitalName: 'Hosp A' }) },
          { id: '2', data: () => ({ status: 'fulfilled', hospitalName: 'Hosp B' }) }
        ]
      })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { fetchAllRequests, requests, loading, error } = useEmergencyRequests()

      await fetchAllRequests()

      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(requests.value).toHaveLength(2)
      expect(requests.value[0].id).toBe('1')
      expect(requests.value[1].id).toBe('2')
    })

    it('sets admin-panel error when fetchAllRequests fails', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Permission denied'))

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { fetchAllRequests, loading, error } = useEmergencyRequests()

      await fetchAllRequests()

      expect(loading.value).toBe(false)
      expect(error.value).toBe('Could not load requests for the admin panel.')
    })
  })

  // 1.3 Client Filtering
  describe('Client Filtering', () => {
    it('returns all requests when all filters are empty', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Hanoi', urgency: 'critical' },
        { id: '2', bloodType: 'O-', city: 'Da Nang', urgency: 'urgent' }
      ]

      const result = filterRequests('', '', '')
      expect(result).toHaveLength(2)
    })

    it('filters by exact blood type and includes Any', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Hanoi', urgency: 'critical' },
        { id: '2', bloodType: 'O-', city: 'Hanoi', urgency: 'urgent' },
        { id: '3', bloodType: 'Any', city: 'Hanoi', urgency: 'moderate' }
      ]

      const result = filterRequests('A+', '', '')
      expect(result).toHaveLength(2)
      expect(result.map(r => r.id)).toEqual(['1', '3'])
    })

    it('filters city case-insensitively', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Ho Chi Minh City', urgency: 'critical' },
        { id: '2', bloodType: 'O-', city: 'Hanoi', urgency: 'urgent' }
      ]

      const result = filterRequests('', 'ho chi minh', '')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('does not crash when a request has a missing city field', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'O+', urgency: 'critical' },
        { id: '2', bloodType: 'A+', city: 'Ho Chi Minh City', urgency: 'urgent' }
      ]

      expect(() => filterRequests('', 'Ho Chi Minh', '')).not.toThrow()
      const filtered = filterRequests('', 'Ho Chi Minh', '')
      expect(filtered).toHaveLength(1)
    })
  })

  // 1.4 CRUD Operations
  describe('CRUD Operations', () => {
    it('creates a request with default system fields', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'new_id' })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { createRequest, loading, error } = useEmergencyRequests()

      const payload = { hospitalName: 'Cho Ray', bloodType: 'O+', city: 'HCM', urgency: 'critical' }
      await createRequest(payload, 'admin_123')

      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          hospitalName: 'Cho Ray',
          confirmedCount: 0,
          status: 'active',
          createdBy: 'admin_123'
        })
      )
    })

    it('uses custom createdAt when provided instead of serverTimestamp', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'new_id' })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { createRequest } = useEmergencyRequests()

      const customDate = '2026-06-01T10:00'
      const payload = { hospitalName: 'Cho Ray', createdAt: customDate }
      await createRequest(payload, 'admin_123')

      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          createdAt: customDate
        })
      )
    })

    it('updates request and rethrows error on failure', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Update error'))

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { updateRequest, error } = useEmergencyRequests()

      await expect(updateRequest('req1', { status: 'fulfilled' })).rejects.toThrow('Update error')
      expect(error.value).toBe('Could not update the emergency request.')
    })

    it('deletes request document successfully', async () => {
      mockDeleteDoc.mockResolvedValueOnce()

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { deleteRequest, error, loading } = useEmergencyRequests()

      await deleteRequest('req1')
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(mockDeleteDoc).toHaveBeenCalled()
    })
  })
})
