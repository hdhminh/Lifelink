import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/firebase.js', () => ({ db: {}, auth: {} }))

const mockSignIn = vi.fn()
const mockCreateUser = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuth = vi.fn()
const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: (...args) => mockSignIn(...args),
  createUserWithEmailAndPassword: (...args) => mockCreateUser(...args),
  signOut: (...args) => mockSignOut(...args),
  onAuthStateChanged: (...args) => mockOnAuth(...args),
  updateProfile: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => ({ path: `${collection}/${id}`, id })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  updateDoc: vi.fn(),
  serverTimestamp: () => 'MOCK_TIMESTAMP'
}))

describe('useAuth.js Unit Tests (5 Tests)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockOnAuth.mockImplementation(() => vi.fn())
  })

  it('initializes with null user', async () => {
    const { useAuth } = await import('@/composables/useAuth.js')
    const { user } = useAuth()
    expect(user.value).toBeNull()
  })

  it('updates user and fetches userProfile when auth state changes to logged in', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ displayName: 'Logged In User', role: 'donor', bloodType: 'O+' })
    })

    mockOnAuth.mockImplementation((auth, callback) => {
      callback({ uid: 'user_100', email: 'user@lifelink.vn' })
      return vi.fn()
    })

    const { useAuth } = await import('@/composables/useAuth.js')
    const { user, userProfile } = useAuth()

    expect(user.value.uid).toBe('user_100')
    expect(userProfile.value.displayName).toBe('Logged In User')
  })

  it('clears user profile when auth state changes to logged out', async () => {
    mockOnAuth.mockImplementation((auth, callback) => {
      callback(null)
      return vi.fn()
    })

    const { useAuth } = await import('@/composables/useAuth.js')
    const { user, userProfile } = useAuth()

    expect(user.value).toBeNull()
    expect(userProfile.value).toBeNull()
  })

  it('registers donor profile with strictly role=donor (Bug 3 regression)', async () => {
    mockCreateUser.mockResolvedValueOnce({
      user: { uid: 'new_uid', email: 'admin@lifelink.vn' }
    })
    mockSetDoc.mockResolvedValueOnce()
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ displayName: 'New User', role: 'donor' })
    })

    const { useAuth } = await import('@/composables/useAuth.js')
    const { register } = useAuth()

    await register({
      email: 'admin@lifelink.vn',
      password: 'Pass',
      displayName: 'New User',
      phoneNumber: '0912345678',
      bloodType: 'A+',
      city: 'Hanoi'
    })

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        role: 'donor',
        email: 'admin@lifelink.vn'
      })
    )
  })

  it('logs out user and resets local state', async () => {
    mockSignOut.mockResolvedValueOnce()

    const { useAuth } = await import('@/composables/useAuth.js')
    const { logout } = useAuth()

    await logout()
    expect(mockSignOut).toHaveBeenCalled()
  })
})
