/**
 * useActiveResponses.js
 *
 * Real-time listener for active en-route donor responses stored in Firebase Realtime Database (`liveTracking`).
 * Used by the Admin Live Response Map and Emergency Board to stream donor positions and ETA metrics.
 */

import { ref, computed, onUnmounted } from 'vue'
import { ref as rtdbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase.js'

const LIVE_RESPONSE_TTL_MS = 2 * 60 * 1000 // 2 minutes ghost filter

function getUpdatedAtMs(response) {
  const value = response?.lastSeenAt || response?.updatedAt
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function isFreshResponder(response) {
  const updatedAtMs = getUpdatedAtMs(response)
  if (!updatedAtMs) return true // If timestamp not set yet, keep fresh
  return Date.now() - updatedAtMs <= LIVE_RESPONSE_TTL_MS
}

function isLiveResponder(response) {
  if (response?.latitude === null || response?.latitude === undefined || response?.latitude === '') {
    return false
  }
  if (response?.longitude === null || response?.longitude === undefined || response?.longitude === '') {
    return false
  }
  const latitude = Number(response?.latitude)
  const longitude = Number(response?.longitude)
  return (
    isFreshResponder(response) &&
    (response.status === 'en_route' || response.status === 'approaching') &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  )
}

function computeLastSeenAgo(response) {
  const updatedAtMs = getUpdatedAtMs(response)
  if (!updatedAtMs) return 0
  return Math.max(0, Math.floor((Date.now() - updatedAtMs) / 1000))
}

function computeSignalQuality(response) {
  if (response?.signalQuality) return response.signalQuality
  const accuracy = response?.accuracy || 0
  if (!response?.latitude || accuracy > 150) return 'lost'
  if (accuracy > 50) return 'weak'
  return 'good'
}

export function useActiveResponses() {
  const rawResponses = ref({})
  const responses = ref([])
  const loading = ref(true)
  const error = ref(null)

  let listenerUnsubscribe = null
  let ghostFilterTimer = null

  function processResponses() {
    if (!rawResponses.value) {
      responses.value = []
      return
    }

    const list = Object.keys(rawResponses.value)
      .map((key) => {
        const item = rawResponses.value[key]
        const lastSeenAgo = computeLastSeenAgo(item)
        const signalQuality = computeSignalQuality(item)
        return {
          trackingKey: key,
          ...item,
          lastSeenAgo,
          signalQuality
        }
      })
      .filter(isLiveResponder)

    responses.value = list
  }

  /**
   * Starts listening to live donor tracking records in RTDB.
   */
  function startListening() {
    stopListening()
    loading.value = true
    error.value = null

    try {
      const trackingRootRef = rtdbRef(rtdb, 'liveTracking')

      listenerUnsubscribe = onValue(
        trackingRootRef,
        (snapshot) => {
          const val = snapshot ? snapshot.val() : null
          rawResponses.value = val || {}
          processResponses()
          loading.value = false
        },
        (err) => {
          // Silent fallback if RTDB is unavailable
          rawResponses.value = {}
          responses.value = []
          loading.value = false
        }
      )

      // Periodically re-filter every 30s to prune ghost records even when RTDB is idle
      if (ghostFilterTimer) clearInterval(ghostFilterTimer)
      ghostFilterTimer = setInterval(() => {
        processResponses()
      }, 30000)
    } catch (e) {
      responses.value = []
      loading.value = false
    }
  }

  /**
   * Stops listening to RTDB changes.
   */
  function stopListening() {
    if (listenerUnsubscribe) {
      listenerUnsubscribe()
      listenerUnsubscribe = null
    }
    if (ghostFilterTimer) {
      clearInterval(ghostFilterTimer)
      ghostFilterTimer = null
    }
  }

  /**
   * Returns active responses filtered by a specific emergency request ID.
   * @param {string} requestId
   * @returns {Array<Object>}
   */
  function getResponsesForRequest(requestId) {
    if (!requestId) return []
    return responses.value.filter((r) => r.requestId === requestId)
  }

  /**
   * Returns count of active en-route or approaching responders for a specific request ID.
   * @param {string} requestId
   * @returns {number}
   */
  function getEnRouteCountForRequest(requestId) {
    if (!requestId) return 0
    return responses.value.filter((r) => r.requestId === requestId).length
  }

  const totalActiveRespondersCount = computed(() => responses.value.length)

  onUnmounted(() => {
    stopListening()
  })

  return {
    responses,
    loading,
    error,
    totalActiveRespondersCount,
    startListening,
    stopListening,
    getResponsesForRequest,
    getEnRouteCountForRequest
  }
}
