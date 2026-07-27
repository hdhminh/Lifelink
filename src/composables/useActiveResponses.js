/**
 * useActiveResponses.js
 *
 * Real-time listener for active en-route donor responses stored in Firebase Realtime Database (`liveTracking`).
 * Used by the Admin Live Response Map and Emergency Board to stream donor positions and ETA metrics.
 */

import { ref, computed, onUnmounted } from 'vue'
import { ref as rtdbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase.js'

const LIVE_RESPONSE_TTL_MS = 2 * 60 * 1000

function hasLiveCoordinates(response) {
  if (response?.latitude == null || response?.longitude == null) return false
  if (response.latitude === '' || response.longitude === '') return false

  const latitude = Number(response?.latitude)
  const longitude = Number(response?.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

function getUpdatedAtMs(response) {
  const value = response?.updatedAt
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
  if (!updatedAtMs) return true
  return Date.now() - updatedAtMs <= LIVE_RESPONSE_TTL_MS
}

function isLiveResponder(response) {
  return (
    hasLiveCoordinates(response) &&
    isFreshResponder(response) &&
    (response.status === 'en_route' || response.status === 'approaching')
  )
}

export function useActiveResponses() {
  const responses = ref([])
  const loading = ref(true)
  const error = ref(null)

  let listenerUnsubscribe = null

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
          if (!val) {
            responses.value = []
            loading.value = false
            return
          }

          const list = Object.keys(val)
            .map((key) => ({
              trackingKey: key,
              ...val[key]
            }))
            .filter(isLiveResponder)

          responses.value = list
          loading.value = false
        },
        (err) => {
          // Silent fallback if RTDB is unavailable
          responses.value = []
          loading.value = false
        }
      )
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
