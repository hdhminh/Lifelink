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
  arrayUnion: (...args) => ['MOCK_ARRAY_UNION', ...args],
  arrayRemove: (...args) => ['MOCK_ARRAY_REMOVE', ...args],
  increment: (val) => `MOCK_INCREMENT_${val}`,
  onSnapshot: (...args) => mockOnSnapshot(...args),
  getDocs: (...args) => mockGetDocs(...args),
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args)
}))

describe('useDonationEvents.js Unit Tests (~25 tests)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          { id: 'event1', data: () => ({ title: 'Blood Drive A', date: '2026-08-01', category: 'Drive', likedBy: [], interestedCount: 0 }) }
        ]
      })
      return vi.fn()
    })
  })

  it('starts with loading true when event cache is empty', async () => {
    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { loading } = useDonationEvents()
    expect(loading.value).toBe(true)
  })

  it('immediately exposes cached events without showing loading', async () => {
    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { startListening, events, loading } = useDonationEvents()

    startListening()
    expect(loading.value).toBe(false)
    expect(events.value).toHaveLength(1)
  })

  it('unsubscribes previous listener before starting another', async () => {
    const unsubMock = vi.fn()
    mockOnSnapshot.mockReturnValueOnce(unsubMock)

    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { startListening } = useDonationEvents()

    startListening()
    startListening()

    expect(unsubMock).toHaveBeenCalledTimes(1)
  })

  it('optimistically adds user interest and calls arrayUnion + increment', async () => {
    mockUpdateDoc.mockResolvedValueOnce()

    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { startListening, toggleInterested, events } = useDonationEvents()

    startListening()
    await toggleInterested('event1', 'user1')

    expect(events.value[0].likedBy).toContain('user1')
    expect(events.value[0].interestedCount).toBe(1)
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        likedBy: ['MOCK_ARRAY_UNION', 'user1'],
        interestedCount: 'MOCK_INCREMENT_1'
      })
    )
  })

  it('optimistically removes user interest and calls arrayRemove + decrement', async () => {
    mockOnSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          { id: 'event1', data: () => ({ title: 'Blood Drive A', date: '2026-08-01', category: 'Drive', likedBy: ['user1'], interestedCount: 1 }) }
        ]
      })
      return vi.fn()
    })
    mockUpdateDoc.mockResolvedValueOnce()

    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { startListening, toggleInterested, events } = useDonationEvents()

    startListening()
    await toggleInterested('event1', 'user1')

    expect(events.value[0].likedBy).not.toContain('user1')
    expect(events.value[0].interestedCount).toBe(0)
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        likedBy: ['MOCK_ARRAY_REMOVE', 'user1'],
        interestedCount: 'MOCK_INCREMENT_-1'
      })
    )
  })

  it('restores original event state when Firestore update fails', async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error('Network failure'))

    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { startListening, toggleInterested, events, error } = useDonationEvents()

    startListening()
    await expect(toggleInterested('event1', 'user1')).rejects.toThrow('Network failure')

    expect(events.value[0].likedBy).not.toContain('user1')
    expect(events.value[0].interestedCount).toBe(0)
    expect(error.value).toBe('Could not update your Interested status.')
  })

  it('creates an event with empty likedBy and interestedCount zero', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'event_new' })

    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { createEvent, loading, error } = useDonationEvents()

    const payload = { title: 'New Drive', date: '2026-09-01', location: 'Cho Ray', city: 'HCM', category: 'Drive' }
    await createEvent(payload)

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(mockAddDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        title: 'New Drive',
        likedBy: [],
        interestedCount: 0
      })
    )
  })

  it('deletes an event from Firestore successfully', async () => {
    mockDeleteDoc.mockResolvedValueOnce()

    const { useDonationEvents } = await import('@/composables/useDonationEvents.js')
    const { deleteEvent, loading, error } = useDonationEvents()

    await deleteEvent('event1')

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(mockDeleteDoc).toHaveBeenCalled()
  })
})
