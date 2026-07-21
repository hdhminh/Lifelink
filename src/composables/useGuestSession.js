import { ref } from 'vue'

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const defaultSession = {
  guestId: '',
  savedAt: 0,
  lastRoute: '',
  emergencyFilters: { bloodType: '', city: '', urgency: '' },
  eventFilters: { searchQuery: '', category: '' },
  interestedEvents: [],
  preferredBloodType: ''
}

export function useGuestSession() {
  function getGuestSession() {
    if (typeof window === 'undefined') return { ...defaultSession }
    try {
      const dataStr = localStorage.getItem('ll_guest_session')
      let session = null
      
      if (dataStr) {
        session = JSON.parse(dataStr)
        const now = Date.now()
        if (session.savedAt && now - session.savedAt > TTL_MS) {
          localStorage.removeItem('ll_guest_session')
          session = null
        }
      }
      
      if (!session) {
        session = { ...defaultSession }
      }
      
      if (!session.guestId) {
        session.guestId = 'guest_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
        localStorage.setItem('ll_guest_session', JSON.stringify(session))
      }
      
      return { ...defaultSession, ...session }
    } catch (e) {
      console.error('Error reading guest session', e)
      return { ...defaultSession }
    }
  }

  function updateGuestSession(updates) {
    if (typeof window === 'undefined') return
    try {
      const current = getGuestSession()
      const updated = {
        ...current,
        ...updates,
        savedAt: Date.now()
      }
      localStorage.setItem('ll_guest_session', JSON.stringify(updated))
    } catch (e) {
      console.error('Error updating guest session', e)
    }
  }

  function clearGuestSession() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('ll_guest_session')
  }

  return {
    getGuestSession,
    updateGuestSession,
    clearGuestSession
  }
}
