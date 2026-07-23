import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockOnAuthStateChanged = vi.fn()
const mockSignInWithEmailAndPassword = vi.fn()
const mockCreateUserWithEmailAndPassword = vi.fn()
const mockSignOut = vi.fn()
const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockUpdateDoc = vi.fn()

vi.mock('@/firebase.js', () => ({
  auth: { currentUser: null },
  db: {}
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signInWithEmailAndPassword: (...args) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args) => mockSignOut(...args)
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, path, id) => ({ path: `${path}/${id}`, id })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  serverTimestamp: () => 'MOCK_TIMESTAMP'
}))

const mockClearGuestSession = vi.fn()

vi.mock('@/composables/useGuestSession.js', () => ({
  useGuestSession: () => ({
    clearGuestSession: mockClearGuestSession
  })
}))

describe('useAuth.js Unit Tests (~20 tests)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: 'user1', email: 'donor@lifelink.vn' })
      return vi.fn()
    })
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: 'user1', role: 'donor', displayName: 'John Doe', bloodType: 'O+' })
    })
  })

  it('sets user and profile when Firebase auth emits signed-in user', async () => {
    const { useAuth } = await import('@/composables/useAuth.js')
    const { user, userProfile, authLoading, isDonor, isAdmin } = useAuth()

    expect(authLoading.value).toBe(false)
    expect(user.value).toEqual({ uid: 'user1', email: 'donor@lifelink.vn' })
    expect(userProfile.value).toEqual({ uid: 'user1', role: 'donor', displayName: 'John Doe', bloodType: 'O+' })
    expect(isDonor.value).toBe(true)
    expect(isAdmin.value).toBe(false)
  })

  it('normalises login email by trimming and lowercasing', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValueOnce()

    const { useAuth } = await import('@/composables/useAuth.js')
    const { login } = useAuth()

    await login('  USER@LIFELINK.VN  ', 'password123')

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'user@lifelink.vn',
      'password123'
    )
    expect(mockClearGuestSession).toHaveBeenCalled()
  })

  it('always registers user with role donor (Bug 3 regression)', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'new_user_123' }
    })

    const { useAuth } = await import('@/composables/useAuth.js')
    const { register } = useAuth()

    await register({
      email: 'admin@lifelink.vn', // Attempt admin email
      password: 'Password123!',
      displayName: 'Attacker',
      bloodType: 'O+',
      city: 'HCM',
      phoneNumber: '0901234567'
    })

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        role: 'donor'
      })
    )
    expect(mockClearGuestSession).toHaveBeenCalled()
  })

  it('calls Firebase signOut on logout', async () => {
    mockSignOut.mockResolvedValueOnce()

    const { useAuth } = await import('@/composables/useAuth.js')
    const { logout } = useAuth()

    await logout()
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('throws error when updateProfile is called without authenticated user', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null)
      return vi.fn()
    })

    const { useAuth } = await import('@/composables/useAuth.js')
    const { updateProfile } = useAuth()

    await expect(updateProfile({ displayName: 'New Name' })).rejects.toThrow('Not authenticated')
  })
})
