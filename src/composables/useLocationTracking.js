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

import { ref as vueRef } from 'vue'
import { ref as dbRef, update, remove, onDisconnect, serverTimestamp } from 'firebase/database'
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
const HIGH_ACCURACY_MIN_WRITE_DISTANCE_METERS = 15
const LOW_ACCURACY_MIN_WRITE_DISTANCE_METERS = 30
const TRACKING_SESSION_STORAGE_KEY = 'lifelink.activeTrackingSession'
const HIGH_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0
}
const LOW_ACCURACY_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 30000
}

function getStoredTrackingSession() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(TRACKING_SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.requestId || !parsed?.donorId || !parsed?.hospitalLocation) {
      return null
    }
    return parsed
  } catch (err) {
    console.warn('[useLocationTracking] Could not read stored tracking session:', err)
    return null
  }
}

function saveTrackingSession(session) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      TRACKING_SESSION_STORAGE_KEY,
      JSON.stringify({
        ...session,
        savedAt: Date.now()
      })
    )
  } catch (err) {
    console.warn('[useLocationTracking] Could not persist tracking session:', err)
  }
}

function clearTrackingSession() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(TRACKING_SESSION_STORAGE_KEY)
  } catch (err) {
    console.warn('[useLocationTracking] Could not clear tracking session:', err)
  }
}

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

    stopTracking({ clearSession: false })

    trackingError.value = null
    isTracking.value = true
    trackingStatus.value = 'en_route'
    activeTrackingKey = getTrackingKey(requestId, donorId)
    saveTrackingSession({
      requestId,
      donorId,
      donorName: donorName || 'Donor',
      bloodType: bloodType || 'O+',
      hospitalLocation
    })

    const trackingDocRef = dbRef(rtdb, `liveTracking/${activeTrackingKey}`)

    // Set up onDisconnect to remove the node when the client disconnects
    onDisconnect(trackingDocRef)
      .remove()
      .catch((err) => {
        console.warn('[useLocationTracking] onDisconnect setup failed:', err)
      })

    let usingHighAccuracy = true

    const handlePositionUpdate = (position) => {
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

      const minWriteDistanceMeters = usingHighAccuracy
        ? HIGH_ACCURACY_MIN_WRITE_DISTANCE_METERS
        : LOW_ACCURACY_MIN_WRITE_DISTANCE_METERS

      if (
        !lastRecordedPos ||
        timePassed >= MIN_WRITE_INTERVAL_MS ||
        distMoved >= minWriteDistanceMeters
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
          accuracyMode: usingHighAccuracy ? 'high' : 'approximate',
          speed: speed || null,
          status: trackingStatus.value,
          distanceMeters: distanceToHospital.value || 0,
          etaMins: estimatedEtaMins.value || 0,
          updatedAt: serverTimestamp()
        }

        update(trackingDocRef, dataPayload).catch((err) => {
          console.error('[useLocationTracking] RTDB write error:', err)
        })

        saveTrackingSession({
          requestId,
          donorId,
          donorName: donorName || 'Donor',
          bloodType: bloodType || 'O+',
          hospitalLocation,
          lastPosition: currentPosition.value,
          accuracyMode: usingHighAccuracy ? 'high' : 'approximate',
          distanceMeters: distanceToHospital.value || 0,
          etaMins: estimatedEtaMins.value || 0,
          status: trackingStatus.value
        })
      }
    }

    const handlePositionError = (err) => {
      console.warn('[useLocationTracking] watchPosition error:', err)
      let msg = 'Could not retrieve your live location.'
      if (err.code === err.PERMISSION_DENIED) {
        msg = 'Location permission was revoked.'
        stopTracking()
      } else if (usingHighAccuracy) {
        usingHighAccuracy = false
        msg = 'Using approximate location.'
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId)
          watchId = null
        }
        watchId = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handlePositionError,
          LOW_ACCURACY_OPTIONS
        )
      }
      trackingError.value = msg
    }

    watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      HIGH_ACCURACY_OPTIONS
    )

    // Do not stop tracking on page reload. The browser may disconnect the RTDB socket,
    // but the saved session lets the donor page resume live tracking after refresh.
  }

  /**
   * Stops active geolocation tracking and removes document from RTDB liveTracking.
   */
  function stopTracking(options = {}) {
    const { clearSession = true, removeRemote = true } = options
    const storedSession = getStoredTrackingSession()
    const trackingKeyToRemove =
      activeTrackingKey ||
      (storedSession?.requestId && storedSession?.donorId
        ? getTrackingKey(storedSession.requestId, storedSession.donorId)
        : null)

    if (watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }

    if (trackingKeyToRemove) {
      const trackingDocRef = dbRef(rtdb, `liveTracking/${trackingKeyToRemove}`)

      // Cancel onDisconnect first so it doesn't fire unnecessarily
      onDisconnect(trackingDocRef)
        .cancel()
        .catch((err) => {
          console.warn('[useLocationTracking] onDisconnect cancel warning:', err)
        })

      if (removeRemote) {
        remove(trackingDocRef).catch((err) => {
          console.warn('[useLocationTracking] RTDB remove warning:', err)
        })
      }
    }
    activeTrackingKey = null

    if (clearSession) clearTrackingSession()

    isTracking.value = false
    currentPosition.value = null
    distanceToHospital.value = null
    formattedDistance.value = ''
    estimatedEtaMins.value = null
    trackingStatus.value = 'idle'
    trackingError.value = null
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
    markArrived,
    getStoredTrackingSession,
    clearTrackingSession
  }
}
