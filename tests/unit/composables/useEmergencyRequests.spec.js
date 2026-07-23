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

describe('useEmergencyRequests.js (Expanded 28 Unit Tests)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          { id: 'req1', data: () => ({ hospitalName: 'Hospital A', status: 'active', bloodType: 'O+', city: 'Hanoi', urgency: 'critical', createdAt: '2026-07-01' }) }
        ]
      })
      return vi.fn()
    })
  })

  // 1.1 Listener & Cache (~11 tests)
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

    it('creates an active-request query with status=active filter and createdAt desc order', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening } = useEmergencyRequests()
      const { query, where, orderBy } = await import('firebase/firestore')

      startListening()
      expect(where).toHaveBeenCalledWith('status', '==', 'active')
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc')
    })

    it('maps Firestore documents with their document IDs', async () => {
      mockOnSnapshot.mockImplementation((q, callback) => {
        callback({
          docs: [
            { id: 'doc_100', data: () => ({ hospitalName: 'Cho Ray', bloodType: 'A+' }) }
          ]
        })
        return vi.fn()
      })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, requests } = useEmergencyRequests()

      startListening()
      expect(requests.value[0]).toEqual({
        id: 'doc_100',
        hospitalName: 'Cho Ray',
        bloodType: 'A+'
      })
    })

    it('updates requests and clears loading after a snapshot fires', async () => {
      let snapshotCallback
      mockOnSnapshot.mockImplementation((q, callback) => {
        snapshotCallback = callback
        return vi.fn()
      })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, requests, loading } = useEmergencyRequests()

      startListening()
      expect(loading.value).toBe(true)

      snapshotCallback({
        docs: [{ id: 'live1', data: () => ({ hospitalName: 'Live Hosp' }) }]
      })

      expect(loading.value).toBe(false)
      expect(requests.value[0].id).toBe('live1')
    })

    it('handles an empty Firestore snapshot gracefully', async () => {
      mockOnSnapshot.mockImplementation((q, callback) => {
        callback({ docs: [] })
        return vi.fn()
      })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, requests, loading } = useEmergencyRequests()

      startListening()
      expect(loading.value).toBe(false)
      expect(requests.value).toEqual([])
    })

    it('stores a readable error and clears loading when the listener fails', async () => {
      mockOnSnapshot.mockImplementation((q, success, errorCb) => {
        errorCb(new Error('Permission denied'))
        return vi.fn()
      })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, error, loading } = useEmergencyRequests()

      startListening()
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Could not load emergency requests. Please check your connection.')
    })

    it('unsubscribes the previous listener before starting a new one (Bug 1 regression)', async () => {
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

    it('does not call the same unsubscribe function twice', async () => {
      const unsubMock = vi.fn()
      mockOnSnapshot.mockReturnValue(unsubMock)

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { startListening, stopListening } = useEmergencyRequests()

      startListening()
      stopListening()
      stopListening()

      expect(unsubMock).toHaveBeenCalledTimes(1)
    })
  })

  // 1.2 Admin One-Time Query (~4 tests)
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
    })

    it('maps all admin request documents with IDs', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'admin_req_1', data: () => ({ hospitalName: 'Bach Mai', city: 'Hanoi' }) }
        ]
      })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { fetchAllRequests, requests } = useEmergencyRequests()

      await fetchAllRequests()
      expect(requests.value[0].id).toBe('admin_req_1')
      expect(requests.value[0].hospitalName).toBe('Bach Mai')
    })

    it('sets admin-panel error when fetchAllRequests fails', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Network offline'))

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { fetchAllRequests, loading, error } = useEmergencyRequests()

      await fetchAllRequests()

      expect(loading.value).toBe(false)
      expect(error.value).toBe('Could not load requests for the admin panel.')
    })

    it('always clears loading after fetchAllRequests finishes', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Failed'))

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { fetchAllRequests, loading } = useEmergencyRequests()

      await fetchAllRequests()
      expect(loading.value).toBe(false)
    })
  })

  // 1.3 Client Filtering (~8 tests)
  describe('Client Filtering', () => {
    it('returns all requests when all filters are empty', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Hanoi', urgency: 'critical' },
        { id: '2', bloodType: 'O-', city: 'Da Nang', urgency: 'urgent' }
      ]

      expect(filterRequests('', '', '')).toHaveLength(2)
    })

    it('filters by exact blood type', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Hanoi', urgency: 'critical' },
        { id: '2', bloodType: 'B+', city: 'Hanoi', urgency: 'urgent' }
      ]

      const res = filterRequests('A+', '', '')
      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('1')
    })

    it('includes requests whose blood type is Any', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Hanoi', urgency: 'critical' },
        { id: '2', bloodType: 'Any', city: 'Hanoi', urgency: 'moderate' }
      ]

      const res = filterRequests('A+', '', '')
      expect(res).toHaveLength(2)
    })

    it('filters city case-insensitively', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Ho Chi Minh City', urgency: 'critical' },
        { id: '2', bloodType: 'O-', city: 'Hanoi', urgency: 'urgent' }
      ]

      const res = filterRequests('', 'HO CHI MINH', '')
      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('1')
    })

    it('filters by urgency level', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Hanoi', urgency: 'critical' },
        { id: '2', bloodType: 'A+', city: 'Hanoi', urgency: 'moderate' }
      ]

      const res = filterRequests('', '', 'critical')
      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('1')
    })

    it('combines blood type, city and urgency filters', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'A+', city: 'Hanoi', urgency: 'critical' },
        { id: '2', bloodType: 'A+', city: 'Hanoi', urgency: 'moderate' },
        { id: '3', bloodType: 'B+', city: 'Hanoi', urgency: 'critical' }
      ]

      const res = filterRequests('A+', 'Hanoi', 'critical')
      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('1')
    })

    it('returns an empty array when no request matches', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [{ id: '1', bloodType: 'AB-', city: 'Can Tho', urgency: 'moderate' }]
      expect(filterRequests('O+', 'Hanoi', 'critical')).toEqual([])
    })

    it('does not crash when a request has a missing city field (Bug 4 regression)', async () => {
      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { requests, filterRequests } = useEmergencyRequests()

      requests.value = [
        { id: '1', bloodType: 'O+', urgency: 'critical' },
        { id: '2', bloodType: 'A+', city: 'Ho Chi Minh City', urgency: 'urgent' }
      ]

      expect(() => filterRequests('', 'Ho Chi Minh', '')).not.toThrow()
      expect(filterRequests('', 'Ho Chi Minh', '')).toHaveLength(1)
    })
  })

  // 1.4 CRUD Operations (~8 tests)
  describe('CRUD Operations', () => {
    it('creates a request with status active and confirmedCount zero', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'new_id' })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { createRequest } = useEmergencyRequests()

      await createRequest({ hospitalName: 'Cho Ray', bloodType: 'O+' }, 'admin_123')

      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          confirmedCount: 0,
          status: 'active',
          createdBy: 'admin_123'
        })
      )
    })

    it('adds createdBy, createdAt and updatedAt system fields', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'new_id' })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { createRequest } = useEmergencyRequests()

      await createRequest({ hospitalName: 'Cho Ray' }, 'admin_999')

      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          createdBy: 'admin_999',
          createdAt: 'MOCK_SERVER_TIMESTAMP',
          updatedAt: 'MOCK_SERVER_TIMESTAMP'
        })
      )
    })

    it('uses a supplied createdAt instead of serverTimestamp', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'new_id' })

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { createRequest } = useEmergencyRequests()

      const customDate = '2026-06-01T10:00'
      await createRequest({ hospitalName: 'Cho Ray', createdAt: customDate }, 'admin_123')

      expect(mockAddDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          createdAt: customDate
        })
      )
    })

    it('sets an error and rethrows when request creation fails', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('Add failed'))

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { createRequest, error } = useEmergencyRequests()

      await expect(createRequest({ hospitalName: 'Cho Ray' }, 'admin_123')).rejects.toThrow('Add failed')
      expect(error.value).toBe('Could not create the emergency request.')
    })

    it('updates the selected request and adds updatedAt', async () => {
      mockUpdateDoc.mockResolvedValueOnce()

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { updateRequest } = useEmergencyRequests()

      await updateRequest('req1', { status: 'fulfilled' })

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'fulfilled',
          updatedAt: 'MOCK_SERVER_TIMESTAMP'
        })
      )
    })

    it('sets an error and rethrows when request update fails', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Update error'))

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { updateRequest, error } = useEmergencyRequests()

      await expect(updateRequest('req1', { status: 'fulfilled' })).rejects.toThrow('Update error')
      expect(error.value).toBe('Could not update the emergency request.')
    })

    it('deletes the correct request document', async () => {
      mockDeleteDoc.mockResolvedValueOnce()

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { deleteRequest } = useEmergencyRequests()

      await deleteRequest('req_to_delete')
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'req_to_delete' }))
    })

    it('sets an error and rethrows when request deletion fails', async () => {
      mockDeleteDoc.mockRejectedValueOnce(new Error('Delete error'))

      const { useEmergencyRequests } = await import('@/composables/useEmergencyRequests.js')
      const { deleteRequest, error } = useEmergencyRequests()

      await expect(deleteRequest('req1')).rejects.toThrow('Delete error')
      expect(error.value).toBe('Could not delete the emergency request.')
    })
  })
})
