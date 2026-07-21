import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGuestSession } from '@/composables/useGuestSession.js'

describe('useGuestSession.js', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('generates a new guest session if none exists', () => {
    const { getGuestSession } = useGuestSession()
    const session = getGuestSession()
    expect(session.guestId).toBeDefined()
    expect(session.guestId.startsWith('guest_')).toBe(true)
    expect(localStorage.getItem('ll_guest_session')).toBeDefined()
  })

  it('retrieves an existing valid guest session', () => {
    const mockSession = {
      guestId: 'guest_test123',
      savedAt: Date.now(),
      lastRoute: '/news'
    }
    localStorage.setItem('ll_guest_session', JSON.stringify(mockSession))

    const { getGuestSession } = useGuestSession()
    const session = getGuestSession()
    expect(session.guestId).toBe('guest_test123')
    expect(session.lastRoute).toBe('/news')
  })

  it('expires session if older than TTL (7 days)', () => {
    const expiredTime = Date.now() - 8 * 24 * 60 * 60 * 1000 // 8 days ago
    const mockSession = {
      guestId: 'guest_expired',
      savedAt: expiredTime
    }
    localStorage.setItem('ll_guest_session', JSON.stringify(mockSession))

    const { getGuestSession } = useGuestSession()
    const session = getGuestSession()
    expect(session.guestId).not.toBe('guest_expired')
    expect(session.guestId.startsWith('guest_')).toBe(true)
  })

  it('updates session values correctly', () => {
    const { getGuestSession, updateGuestSession } = useGuestSession()
    const initialSession = getGuestSession()
    
    updateGuestSession({ preferredBloodType: 'O-' })
    const updatedSession = getGuestSession()
    expect(updatedSession.guestId).toBe(initialSession.guestId)
    expect(updatedSession.preferredBloodType).toBe('O-')
  })

  it('clears session values when requested', () => {
    const { getGuestSession, clearGuestSession } = useGuestSession()
    const session = getGuestSession()
    expect(localStorage.getItem('ll_guest_session')).toBeDefined()

    clearGuestSession()
    expect(localStorage.getItem('ll_guest_session')).toBeNull()
  })
})
