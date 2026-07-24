/**
 * seeder.js
 *
 * Seed data utility for LifeLink. Checks if 'requests' or 'events'
 * collections are empty, and seeds them with realistic data.
 * Safe to run as it checks for existence first.
 */

import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { getHospitalCoordinates } from '@/data/hospitalCoordinates.js'


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
          confirmedCount: 1,
          status: 'active',
          description: 'A patient in emergency surgery after a severe traffic accident requires immediate O negative blood transfusion.',
          contactInfo: '0989123456',
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
          contactInfo: '0912345678',
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
          contactInfo: '0939123456',
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
          contactInfo: '0909123456',
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
          contactInfo: '0905123456',
          createdAt: serverTimestamp()
        },
        {
          hospitalName: 'Viet Duc Hospital',
          city: 'Ha Noi',
          bloodType: 'A+',
          urgency: 'critical',
          unitsNeeded: 4,
          confirmedCount: 1,
          status: 'active',
          description: 'Emergency brain surgery patient requires urgent A positive blood transfusion.',
          contactInfo: '0944123456',
          createdAt: serverTimestamp()
        },
        {
          hospitalName: 'Binh Duong General Hospital',
          city: 'Binh Duong',
          bloodType: 'B-',
          urgency: 'urgent',
          unitsNeeded: 3,
          confirmedCount: 0,
          status: 'active',
          description: 'Severe anemia patient needs matching B negative blood transfusion immediately.',
          contactInfo: '0988123456',
          createdAt: serverTimestamp()
        },
        {
          hospitalName: 'Gia Dinh People Hospital',
          city: 'Ho Chi Minh City',
          bloodType: 'O-',
          urgency: 'critical',
          unitsNeeded: 2,
          confirmedCount: 0,
          status: 'active',
          description: 'Gastrointestinal bleeding patient requires urgent O negative blood units.',
          contactInfo: '0977123456',
          createdAt: serverTimestamp()
        }
      ]

      seedRequests.forEach(req => {
        const coords = getHospitalCoordinates(req.hospitalName, req.city)
        const newDocRef = doc(collection(db, 'emergencyRequests'))
        batch.set(newDocRef, {
          ...req,
          latitude: coords.lat,
          longitude: coords.lng
        })
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
          title: '"Red Highlands" Blood Donation Festival — Dak Lak',
          date: '2026-07-02',
          city: 'Buon Ma Thuot',
          category: 'Campaign',
          location: 'Dak Lak Provincial Cultural Center',
          description: 'Regional blood donation festival under the national Red Journey 2026 campaign to address summer shortages.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Ancestral Land Pink Drop" Drive — Phu Tho',
          date: '2026-07-10',
          city: 'Viet Tri',
          category: 'Drive',
          location: 'Phu Tho Provincial Sports Stadium',
          description: 'Voluntary blood collection festival organized in collaboration with the provincial Red Cross and NIHBT.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Da River Pink Drop" Festival — Hoa Binh',
          date: '2026-07-15',
          city: 'Hoa Binh',
          category: 'Drive',
          location: 'Hoa Binh Provincial Cultural Palace',
          description: 'Annual community blood donation drive in Hoa Binh province supporting the national Red Journey campaign.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Lang Land Pink Drop" Festival — Lang Son',
          date: '2026-07-22',
          city: 'Lang Son',
          category: 'Campaign',
          location: 'Lang Son Provincial Convention Center',
          description: 'Humanitarian blood drive and public awareness campaign on voluntary blood donation and Thalassemia in Lang Son.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Alluvial Pink Drop" Drive — Can Tho',
          date: '2026-07-28',
          city: 'Can Tho',
          category: 'Drive',
          location: 'Luu Huu Phuoc Park Can Tho',
          description: 'The largest blood donation festival in the Mekong Delta region, marking the concluding leg of Red Journey 2026.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Youth Blood Drive" Campaign — Binh Duong',
          date: '2026-08-05',
          city: 'Binh Duong',
          category: 'Campaign',
          location: 'Binh Duong Youth Center',
          description: 'Youth-led community blood donation drive focusing on young donors and first-time participants.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Green Summer Donation" Drive — Dong Nai',
          date: '2026-08-12',
          city: 'Bien Hoa',
          category: 'Drive',
          location: 'Dong Nai Children House',
          description: 'Annual summer campaign collecting blood units from local workers and college students in Bien Hoa.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Coastal Pink Drop" Festival — Khanh Hoa',
          date: '2026-08-19',
          city: 'Nha Trang',
          category: 'Campaign',
          location: 'Nha Trang Youth Center',
          description: 'Humanitarian blood festival gathering blood units for pediatric clinics and general hospitals.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Capital Heart Donation" Campaign — Ha Noi',
          date: '2026-09-02',
          city: 'Ha Noi',
          category: 'Campaign',
          location: 'Hanoi Medical University',
          description: 'Large-scale National Day campaign coordinating volunteers and students across Thang Long area.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Red River Delta Drive" — Hai Phong',
          date: '2026-09-10',
          city: 'Hai Phong',
          category: 'Drive',
          location: 'Hai Phong Sports Stadium',
          description: 'Joint voluntary blood donation campaign organized with local universities and industrial zones.',
          interestedCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        },
        {
          title: '"Central Coast Blood Drive" — Hue',
          date: '2026-09-20',
          city: 'Hue',
          category: 'Drive',
          location: 'Hue Cultural Palace',
          description: 'Community blood donation drive to establish safety reserves for local Thua Thien Hue clinics.',
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
