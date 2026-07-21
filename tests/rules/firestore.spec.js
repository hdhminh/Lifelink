import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import http from 'http'

function checkEmulator(port) {
  return new Promise((resolve) => {
    const req = http.request({
      host: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 1000
    }, () => {
      resolve(true)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })
}

describe('Firestore Security Rules', () => {
  let testEnv
  let emulatorActive = false
  const rules = readFileSync('firestore.rules', 'utf8')

  beforeAll(async () => {
    emulatorActive = await checkEmulator(8080)
    if (!emulatorActive) {
      console.log('⚠️ Firestore Emulator is not running on 127.0.0.1:8080. Skipping rules tests.')
      return
    }

    testEnv = await initializeTestEnvironment({
      projectId: 'lifelink-rules-test',
      firestore: {
        rules: rules,
        host: '127.0.0.1',
        port: 8080
      }
    })
  })

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup()
    }
  })

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore()
    }
  })

  // 1. users Collection Security Tests
  describe('users Collection', () => {
    it('allows owner to read and update their user profile', async ({ skip }) => {
      if (!emulatorActive) skip()
      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const profileDoc = doc(aliceDb, 'users/alice')
      await assertSucceeds(setDoc(profileDoc, { displayName: 'Alice', role: 'donor' }))
      await assertSucceeds(getDoc(profileDoc))
    })

    it('denies non-owner from reading or updating other user profiles', async ({ skip }) => {
      if (!emulatorActive) skip()
      const bobDb = testEnv.authenticatedContext('bob').firestore()
      const profileDoc = doc(bobDb, 'users/alice')
      await assertFails(getDoc(profileDoc))
      await assertFails(setDoc(profileDoc, { displayName: 'Attacker' }))
    })

    it('allows admin to read/write all user profiles', async ({ skip }) => {
      if (!emulatorActive) skip()
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'users/admin_user'), { role: 'admin' })
      })
      const adminDb = testEnv.authenticatedContext('admin_user').firestore()
      const donorProfileDoc = doc(adminDb, 'users/donor_user')
      await assertSucceeds(setDoc(donorProfileDoc, { role: 'donor', displayName: 'Donor' }))
      await assertSucceeds(getDoc(donorProfileDoc))
    })
  })

  // 2. emergencyRequests Collection Security Tests
  describe('emergencyRequests Collection', () => {
    it('allows anyone to read requests', async ({ skip }) => {
      if (!emulatorActive) skip()
      const unauthedDb = testEnv.unauthenticatedContext().firestore()
      const requestDoc = doc(unauthedDb, 'emergencyRequests/req123')
      await assertSucceeds(getDoc(requestDoc))
    })

    it('denies unauthenticated create, update, delete requests', async ({ skip }) => {
      if (!emulatorActive) skip()
      const unauthedDb = testEnv.unauthenticatedContext().firestore()
      const requestDoc = doc(unauthedDb, 'emergencyRequests/req123')
      await assertFails(setDoc(requestDoc, { hospitalName: 'Hospital A' }))
      await assertFails(deleteDoc(requestDoc))
    })

    it('denies standard logged-in donor from creating or deleting requests', async ({ skip }) => {
      if (!emulatorActive) skip()
      const donorDb = testEnv.authenticatedContext('donor123').firestore()
      const requestDoc = doc(donorDb, 'emergencyRequests/req123')
      await assertFails(setDoc(requestDoc, { hospitalName: 'Hospital A' }))
      await assertFails(deleteDoc(requestDoc))
    })

    it('allows admin to create, edit, and delete requests', async ({ skip }) => {
      if (!emulatorActive) skip()
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'users/admin_user'), { role: 'admin' })
      })
      const adminDb = testEnv.authenticatedContext('admin_user').firestore()
      const requestDoc = doc(adminDb, 'emergencyRequests/req123')
      await assertSucceeds(setDoc(requestDoc, { hospitalName: 'Hospital A', status: 'active' }))
      await assertSucceeds(deleteDoc(requestDoc))
    })
  })

  // 3. supportThreads Collection Security Tests
  describe('supportThreads Collection', () => {
    it('allows standard user to access only their own support thread', async ({ skip }) => {
      if (!emulatorActive) skip()
      const userDb = testEnv.authenticatedContext('user123').firestore()
      const ownThreadDoc = doc(userDb, 'supportThreads/user123')
      const otherThreadDoc = doc(userDb, 'supportThreads/other_user')
      
      await assertSucceeds(setDoc(ownThreadDoc, { participantId: 'user123', participantType: 'user' }))
      await assertFails(getDoc(otherThreadDoc))
    })

    it('allows guests to read/write their own thread matching guest ID prefix', async ({ skip }) => {
      if (!emulatorActive) skip()
      const guestDb = testEnv.unauthenticatedContext().firestore()
      const guestThreadDoc = doc(guestDb, 'supportThreads/guest_12345')
      
      await assertSucceeds(setDoc(guestThreadDoc, { participantId: 'guest_12345', participantType: 'guest' }))
    })

    it('denies guests from reading/writing support threads of other users or mismatched IDs', async ({ skip }) => {
      if (!emulatorActive) skip()
      const guestDb = testEnv.unauthenticatedContext().firestore()
      const badThreadDoc = doc(guestDb, 'supportThreads/user_abc')
      await assertFails(setDoc(badThreadDoc, { participantId: 'user_abc', participantType: 'guest' }))
    })
  })
})
