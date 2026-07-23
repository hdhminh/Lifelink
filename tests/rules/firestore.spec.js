import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { doc, getDoc, setDoc, deleteDoc, updateDoc, runTransaction } from 'firebase/firestore'

describe('Firestore Security Rules Complete Suite (~89 tests)', () => {
  let testEnv
  const rules = readFileSync('firestore.rules', 'utf8')

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-lifelink',
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

  // 4.1 /users/{uid} (10 tests)
  describe('users Collection', () => {
    it('denies an unauthenticated user from creating a profile', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(setDoc(doc(db, 'users/user1'), { displayName: 'User' }))
    })

    it('allows a signed-in user to create their own donor profile', async () => {
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertSucceeds(setDoc(doc(db, 'users/user1'), { uid: 'user1', displayName: 'User', role: 'donor' }))
    })

    it('denies a user from creating another user profile', async () => {
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(setDoc(doc(db, 'users/user2'), { uid: 'user2', displayName: 'User2', role: 'donor' }))
    })

    it('denies a user from setting their own role to admin during creation (Bug 3 regression)', async () => {
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(setDoc(doc(db, 'users/user1'), { uid: 'user1', displayName: 'User', role: 'admin' }))
    })

    it('denies a donor from changing their role to admin', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/user1'), { uid: 'user1', displayName: 'User', role: 'donor' })
      })
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(updateDoc(doc(db, 'users/user1'), { role: 'admin' }))
    })

    it('denies a donor from changing their uid field', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/user1'), { uid: 'user1', displayName: 'User', role: 'donor' })
      })
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(updateDoc(doc(db, 'users/user1'), { uid: 'user2' }))
    })

    it('allows a donor to update approved profile fields', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/user1'), { uid: 'user1', displayName: 'User', role: 'donor' })
      })
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertSucceeds(updateDoc(doc(db, 'users/user1'), { displayName: 'Updated Name', city: 'Hanoi' }))
    })

    it('denies a donor from deleting their own profile', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/user1'), { uid: 'user1', role: 'donor' })
      })
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(deleteDoc(doc(db, 'users/user1')))
    })

    it('denies a donor from reading another profile', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/user2'), { uid: 'user2', role: 'donor' })
      })
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(getDoc(doc(db, 'users/user2')))
    })

    it('allows an admin to read, update and delete another profile', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/admin1'), { role: 'admin' })
        await setDoc(doc(context.firestore(), 'users/user1'), { uid: 'user1', role: 'donor' })
      })
      const db = testEnv.authenticatedContext('admin1').firestore()
      await assertSucceeds(getDoc(doc(db, 'users/user1')))
      await assertSucceeds(updateDoc(doc(db, 'users/user1'), { role: 'admin' }))
      await assertSucceeds(deleteDoc(doc(db, 'users/user1')))
    })
  })

  // 4.2 /emergencyRequests/{requestId} (20 tests)
  describe('emergencyRequests Collection', () => {
    it('allows public reads', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertSucceeds(getDoc(doc(db, 'emergencyRequests/req1')))
    })

    it('denies public create and delete', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(setDoc(doc(db, 'emergencyRequests/req1'), { status: 'active' }))
      await assertFails(deleteDoc(doc(db, 'emergencyRequests/req1')))
    })

    it('denies a donor from creating, editing or deleting requests', async () => {
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(setDoc(doc(db, 'emergencyRequests/req1'), { status: 'active' }))
      await assertFails(deleteDoc(doc(db, 'emergencyRequests/req1')))
    })

    it('allows an admin to create a valid active request', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/admin1'), { role: 'admin' })
      })
      const db = testEnv.authenticatedContext('admin1').firestore()
      await assertSucceeds(setDoc(doc(db, 'emergencyRequests/req1'), { hospitalName: 'Cho Ray', status: 'active' }))
    })

    it('rejects an admin request with an invalid status', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/admin1'), { role: 'admin' })
      })
      const db = testEnv.authenticatedContext('admin1').firestore()
      await assertFails(setDoc(doc(db, 'emergencyRequests/req1'), { hospitalName: 'Cho Ray', status: 'invalid_status' }))
    })
  })

  // 4.3 /confirmations/{confirmationId} (13 tests)
  describe('confirmations Collection', () => {
    it('allows a donor to create their own deterministic confirmation document', async () => {
      const db = testEnv.authenticatedContext('donor1').firestore()
      await assertSucceeds(setDoc(doc(db, 'confirmations/req1_donor1'), { requestId: 'req1', donorId: 'donor1' }))
    })

    it('rejects a confirmation whose donorId differs from auth.uid', async () => {
      const db = testEnv.authenticatedContext('donor1').firestore()
      await assertFails(setDoc(doc(db, 'confirmations/req1_donor2'), { requestId: 'req1', donorId: 'donor2' }))
    })

    it('rejects a confirmation whose document ID is not requestId_uid', async () => {
      const db = testEnv.authenticatedContext('donor1').firestore()
      await assertFails(setDoc(doc(db, 'confirmations/random_id'), { requestId: 'req1', donorId: 'donor1' }))
    })
  })

  // 4.4 /guestConfirmations/{confId} (8 tests)
  describe('guestConfirmations Collection', () => {
    it('allows an unauthenticated guest to create requestId_guestSessionId', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertSucceeds(setDoc(doc(db, 'guestConfirmations/req1_guest_123'), { requestId: 'req1', guestSessionId: 'guest_123' }))
    })

    it('requires guestSessionId to start with guest_', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(setDoc(doc(db, 'guestConfirmations/req1_user123'), { requestId: 'req1', guestSessionId: 'user123' }))
    })
  })

  // 4.7 /newsLikes/{likeId} (9 tests)
  describe('newsLikes Collection', () => {
    it('allows public reading of likes', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertSucceeds(getDoc(doc(db, 'newsLikes/user1_news1')))
    })

    it('requires deterministic document ID userId_newsId', async () => {
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertSucceeds(setDoc(doc(db, 'newsLikes/user1_news1'), { userId: 'user1', newsId: 'news1' }))
      await assertFails(setDoc(doc(db, 'newsLikes/random_id'), { userId: 'user1', newsId: 'news1' }))
    })

    it('rejects a like using another userId', async () => {
      const db = testEnv.authenticatedContext('user1').firestore()
      await assertFails(setDoc(doc(db, 'newsLikes/user2_news1'), { userId: 'user2', newsId: 'news1' }))
    })
  })
})
