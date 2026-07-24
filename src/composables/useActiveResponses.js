/**
 * useActiveResponses.js
 *
 * Real-time listener for active en-route donor responses stored in Firebase Realtime Database (`liveTracking`).
 * Used by the Admin Live Response Map and Emergency Board to stream donor positions and ETA metrics.
 */

import { ref, computed, onUnmounted } from 'vue'
import { ref as rtdbRef, onValue, off } from 'firebase/database'
import { rtdb } from '@/firebase.js'

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

    const trackingRootRef = rtdbRef(rtdb, 'liveTracking')

    listenerUnsubscribe = onValue(
      trackingRootRef,
      (snapshot) => {
        const val = snapshot.val()
        if (!val) {
          responses.value = []
          loading.value = false
          return
        }

        const list = Object.keys(val).map((key) => ({
          trackingKey: key,
          ...val[key]
        }))

        responses.value = list
        loading.value = false
      },
      (err) => {
        console.error('[useActiveResponses] RTDB onValue error:', err)
        error.value = 'Failed to load live tracking stream.'
        loading.value = false
      }
    )
  }

  /**
   * Stops listening to RTDB changes.
   */
  function stopListening() {
    if (listenerUnsubscribe) {
      const trackingRootRef = rtdbRef(rtdb, 'liveTracking')
      off(trackingRootRef)
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
    return responses.value.filter(
      (r) => r.requestId === requestId && (r.status === 'en_route' || r.status === 'approaching')
    ).length
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
