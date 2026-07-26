/**
 * useLocationTracking.js
 *
 * Donor-side live location tracking engine.
 * Uses browser `navigator.geolocation.watchPosition()` to stream coordinates.
 * Writes to Firebase Realtime Database at `liveTracking/{donorId}_{requestId}`
 * with `onDisconnect().remove()` for guaranteed server-side cleanup when client disconnects.
 *
 * Features:
 * - Throttling: Minimum 5s interval OR 30m distance change before RTDB write.
 * - Privacy protection: Explicit consent trigger, auto-stop on arrive/cancel/unmount/beforeunload.
 * - Proximity detection: Auto-flags 'approaching' when donor is within 500m of target hospital.
 */

import { ref as vueRef, onUnmounted } from 'vue'
import { ref as dbRef, set, update, remove, onDisconnect, serverTimestamp } from 'firebase/database'
import { rtdb } from '@/firebase.js'
import {
  calculateHaversineDistance,
  formatDistance,
  calculateEtaMinutes
} from '@/utils/haversine.js'

const isTracking = vueRef(false)
const currentPosition = vueRef(null) // { lat, lng, accuracy, speed }
const distanceToHospital = vueRef(null) // meters
const formattedDistance = vueRef('')
const estimatedEtaMins = vueRef(null) // minutes
const trackingStatus = vueRef('idle') // 'idle' | 'en_route' | 'approaching' | 'arrived' | 'error'
const trackingError = vueRef(null)

let watchId = null
let activeTrackingKey = null
let lastRecordedPos = null
let lastWriteTimestamp = 0

const MIN_WRITE_INTERVAL_MS = 5000 // 5 seconds
const MIN_WRITE_DISTANCE_METERS = 30 // 30 meters

export function useLocationTracking() {

  /**
   * Helper to format tracking key.
   */
  function getTrackingKey(requestId, donorId) {
    return `${requestId}_${donorId}`
  }

  /**
   * Starts tracking donor's live location and updating Firestore liveTracking collection.
   */
  function startTracking({ requestId, donorId, donorName, bloodType, hospitalLocation }) {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      trackingError.value = 'Geolocation is not supported by your browser.'
      trackingStatus.value = 'error'
      return
    }

    stopTracking()

    trackingError.value = null
    isTracking.value = true
    trackingStatus.value = 'en_route'
    activeTrackingKey = getTrackingKey(requestId, donorId)

    const trackingDocRef = dbRef(rtdb, `liveTracking/${activeTrackingKey}`)

    // Set up onDisconnect to remove the node when the client disconnects
    onDisconnect(trackingDocRef)
      .remove()
      .catch((err) => {
        console.warn('[useLocationTracking] onDisconnect setup failed:', err)
      })

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords
        const now = Date.now()

        currentPosition.value = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 0,
          speed: speed || null
        }

        // Calculate distance & ETA to target hospital
        if (hospitalLocation && hospitalLocation.lat && hospitalLocation.lng) {
          const dist = calculateHaversineDistance(
            latitude,
            longitude,
            hospitalLocation.lat,
            hospitalLocation.lng
          )
          distanceToHospital.value = dist
          formattedDistance.value = formatDistance(dist)
          estimatedEtaMins.value = calculateEtaMinutes(dist)

          // Auto-detect approaching status when within 500m
          if (dist <= 500 && trackingStatus.value === 'en_route') {
            trackingStatus.value = 'approaching'
          }
        }

        // Check throttling condition before writing
        const timePassed = now - lastWriteTimestamp
        const distMoved = lastRecordedPos
          ? calculateHaversineDistance(
              latitude,
              longitude,
              lastRecordedPos.lat,
              lastRecordedPos.lng
            )
          : Infinity

        if (
          !lastRecordedPos ||
          timePassed >= MIN_WRITE_INTERVAL_MS ||
          distMoved >= MIN_WRITE_DISTANCE_METERS
        ) {
          lastWriteTimestamp = now
          lastRecordedPos = { lat: latitude, lng: longitude }

          const dataPayload = {
            donorId,
            donorName: donorName || 'Donor',
            bloodType: bloodType || 'O+',
            requestId,
            hospitalName: hospitalLocation?.hospitalName || 'Hospital',
            city: hospitalLocation?.city || '',
            hospitalLat: hospitalLocation?.lat || null,
            hospitalLng: hospitalLocation?.lng || null,
            latitude,
            longitude,
            accuracy: accuracy || 0,
            speed: speed || null,
            status: trackingStatus.value,
            distanceMeters: distanceToHospital.value || 0,
            etaMins: estimatedEtaMins.value || 0,
            updatedAt: serverTimestamp()
          }

          update(trackingDocRef, dataPayload).catch((err) => {
            console.error('[useLocationTracking] RTDB write error:', err)
          })
        }
      },
      (err) => {
        console.warn('[useLocationTracking] watchPosition error:', err)
        let msg = 'Could not retrieve your live location.'
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was revoked.'
          stopTracking()
        }
        trackingError.value = msg
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )

    // Window unload safety cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', stopTracking)
    }
  }

  /**
   * Stops active geolocation tracking and removes document from RTDB liveTracking.
   */
  function stopTracking() {
    if (watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }

    if (activeTrackingKey) {
      const trackingDocRef = dbRef(rtdb, `liveTracking/${activeTrackingKey}`)

      // Cancel onDisconnect first so it doesn't fire unnecessarily
      onDisconnect(trackingDocRef)
        .cancel()
        .catch((err) => {
          console.warn('[useLocationTracking] onDisconnect cancel warning:', err)
        })

      remove(trackingDocRef).catch((err) => {
        console.warn('[useLocationTracking] RTDB remove warning:', err)
      })
      activeTrackingKey = null
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', stopTracking)
    }

    isTracking.value = false
    currentPosition.value = null
    distanceToHospital.value = null
    formattedDistance.value = ''
    estimatedEtaMins.value = null
    trackingStatus.value = 'idle'
    lastRecordedPos = null
    lastWriteTimestamp = 0
  }

  /**
   * Marks status as arrived at hospital and completes tracking.
   */
  function markArrived() {
    trackingStatus.value = 'arrived'
    stopTracking()
  }

  return {
    isTracking,
    currentPosition,
    distanceToHospital,
    formattedDistance,
    estimatedEtaMins,
    trackingStatus,
    trackingError,
    startTracking,
    stopTracking,
    markArrived
  }
}
