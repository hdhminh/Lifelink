import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockOnAuthStateChanged = vi.fn()
const mockGetDoc = vi.fn()

vi.mock('@/firebase.js', () => ({
  auth: { currentUser: null },
  db: {}
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args)
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: (...args) => mockGetDoc(...args)
}))

const mockGetGuestSession = vi.fn().mockReturnValue({ lastRoute: '' })
const mockUpdateGuestSession = vi.fn()

vi.mock('@/composables/useGuestSession.js', () => ({
  useGuestSession: () => ({
    getGuestSession: mockGetGuestSession,
    updateGuestSession: mockUpdateGuestSession
  })
}))

describe('router/index.js Integration Tests (~19 tests)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    document.title = 'LifeLink'
  })

  it('allows an unauthenticated guest to open a public route', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback(null))
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/news', meta: { title: 'LifeLink - News' } },
      { name: 'Home' },
      next
    )

    expect(next).toHaveBeenCalledWith()
    expect(document.title).toBe('LifeLink - News')
  })

  it('redirects an unauthenticated user from dashboard to login preserving fullPath', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback(null))
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/dashboard', fullPath: '/dashboard?tab=events', meta: { requiresAuth: true } },
      { name: 'Home' },
      next
    )

    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/dashboard?tab=events' }
    })
  })

  it('allows an authenticated donor to open dashboard', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback({ uid: 'donor1' }))
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/dashboard', meta: { requiresAuth: true } },
      { name: 'Home' },
      next
    )

    expect(next).toHaveBeenCalledWith()
  })

  it('redirects a donor away from the admin route to dashboard', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback({ uid: 'donor1' }))
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'donor' })
    })
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/admin/requests', meta: { requiresAuth: true, requiresAdmin: true } },
      { name: 'Dashboard' },
      next
    )

    expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
  })

  it('allows a Firestore admin profile to open the admin route', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback({ uid: 'admin1' }))
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'admin' })
    })
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/admin/requests', meta: { requiresAuth: true, requiresAdmin: true } },
      { name: 'Dashboard' },
      next
    )

    expect(next).toHaveBeenCalledWith()
  })

  it('redirects to dashboard when admin profile document is missing', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback({ uid: 'user_no_doc' }))
    mockGetDoc.mockResolvedValueOnce({ exists: () => false })
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/admin/requests', meta: { requiresAuth: true, requiresAdmin: true } },
      { name: 'Dashboard' },
      next
    )

    expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
  })

  it('restores a guest lastRoute during initial visit to home', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback(null))
    mockGetGuestSession.mockReturnValueOnce({ lastRoute: '/events' })
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/', meta: {} },
      { name: undefined },
      next
    )

    expect(next).toHaveBeenCalledWith('/events')
  })

  it('does not restore /, /login or /register as a guest lastRoute', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => callback(null))
    mockGetGuestSession.mockReturnValueOnce({ lastRoute: '/login' })
    const next = vi.fn()

    const { navigationGuard } = await import('@/router/index.js')
    await navigationGuard(
      { path: '/', meta: {} },
      { name: undefined },
      next
    )

    expect(next).toHaveBeenCalledWith()
  })
})
