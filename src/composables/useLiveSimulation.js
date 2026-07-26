import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  deleteDoc,
  increment
} from 'firebase/firestore'
import { ref as dbRef, set } from 'firebase/database'
import { db, rtdb } from '@/firebase.js'
import { HOSPITAL_DATABASE } from '@/data/hospitalCoordinates.js'
import mockDonors from '@/data/mockDonors.json'
import { calculateHaversineDistance } from '@/utils/haversine.js'
import { canDonateTo } from '@/utils/bloodCompatibility.js'

export function useLiveSimulation() {
  const SPAWN_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
  const MAX_ACTIVE_SIMULATED_REQUESTS = 5

  async function initSimulation() {
    try {
      const stateRef = doc(db, 'system', 'demoState')
      const stateSnap = await getDoc(stateRef)
      const now = Date.now()

      let lastSpawnTime = 0
      if (stateSnap.exists()) {
        lastSpawnTime = stateSnap.data().lastSpawnTime || 0
      }

      if (now - lastSpawnTime > SPAWN_INTERVAL_MS) {
        // Decentralized cron: Take ownership and spawn
        await setDoc(stateRef, { lastSpawnTime: now }, { merge: true })
        await cleanupOldSimulations()
        await spawnNewRequests()
      }
    } catch (err) {
      console.error('[Simulation] Error initializing:', err)
    }
  }

  async function cleanupOldSimulations() {
    try {
      // Find old simulated requests
      const q = query(collection(db, 'emergencyRequests'), where('isSimulated', '==', true))
      const snap = await getDocs(q)

      // If there are more than MAX_ACTIVE, delete the oldest
      if (snap.size > MAX_ACTIVE_SIMULATED_REQUESTS) {
        const docs = snap.docs.sort((a, b) => {
          const ta = a.data().createdAt?.toMillis() || 0
          const tb = b.data().createdAt?.toMillis() || 0
          return ta - tb
        })

        const toDelete = docs.slice(0, snap.size - MAX_ACTIVE_SIMULATED_REQUESTS)
        for (const d of toDelete) {
          await deleteDoc(d.ref)
        }
      }
    } catch (err) {
      console.error('[Simulation] Cleanup error:', err)
    }
  }

  async function spawnNewRequests() {
    const numRequests = Math.floor(Math.random() * 3) + 1 // 1 to 3 requests

    for (let i = 0; i < numRequests; i++) {
      const hospital = HOSPITAL_DATABASE[Math.floor(Math.random() * HOSPITAL_DATABASE.length)]
      const bloodTypes = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
      const requiredBlood = bloodTypes[Math.floor(Math.random() * bloodTypes.length)]

      const requestPayload = {
        patientName: `Simulated Patient ${Math.floor(Math.random() * 1000)}`,
        bloodType: requiredBlood,
        unitsNeeded: Math.floor(Math.random() * 3) + 1,
        hospitalName: hospital.name,
        city: hospital.city,
        urgency: Math.random() > 0.5 ? 'critical' : 'moderate',
        contactName: 'Hospital Coordinator',
        contactPhone: '0901234567',
        status: 'active',
        confirmedCount: 0,
        isSimulated: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      try {
        const docRef = await addDoc(collection(db, 'emergencyRequests'), requestPayload)

        // Auto-accept by a random mock donor
        await simulateDonorAcceptance(docRef.id, hospital, requiredBlood)
      } catch (err) {
        console.error('[Simulation] Spawn error:', err)
      }
    }
  }

  async function simulateDonorAcceptance(requestId, hospital, requiredBlood) {
    // Find compatible and ready donors within 10km
    const availableDonors = mockDonors.filter(
      (d) =>
        d.canDonateNow &&
        canDonateTo(d.bloodType, requiredBlood) &&
        calculateHaversineDistance(d.lat, d.lng, hospital.lat, hospital.lng) < 10000
    )

    if (availableDonors.length === 0) return

    // Pick 1 to 2 random donors
    const numDonors = Math.min(availableDonors.length, Math.floor(Math.random() * 2) + 1)

    // Shuffle
    availableDonors.sort(() => 0.5 - Math.random())

    for (let i = 0; i < numDonors; i++) {
      const donor = availableDonors[i]

      const dist = calculateHaversineDistance(donor.lat, donor.lng, hospital.lat, hospital.lng)
      const speedKmH = 30 // Approx urban speed
      const durationHours = dist / 1000 / speedKmH
      const durationMs = durationHours * 60 * 60 * 1000

      const trackingKey = `${requestId}_${donor.id}`
      const trackingRef = dbRef(rtdb, `liveTracking/${trackingKey}`)

      const payload = {
        donorId: donor.id,
        donorName: donor.displayName,
        bloodType: donor.bloodType,
        requestId,
        hospitalName: hospital.name,
        city: hospital.city,
        startLat: donor.lat,
        startLng: donor.lng,
        targetLat: hospital.lat,
        targetLng: hospital.lng,
        startTime: Date.now(),
        durationMs,
        isSimulated: true,
        status: 'en_route'
      }

      await set(trackingRef, payload)

      // Update request confirmedCount atomically to prevent drift
      const reqRef = doc(db, 'emergencyRequests', requestId)
      await setDoc(
        reqRef,
        {
          confirmedCount: increment(1),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    }
  }

  return {
    initSimulation
  }
}
