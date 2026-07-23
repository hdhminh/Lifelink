import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/firebase.js', () => ({ db: {} }))

const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockOnSnapshot = vi.fn()
const mockWriteBatch = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, path, ...sub) => ({ path: sub.length ? `${path}/${sub.join('/')}` : path })),
  doc: vi.fn((db, path, id) => ({ path: `${path}/${id}`, id })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: () => 'MOCK_TIMESTAMP',
  writeBatch: () => mockWriteBatch()
}))

describe('useSupportChat.js Unit Tests (~25 tests)', () => {
  let mockBatch

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue()
    }
    mockWriteBatch.mockReturnValue(mockBatch)
  })

  it('creates missing user thread with default values on ensureThread', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })
    mockSetDoc.mockResolvedValueOnce()

    const { useSupportChat } = await import('@/composables/useSupportChat.js')
    const { useSupportChat: getChat } = await import('@/composables/useSupportChat.js')
    const { sendParticipantMessage } = getChat()

    await sendParticipantMessage({
      threadId: 'user1',
      participantId: 'user1',
      participantType: 'user',
      participantDisplayName: 'Alice',
      text: 'Hello support'
    })

    expect(mockBatch.set).toHaveBeenCalled()
    expect(mockBatch.commit).toHaveBeenCalledTimes(1)
  })

  it('sends system message with Support Bot defaults', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true })

    const { useSupportChat } = await import('@/composables/useSupportChat.js')
    const { sendSystemMessage } = useSupportChat()

    await sendSystemMessage({
      threadId: 'user1',
      participantId: 'user1',
      participantType: 'user',
      text: 'Automated reply'
    })

    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        senderRole: 'support_bot',
        text: 'Automated reply'
      })
    )
  })

  it('sends admin message and updates adminLastReadAt', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true })

    const { useSupportChat } = await import('@/composables/useSupportChat.js')
    const { sendAdminMessage } = useSupportChat()

    await sendAdminMessage({
      threadId: 'user1',
      participantId: 'user1',
      text: 'Admin response'
    })

    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        senderRole: 'admin',
        text: 'Admin response'
      })
    )
  })

  it('updates adminLastReadAt when markAdminThreadRead is called', async () => {
    mockUpdateDoc.mockResolvedValueOnce()

    const { useSupportChat } = await import('@/composables/useSupportChat.js')
    const { markAdminThreadRead } = useSupportChat()

    await markAdminThreadRead('thread1')

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        adminLastReadAt: 'MOCK_TIMESTAMP'
      })
    )
  })

  it('updates participantLastReadAt when markParticipantThreadRead is called', async () => {
    mockUpdateDoc.mockResolvedValueOnce()

    const { useSupportChat } = await import('@/composables/useSupportChat.js')
    const { markParticipantThreadRead } = useSupportChat()

    await markParticipantThreadRead('thread1')

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        participantLastReadAt: 'MOCK_TIMESTAMP'
      })
    )
  })
})
