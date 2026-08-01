/**
 * useConfirmDonation.js
 *
 * Handles donor and guest confirmations with deterministic ids so
 * confirmedCount cannot drift from confirmation records.
 */

import { ref } from 'vue'
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import {
  ref as rtdbRef,
  get as rtdbGet,
  remove as rtdbRemove,
  update as rtdbUpdate
} from 'firebase/database'
import { db, rtdb } from '@/firebase.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'
import { COOLDOWN_MS } from '@/composables/useEligibility.js'
import { useNotificationCenter } from '@/composables/useNotificationCenter.js'

function getConfirmationId(requestId, donorId) {
  return `${requestId}_${donorId}`
}

function getGuestConfirmationId(requestId, guestSessionId) {
  return `${requestId}_${guestSessionId}`
}

async function removeLiveTrackingForConfirmation(requestId, donorId) {
  if (!rtdb || !requestId || !donorId) return

  const expectedTrackingKey = getConfirmationId(requestId, donorId)
  const expectedTrackingRef = rtdbRef(rtdb, `liveTracking/${expectedTrackingKey}`)

  try {
    await rtdbRemove(expectedTrackingRef)
  } catch (err) {
    console.warn('[useConfirmDonation] exact liveTracking cleanup warning:', err)
  }

  try {
    const liveTrackingRef = rtdbRef(rtdb, 'liveTracking')
    const snap = await rtdbGet(liveTrackingRef)
    if (!snap.exists()) return

    const updates = {}
    snap.forEach((child) => {
      const val = child.val()
      if (
        val &&
        String(val.requestId) === String(requestId) &&
        String(val.donorId) === String(donorId)
      ) {
        updates[child.key] = null
      }
    })

    if (Object.keys(updates).length > 0) {
      await rtdbUpdate(liveTrackingRef, updates)
    }
  } catch (err) {
    console.warn('[useConfirmDonation] liveTracking scan cleanup warning:', err)
  }
}

async function recalculateRequestConfirmedCount(requestId) {
  if (!requestId) return
  try {
    const reqIdStr = String(requestId)
    const q1 = query(collection(db, 'confirmations'), where('requestId', '==', reqIdStr))
    const q2 = query(collection(db, 'guestConfirmations'), where('requestId', '==', reqIdStr))
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
    let activeCount = 0
    snap1.docs.forEach(d => { if (d.data().status !== 'cancelled') activeCount++ })
    snap2.docs.forEach(d => { if (d.data().status !== 'cancelled') activeCount++ })

    await updateDoc(doc(db, 'emergencyRequests', reqIdStr), {
      confirmedCount: activeCount,
      updatedAt: serverTimestamp()
    })
  } catch (err) {
    console.warn('[useConfirmDonation] recalculateRequestConfirmedCount error:', err)
  }
}

export function useConfirmDonation() {
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)

  async function hasConfirmed(requestId, donorId) {
    const confirmationRef = doc(db, 'confirmations', getConfirmationId(requestId, donorId))
    const snap = await getDoc(confirmationRef)
    const data = typeof snap.data === 'function' ? snap.data() : {}
    return snap.exists() && data?.status !== 'cancelled'
  }

  async function confirmAvailability(requestId, donorData) {
    loading.value = true
    error.value = null
    success.value = false

    try {
      const requestRef = doc(db, 'emergencyRequests', requestId)
      const confirmationId = getConfirmationId(requestId, donorData.donorId)
      const confirmationRef = doc(db, 'confirmations', confirmationId)
      const donorRef = doc(db, 'users', donorData.donorId)

      await runTransaction(db, async (transaction) => {
        const [requestSnap, confirmationSnap, donorSnap] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(confirmationRef),
          transaction.get(donorRef)
        ])

        if (!requestSnap.exists()) {
          throw new Error('This request no longer exists.')
        }
        const existingConfirmationData =
          typeof confirmationSnap.data === 'function' ? confirmationSnap.data() : {}
        if (confirmationSnap.exists() && existingConfirmationData?.status !== 'cancelled') {
          throw new Error('You have already confirmed availability for this request.')
        }
        if (donorSnap.exists()) {
          const donorProfileData = donorSnap.data()
          const lastDonationDate = donorProfileData.lastDonationDate
          if (lastDonationDate) {
            const lastDate = lastDonationDate.toDate
              ? lastDonationDate.toDate()
              : new Date(lastDonationDate)
            if (Date.now() - lastDate.getTime() < COOLDOWN_MS) {
              throw new Error(
                'Eligibility cooldown active. You cannot confirm availability at this time.'
              )
            }
          }
        }

        const requestData = requestSnap.data()
        if (!canDonateTo(donorData.bloodType, requestData.bloodType)) {
          throw new Error(
            `Incompatible blood types: Donor ${donorData.bloodType} cannot donate to Recipient ${requestData.bloodType}.`
          )
        }
        const currentCount = requestData.confirmedCount || 0
        const unitsNeeded = requestData.unitsNeeded || 0
        if (currentCount >= unitsNeeded) {
          throw new Error('This request already has enough confirmed donors.')
        }

        transaction.set(confirmationRef, {
          requestId,
          donorId: donorData.donorId,
          donorName: donorData.donorName,
          donorPhone: donorData.donorPhone || 'N/A',
          bloodType: donorData.bloodType,
          hospitalName: requestData.hospitalName || 'Unknown Hospital',
          city: requestData.city || '',
          urgency: requestData.urgency || 'moderate',
          status: 'confirmed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        transaction.update(requestRef, {
          confirmedCount: currentCount + 1,
          lastConfirmedAt: serverTimestamp(),
          lastConfirmedBy: donorData.donorId,
          updatedAt: serverTimestamp()
        })
      })

      const notifCenter = useNotificationCenter()
      notifCenter.addNotification({
        title: 'New Emergency Confirmation',
        body: `${donorData.donorName} (${donorData.bloodType}) confirmed for emergency request`,
        type: 'success'
      })

      try {
        await addDoc(collection(db, 'notifications'), {
          targetRole: 'admin',
          title: 'New Emergency Donor Confirmation',
          message: `${donorData.donorName} (${donorData.bloodType}) confirmed for emergency request`,
          type: 'new_confirmation',
          requestId: requestId,
          read: false,
          createdAt: serverTimestamp()
        })
      } catch (e) {
        console.warn('[useConfirmDonation] Could not write admin notification:', e)
      }

      success.value = true
      return confirmationId
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] confirmAvailability error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function confirmGuestAvailability(requestId, guestData) {
    loading.value = true
    error.value = null
    success.value = false

    try {
      const requestRef = doc(db, 'emergencyRequests', requestId)
      const confirmationId = getGuestConfirmationId(requestId, guestData.guestSessionId)
      const guestConfirmationRef = doc(db, 'guestConfirmations', confirmationId)

      await runTransaction(db, async (transaction) => {
        const [requestSnap, guestConfirmationSnap] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(guestConfirmationRef)
        ])

        if (!requestSnap.exists()) {
          throw new Error('This request no longer exists.')
        }
        const existingGuestConfirmationData =
          typeof guestConfirmationSnap.data === 'function' ? guestConfirmationSnap.data() : {}
        if (guestConfirmationSnap.exists() && existingGuestConfirmationData?.status !== 'cancelled') {
          throw new Error('This guest session has already confirmed this request.')
        }

        const requestData = requestSnap.data()
        if (!canDonateTo(guestData.bloodType || 'Any', requestData.bloodType)) {
          throw new Error(
            `Incompatible blood types: Guest donor type ${guestData.bloodType || 'Any'} cannot donate to Recipient ${requestData.bloodType}.`
          )
        }
        const currentCount = requestData.confirmedCount || 0
        const unitsNeeded = requestData.unitsNeeded || 0
        if (currentCount >= unitsNeeded) {
          throw new Error('This request already has enough confirmed donors.')
        }

        transaction.set(guestConfirmationRef, {
          requestId,
          guestSessionId: guestData.guestSessionId,
          guestName: guestData.guestName,
          guestPhone: guestData.guestPhone || 'N/A',
          bloodType: guestData.bloodType,
          hospitalName: requestData.hospitalName || 'Unknown Hospital',
          city: requestData.city || '',
          urgency: requestData.urgency || 'moderate',
          status: 'confirmed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        transaction.update(requestRef, {
          confirmedCount: currentCount + 1,
          lastConfirmedAt: serverTimestamp(),
          lastConfirmedBy: guestData.guestSessionId,
          updatedAt: serverTimestamp()
        })
      })

      const notifCenter = useNotificationCenter()
      notifCenter.addNotification({
        title: 'New Guest Confirmation',
        body: `${guestData.donorName || 'Guest'} (${guestData.bloodType}) confirmed for emergency request`,
        type: 'success'
      })

      try {
        await addDoc(collection(db, 'notifications'), {
          targetRole: 'admin',
          title: 'New Emergency Guest Confirmation',
          message: `${guestData.donorName || 'Guest'} (${guestData.bloodType}) confirmed for emergency request`,
          type: 'new_confirmation',
          requestId: requestId,
          read: false,
          createdAt: serverTimestamp()
        })
      } catch (e) {
        console.warn('[useConfirmDonation] Could not write guest admin notification:', e)
      }

      success.value = true
      return confirmationId
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] confirmGuestAvailability error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelConfirmation(confirmationId, requestId) {
    loading.value = true
    error.value = null
    success.value = false
    try {
      const requestRef = doc(db, 'emergencyRequests', requestId)
      const confirmationRef = doc(db, 'confirmations', confirmationId)
      let cancelledConfirmationData = null

      await runTransaction(db, async (transaction) => {
        const [requestSnap, confirmationSnap] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(confirmationRef)
        ])

        if (!confirmationSnap.exists()) {
          throw new Error('Confirmation no longer exists.')
        }

        const confData = confirmationSnap.data()
        cancelledConfirmationData = confData

        if (requestSnap.exists()) {
          const reqData = requestSnap.data()
          const status = confData.status || 'confirmed'
          const currentCount = reqData.confirmedCount || 0
          const updates = {
            confirmedCount: Math.max(0, currentCount - 1),
            updatedAt: serverTimestamp()
          }

          if (status === 'arrived') {
            updates.arrivedCount = Math.max(0, (reqData.arrivedCount || 0) - 1)
          } else if (status === 'donated') {
            updates.donatedCount = Math.max(0, (reqData.donatedCount || 0) - 1)
          } else if (status === 'completed') {
            updates.completedCount = Math.max(0, (reqData.completedCount || 0) - 1)
          }

          transaction.update(requestRef, updates)
        }

        transaction.update(confirmationRef, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      })
      await removeLiveTrackingForConfirmation(requestId, cancelledConfirmationData?.donorId)
      success.value = true
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] cancelConfirmation error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelConfirmationByAdmin(confirmationId, requestId, adminUid, isGuest = false, reason = 'admin_cancelled') {
    loading.value = true
    error.value = null
    success.value = false
    try {
      const requestRef = doc(db, 'emergencyRequests', requestId)
      const collectionName = isGuest ? 'guestConfirmations' : 'confirmations'
      const confirmationRef = doc(db, collectionName, confirmationId)
      let targetDonorId = null

      await runTransaction(db, async (transaction) => {
        const [requestSnap, confirmationSnap] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(confirmationRef)
        ])

        if (!confirmationSnap.exists()) {
          throw new Error('Confirmation not found.')
        }

        const confData = confirmationSnap.data()
        if (confData.status === 'cancelled') return

        targetDonorId = isGuest ? confData.guestSessionId : confData.donorId

        if (requestSnap.exists()) {
          const reqData = requestSnap.data()
          const currentCount = reqData.confirmedCount || 0
          transaction.update(requestRef, {
            confirmedCount: Math.max(0, currentCount - 1),
            updatedAt: serverTimestamp()
          })
        }

        transaction.update(confirmationRef, {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: serverTimestamp(),
          cancelledBy: adminUid || 'admin',
          updatedAt: serverTimestamp()
        })
      })

      if (targetDonorId) {
        await removeLiveTrackingForConfirmation(requestId, targetDonorId)
      }
      success.value = true
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] cancelConfirmationByAdmin error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteConfirmationByAdmin(confirmationId, requestId, isGuest = false) {
    loading.value = true
    error.value = null
    success.value = false
    try {
      const requestRef = doc(db, 'emergencyRequests', requestId)
      const collectionName = isGuest ? 'guestConfirmations' : 'confirmations'
      const confirmationRef = doc(db, collectionName, confirmationId)
      let targetDonorId = null

      await runTransaction(db, async (transaction) => {
        const [requestSnap, confirmationSnap] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(confirmationRef)
        ])

        if (!confirmationSnap.exists()) return

        const confData = confirmationSnap.data()
        const oldStatus = confData.status || 'confirmed'
        targetDonorId = isGuest ? confData.guestSessionId : confData.donorId

        if (requestSnap.exists()) {
          const reqData = requestSnap.data()
          const currentCount = reqData.confirmedCount || 0
          const updates = {
            updatedAt: serverTimestamp()
          }
          if (oldStatus !== 'cancelled') {
            updates.confirmedCount = Math.max(0, currentCount - 1)
          }

          if (oldStatus === 'arrived') {
            updates.arrivedCount = Math.max(0, (reqData.arrivedCount || 0) - 1)
          } else if (oldStatus === 'donated') {
            updates.donatedCount = Math.max(0, (reqData.donatedCount || 0) - 1)
          } else if (oldStatus === 'completed') {
            updates.completedCount = Math.max(0, (reqData.completedCount || 0) - 1)
          }

          transaction.update(requestRef, updates)
        }

        transaction.delete(confirmationRef)
      })

      if (targetDonorId) {
        await removeLiveTrackingForConfirmation(requestId, targetDonorId)
      }
      await recalculateRequestConfirmedCount(requestId)
      success.value = true
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] deleteConfirmationByAdmin error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelConfirmationsForRequest(requestId, adminUid, reason = 'request_cancelled') {
    if (!requestId) return 0
    loading.value = true
    error.value = null
    success.value = false

    try {
      const qUser = query(collection(db, 'confirmations'), where('requestId', '==', requestId))
      const qGuest = query(collection(db, 'guestConfirmations'), where('requestId', '==', requestId))
      const [userSnaps, guestSnaps] = await Promise.all([getDocs(qUser), getDocs(qGuest)])
      const batch = writeBatch(db)
      const trackingTargets = []
      let count = 0

      const queueCancel = (docSnap, isGuest = false) => {
        const data = docSnap.data()
        if (data.status === 'cancelled') return

        const donorKey = isGuest ? data.guestSessionId : data.donorId
        if (donorKey) trackingTargets.push(donorKey)

        batch.update(docSnap.ref, {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: serverTimestamp(),
          cancelledBy: adminUid || 'admin',
          updatedAt: serverTimestamp()
        })
        count += 1
      }

      userSnaps.forEach((docSnap) => queueCancel(docSnap, false))
      guestSnaps.forEach((docSnap) => queueCancel(docSnap, true))

      if (count > 0) {
        await batch.commit()
      }

      await Promise.all(
        trackingTargets.map((donorId) => removeLiveTrackingForConfirmation(requestId, donorId))
      )

      success.value = true
      return count
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] cancelConfirmationsForRequest error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getConfirmationsForRequest(requestId) {
    if (!requestId) return []
    try {
      const qUser = query(
        collection(db, 'confirmations'),
        where('requestId', '==', requestId)
      )
      const qGuest = query(
        collection(db, 'guestConfirmations'),
        where('requestId', '==', requestId)
      )

      const [userSnaps, guestSnaps] = await Promise.all([getDocs(qUser), getDocs(qGuest)])

      const userConfs = userSnaps.docs
        .map((d) => ({ id: d.id, isGuest: false, ...d.data() }))
        .filter((c) => c.status !== 'cancelled')

      const guestConfs = guestSnaps.docs
        .map((d) => ({ id: d.id, isGuest: true, ...d.data() }))
        .filter((c) => c.status !== 'cancelled')

      return [...userConfs, ...guestConfs]
    } catch (err) {
      console.error('[useConfirmDonation] getConfirmationsForRequest error:', err)
      return []
    }
  }

  function watchMyConfirmation(requestId, donorId, onCancelled) {
    if (!requestId || !donorId) return null

    const confId = getConfirmationId(requestId, donorId)
    const confRef = doc(db, 'confirmations', confId)

    return onSnapshot(confRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.status === 'cancelled') {
          if (onCancelled) onCancelled(data)
        }
      }
    })
  }

  async function updateConfirmationStatus(confirmationId, newStatus, isGuest = false) {
    loading.value = true
    error.value = null
    success.value = false
    try {
      const VALID_STATUSES = ['confirmed', 'arrived', 'donated', 'completed', 'cancelled']
      if (!VALID_STATUSES.includes(newStatus)) {
        throw new Error('Invalid confirmation status.')
      }

      const collectionName = isGuest ? 'guestConfirmations' : 'confirmations'
      const confirmationRef = doc(db, collectionName, confirmationId)
      let targetDonorId = null
      let targetReqId = null

      await runTransaction(db, async (transaction) => {
        const confSnap = await transaction.get(confirmationRef)
        if (!confSnap.exists()) {
          throw new Error('Confirmation record not found.')
        }

        const confData = confSnap.data()
        const oldStatus = confData.status || 'confirmed'
        targetReqId = confData.requestId
        targetDonorId = isGuest ? confData.guestSessionId : confData.donorId

        if (oldStatus === newStatus) return

        const requestRef = doc(db, 'emergencyRequests', confData.requestId)
        const requestSnap = await transaction.get(requestRef)

        transaction.update(confirmationRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        })

        if (newStatus === 'completed' && confData.donorId && !isGuest) {
          const donorRef = doc(db, 'users', confData.donorId)
          transaction.update(donorRef, {
            lastDonationDate: serverTimestamp()
          })
        }

        if (requestSnap.exists()) {
          const reqData = requestSnap.data()
          const updates = { updatedAt: serverTimestamp() }

          const currentCount = reqData.confirmedCount || 0
          if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
            updates.confirmedCount = Math.max(0, currentCount - 1)
          } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
            updates.confirmedCount = currentCount + 1
          }

          if (oldStatus === 'arrived') {
            updates.arrivedCount = Math.max(0, (reqData.arrivedCount || 0) - 1)
          } else if (oldStatus === 'donated') {
            updates.donatedCount = Math.max(0, (reqData.donatedCount || 0) - 1)
          } else if (oldStatus === 'completed') {
            updates.completedCount = Math.max(0, (reqData.completedCount || 0) - 1)
          }

          if (newStatus === 'arrived') {
            updates.arrivedCount = (reqData.arrivedCount || 0) + 1
          } else if (newStatus === 'donated') {
            updates.donatedCount = (reqData.donatedCount || 0) + 1
          } else if (newStatus === 'completed') {
            updates.completedCount = (reqData.completedCount || 0) + 1
          }

          if (Object.keys(updates).length > 0) {
            transaction.update(requestRef, updates)
          }
        }
      })

      if (newStatus === 'cancelled' && targetReqId && targetDonorId) {
        await removeLiveTrackingForConfirmation(targetReqId, targetDonorId)

        const notifCenter = useNotificationCenter()
        notifCenter.addNotification({
          title: 'Registration Cancelled',
          body: 'Your donation confirmation has been cancelled by Admin.',
          type: 'warning'
        })

        try {
          await addDoc(collection(db, 'notifications'), {
            userId: targetDonorId,
            title: 'Registration Cancelled',
            message: 'Your donation confirmation has been cancelled by Admin.',
            type: 'cancellation',
            read: false,
            createdAt: serverTimestamp()
          })
        } catch (e) {
          console.warn('[useConfirmDonation] Could not write cancellation notification:', e)
        }
      }

      if (targetReqId) {
        await recalculateRequestConfirmedCount(targetReqId)
      }

      success.value = true
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] updateConfirmationStatus error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    success,
    hasConfirmed,
    confirmAvailability,
    confirmGuestAvailability,
    cancelConfirmation,
    cancelConfirmationByAdmin,
    deleteConfirmationByAdmin,
    cancelConfirmationsForRequest,
    getConfirmationsForRequest,
    watchMyConfirmation,
    updateConfirmationStatus
  }
}
