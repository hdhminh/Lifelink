/**
 * seeder.js
 *
 * Seed data utility for LifeLink. Checks if 'requests' or 'events'
 * collections are empty, and seeds them with realistic data.
 * Safe to run as it checks for existence first.
 */

import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase.js'

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed Emergency Requests if empty
    const reqSnap = await getDocs(collection(db, 'emergencyRequests'))
    if (reqSnap.empty) {
      console.log('[Seeder] Emergency requests collection is empty. Seeding...')
      const batch = writeBatch(db)
      const seedRequests = [
        {
          hospitalName: 'Cho Ray Hospital',
          city: 'Ho Chi Minh City',
          bloodType: 'O-',
          urgency: 'critical',
          unitsNeeded: 5,
          confirmedCount: 0,
          status: 'active',
          description: 'A patient in emergency surgery after a severe traffic accident requires immediate O negative blood transfusion.',
          contactInfo: 'Contact blood bank at Ext. 4031',
          createdAt: serverTimestamp()
        },
        {
          hospitalName: 'Bach Mai Hospital',
          city: 'Ha Noi',
          bloodType: 'AB+',
          urgency: 'urgent',
          unitsNeeded: 3,
          confirmedCount: 1,
          status: 'active',
          description: 'A patient undergoing complex cardiac bypass surgery needs AB positive blood.',
          contactInfo: 'Contact blood bank at Ext. 2933',
          createdAt: serverTimestamp()
        },
        {
          hospitalName: 'Da Nang General Hospital',
          city: 'Da Nang',
          bloodType: 'B+',
          urgency: 'moderate',
          unitsNeeded: 2,
          confirmedCount: 0,
          status: 'active',
          description: 'Scheduled orthopedic procedure requires backup B positive blood units.',
          contactInfo: 'Contact blood bank at Ext. 1022',
          createdAt: serverTimestamp()
        },
        {
          hospitalName: 'Hue Central Hospital',
          city: 'Hue',
          bloodType: 'A-',
          urgency: 'urgent',
          unitsNeeded: 4,
          confirmedCount: 2,
          status: 'active',
          description: 'Pediatric leukemia patient requires A negative platelets/blood units.',
          contactInfo: 'Contact blood bank at Ext. 8839',
          createdAt: serverTimestamp()
        },
        {
          hospitalName: 'Can Tho General Hospital',
          city: 'Can Tho',
          bloodType: 'O+',
          urgency: 'moderate',
          unitsNeeded: 3,
          confirmedCount: 0,
          status: 'active',
          description: 'Maternal ward requires O positive blood for postpartum hemorrhage backup.',
          contactInfo: 'Contact blood bank at Ext. 3021',
          createdAt: serverTimestamp()
        }
      ]

      seedRequests.forEach(req => {
        const newDocRef = doc(collection(db, 'emergencyRequests'))
        batch.set(newDocRef, req)
      })
      await batch.commit()
      console.log('[Seeder] Successfully seeded emergency requests.')
    }

    // 2. Seed Donation Events if empty
    const evtSnap = await getDocs(collection(db, 'events'))
    if (evtSnap.empty) {
      console.log('[Seeder] Events collection is empty. Seeding...')
      const batch = writeBatch(db)
      const seedEvents = [
        {
          title: 'Red Journey 2026 — Opening Ceremony & Blood Drive',
          date: '2026-06-11',
          city: 'Ho Chi Minh City',
          category: 'Campaign',
          location: 'Youth Cultural Center HCMC',
          description: 'National launch of the 14th edition of the Red Journey voluntary blood donation campaign and opening drive.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Red Highlands" Blood Donation Festival — Đắk Lắk',
          date: '2026-07-02',
          city: 'Buon Ma Thuot',
          category: 'Campaign',
          location: 'Đắk Lắk Provincial Cultural Center',
          description: 'Regional blood donation festival under the national Red Journey 2026 campaign to address summer shortages.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Ancestral Land Pink Drop" Drive — Phú Thọ',
          date: '2026-07-10',
          city: 'Viet Tri',
          category: 'Drive',
          location: 'Phú Thọ Provincial Sports Stadium',
          description: 'Voluntary blood collection festival organized in collaboration with the provincial Red Cross and NIHBT.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Da River Pink Drop" Festival — Hòa Bình',
          date: '2026-07-15',
          city: 'Hoa Binh',
          category: 'Drive',
          location: 'Hòa Bình Provincial Cultural Palace',
          description: 'Annual community blood donation drive in Hoa Binh province supporting the national Red Journey campaign.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Lạng Land Pink Drop" Festival — Lạng Sơn',
          date: '2026-07-22',
          city: 'Lang Son',
          category: 'Campaign',
          location: 'Lạng Sơn Provincial Convention Center',
          description: 'Humanitarian blood drive and public awareness campaign on voluntary blood donation and Thalassemia in Lang Son.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Alluvial Pink Drop" Drive — Cần Thơ',
          date: '2026-07-28',
          city: 'Can Tho',
          category: 'Drive',
          location: 'Lưu Hữu Phước Park Cần Thơ',
          description: 'The largest blood donation festival in the Mekong Delta region, marking the concluding leg of Red Journey 2026.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        }
      ]

      seedEvents.forEach(evt => {
        const newDocRef = doc(collection(db, 'events'))
        batch.set(newDocRef, evt)
      })
      await batch.commit()
      console.log('[Seeder] Successfully seeded events.')
    }
  } catch (err) {
    console.error('[Seeder] Error during database seeding:', err)
  }
}
