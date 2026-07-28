/**
 * Authenticated session timeout monitor.
 * Admin sessions expire faster than donor sessions and both enforce idle plus absolute limits.
 */

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useLocationTracking } from '@/composables/useLocationTracking.js'
import { useToast } from '@/composables/useToast.js'
import {
  clearAuthenticatedSession,
  markAuthenticatedSession,
  readAuthenticatedSession,
  writeAuthenticatedSession
} from '@/utils/authSessionStorage.js'

const WARNING_BEFORE_MS = 60 * 1000

const SESSION_LIMITS = {
  admin: {
    idleMs: 30 * 60 * 1000,
    absoluteMs: 8 * 60 * 60 * 1000
  },
  donor: {
    idleMs: 2 * 60 * 60 * 1000,
    absoluteMs: 12 * 60 * 60 * 1000
  }
}

const warningVisible = ref(false)
let initialized = false
let monitorTimer = null
let activityThrottleTimer = null
let warningShownForDeadline = 0

function getRole(userProfile) {
  return userProfile?.role === 'admin' ? 'admin' : 'donor'
}

export function useSessionTimeout() {
  const router = useRouter()
  const { user, userProfile, authLoading, logout } = useAuth()
  const { stopTracking } = useLocationTracking()
  const { showToast } = useToast()

  const activeLimits = computed(() => SESSION_LIMITS[getRole(userProfile.value)])

  function syncSessionMetaWithAuth() {
    if (typeof window === 'undefined' || authLoading.value) return

    if (!user.value) {
      clearAuthenticatedSession()
      warningVisible.value = false
      warningShownForDeadline = 0
      return
    }

    const now = Date.now()
    const role = getRole(userProfile.value)
    const current = readAuthenticatedSession()

    if (!current?.loginAt || !current?.lastActivityAt) {
      markAuthenticatedSession(role)
      return
    }

    if (current.role !== role) {
      writeAuthenticatedSession({
        ...current,
        role
      })
    }
  }

  function recordActivity() {
    if (typeof window === 'undefined' || !user.value) return
    if (activityThrottleTimer) return

    activityThrottleTimer = window.setTimeout(() => {
      activityThrottleTimer = null
    }, 1000)

    const current = readAuthenticatedSession()
    if (!current?.loginAt) return

    writeAuthenticatedSession({
      ...current,
      role: getRole(userProfile.value),
      lastActivityAt: Date.now()
    })
    warningVisible.value = false
  }

  async function expireSession(reason) {
    if (!user.value) return

    try {
      stopTracking()
      clearAuthenticatedSession()
      warningVisible.value = false
      await logout()
      showToast(
        reason === 'absolute'
          ? 'Your session expired. Please sign in again.'
          : 'You were signed out after being inactive.',
        'warning'
      )
      router.push({ name: 'Login' })
    } catch (err) {
      console.error('[useSessionTimeout] Could not expire session:', err)
    }
  }

  function checkSession() {
    if (typeof window === 'undefined' || authLoading.value || !user.value) return

    const meta = readAuthenticatedSession()
    if (!meta?.loginAt || !meta?.lastActivityAt) {
      syncSessionMetaWithAuth()
      return
    }

    const now = Date.now()
    const limits = activeLimits.value
    const idleDeadline = meta.lastActivityAt + limits.idleMs
    const absoluteDeadline = meta.loginAt + limits.absoluteMs
    const deadline = Math.min(idleDeadline, absoluteDeadline)
    const reason = absoluteDeadline <= idleDeadline ? 'absolute' : 'idle'
    const remaining = deadline - now

    if (remaining <= 0) {
      expireSession(reason)
      return
    }

    if (remaining <= WARNING_BEFORE_MS && warningShownForDeadline !== deadline) {
      warningVisible.value = true
      warningShownForDeadline = deadline
      showToast('Session expiring in about 1 minute. Keep using the app to stay signed in.', 'warning')
    }
  }

  function startSessionMonitor() {
    if (initialized || typeof window === 'undefined') return
    initialized = true

    syncSessionMetaWithAuth()
    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true })
    })

    monitorTimer = window.setInterval(checkSession, 15 * 1000)
    checkSession()
  }

  function stopSessionMonitor() {
    if (typeof window === 'undefined') return
    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, recordActivity)
    })
    if (monitorTimer) {
      window.clearInterval(monitorTimer)
      monitorTimer = null
    }
    if (activityThrottleTimer) {
      window.clearTimeout(activityThrottleTimer)
      activityThrottleTimer = null
    }
    initialized = false
  }

  watch([user, userProfile, authLoading], syncSessionMetaWithAuth, { immediate: true })

  return {
    warningVisible,
    startSessionMonitor,
    stopSessionMonitor,
    recordActivity,
    checkSession
  }
}
