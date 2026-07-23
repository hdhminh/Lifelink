/**
 * useGuestSession.js
 *
 * Manages anonymous guest sessions via localStorage.
 * Sessions auto-expire after 7 days (TTL_MS) to respect privacy.
 * Stores filter preferences, last visited route, and interested events
 * so returning guests get a seamless experience without login.
 */

import { ref } from 'vue'

/** @constant {number} TTL_MS - Session time-to-live: 7 days in milliseconds. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/** @type {Object} Default session shape used when no stored session exists. */
const defaultSession = {
  guestId: '',
  savedAt: 0,
  lastRoute: '',
  emergencyFilters: { bloodType: '', city: '', urgency: '' },
  eventFilters: { searchQuery: '', category: '' },
  interestedEvents: [],
  preferredBloodType: ''
}

/**
 * Composable providing guest session CRUD operations backed by localStorage.
 * @returns {{ getGuestSession: () => Object, updateGuestSession: (updates: Object) => void, clearGuestSession: () => void }}
 */
export function useGuestSession() {
  /**
   * Retrieves the current guest session from localStorage.
   * If the session has expired (older than TTL_MS), it is cleared and a fresh
   * session is returned. If no guestId exists, one is auto-generated.
   * @returns {Object} The current guest session merged with default values.
   */
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

  /**
   * Merges partial updates into the current guest session and persists to localStorage.
   * Automatically updates the `savedAt` timestamp to extend TTL.
   * @param {Object} updates - Partial session fields to merge.
   */
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

  /**
   * Removes the guest session from localStorage entirely.
   * Called when a guest registers or logs in.
   */
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
