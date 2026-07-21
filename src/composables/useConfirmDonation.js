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
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'

function getConfirmationId(requestId, donorId) {
  return `${requestId}_${donorId}`
}

function getGuestConfirmationId(requestId, guestSessionId) {
  return `${requestId}_${guestSessionId}`
}

export function useConfirmDonation() {
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)

  async function hasConfirmed(requestId, donorId) {
    const confirmationRef = doc(db, 'confirmations', getConfirmationId(requestId, donorId))
    const snap = await getDoc(confirmationRef)
    return snap.exists()
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
        if (confirmationSnap.exists()) {
          throw new Error('You have already confirmed availability for this request.')
        }
        if (donorSnap.exists()) {
          const donorProfileData = donorSnap.data()
          const lastDonationDate = donorProfileData.lastDonationDate
          if (lastDonationDate) {
            const lastDate = lastDonationDate.toDate ? lastDonationDate.toDate() : new Date(lastDonationDate)
            const DONATION_COOLDOWN_DAYS = 56
            const COOLDOWN_MS = DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
            if (Date.now() - lastDate.getTime() < COOLDOWN_MS) {
              throw new Error('Eligibility cooldown active. You cannot confirm availability at this time.')
            }
          }
        }

        const requestData = requestSnap.data()
        if (!canDonateTo(donorData.bloodType, requestData.bloodType)) {
          throw new Error(`Incompatible blood types: Donor ${donorData.bloodType} cannot donate to Recipient ${requestData.bloodType}.`)
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
          createdAt: serverTimestamp()
        })

        transaction.update(requestRef, {
          confirmedCount: currentCount + 1,
          lastConfirmedAt: serverTimestamp(),
          lastConfirmedBy: donorData.donorId,
          updatedAt: serverTimestamp()
        })
      })

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
        if (guestConfirmationSnap.exists()) {
          throw new Error('This guest session has already confirmed this request.')
        }

        const requestData = requestSnap.data()
        if (!canDonateTo(guestData.bloodType || 'Any', requestData.bloodType)) {
          throw new Error(`Incompatible blood types: Guest donor type ${guestData.bloodType || 'Any'} cannot donate to Recipient ${requestData.bloodType}.`)
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
          hospitalName: requestData.hospitalName || 'Unknown Hospital',
          city: requestData.city || '',
          urgency: requestData.urgency || 'moderate',
          status: 'confirmed',
          createdAt: serverTimestamp()
        })

        transaction.update(requestRef, {
          confirmedCount: currentCount + 1,
          lastConfirmedAt: serverTimestamp(),
          lastConfirmedBy: guestData.guestSessionId,
          updatedAt: serverTimestamp()
        })
      })

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

      await runTransaction(db, async (transaction) => {
        const [requestSnap, confirmationSnap] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(confirmationRef)
        ])

        if (!confirmationSnap.exists()) {
          throw new Error('Confirmation no longer exists.')
        }

        if (requestSnap.exists()) {
          const reqData = requestSnap.data()
          const confData = confirmationSnap.data()
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

        transaction.delete(confirmationRef)
      })
      success.value = true
    } catch (err) {
      error.value = err.message
      console.error('[useConfirmDonation] cancelConfirmation error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateConfirmationStatus(confirmationId, newStatus) {
    loading.value = true
    error.value = null
    success.value = false
    try {
      const confirmationRef = doc(db, 'confirmations', confirmationId)
      const confSnap = await getDoc(confirmationRef)
      if (!confSnap.exists()) {
        throw new Error('Confirmation record not found.')
      }
      const confData = confSnap.data()
      const oldStatus = confData.status || 'confirmed'
      const requestRef = doc(db, 'emergencyRequests', confData.requestId)
      
      await runTransaction(db, async (transaction) => {
        // 1. Perform reads first
        const requestSnap = await transaction.get(requestRef)

        // 2. Perform writes second
        transaction.update(confirmationRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        })
        
        if (newStatus === 'completed' && confData.donorId) {
          const donorRef = doc(db, 'users', confData.donorId)
          transaction.update(donorRef, {
            lastDonationDate: serverTimestamp()
          })
        }

        if (requestSnap.exists()) {
          const reqData = requestSnap.data()
          const updates = {}
          
          // Decrement old status count
          if (oldStatus === 'arrived') {
            updates.arrivedCount = Math.max(0, (reqData.arrivedCount || 0) - 1)
          } else if (oldStatus === 'donated') {
            updates.donatedCount = Math.max(0, (reqData.donatedCount || 0) - 1)
          } else if (oldStatus === 'completed') {
            updates.completedCount = Math.max(0, (reqData.completedCount || 0) - 1)
          }
          
          // Increment new status count
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
    updateConfirmationStatus
  }
}
