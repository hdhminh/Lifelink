import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { HOSPITAL_DATABASE, EVENT_VENUES_DATABASE } from '../src/data/hospitalCoordinates.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const NUM_USERS = 1000

// Blood types and their approximate distribution
const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
const BLOOD_WEIGHTS = [45, 30, 15, 5, 2, 1.5, 1, 0.5] // % distribution approx

function getRandomBloodType() {
  const rand = Math.random() * 100
  let sum = 0
  for (let i = 0; i < BLOOD_TYPES.length; i++) {
    sum += BLOOD_WEIGHTS[i]
    if (rand <= sum) return BLOOD_TYPES[i]
  }
  return 'O+'
}

// Names
const FIRST_NAMES = [
  'Nguyen',
  'Tran',
  'Le',
  'Pham',
  'Hoang',
  'Huynh',
  'Phan',
  'Vu',
  'Vo',
  'Dang',
  'Bui',
  'Do',
  'Ho',
  'Ngo',
  'Duong',
  'Ly'
]
const MIDDLE_NAMES = [
  'Van',
  'Thi',
  'Huu',
  'Thanh',
  'Ngoc',
  'Minh',
  'Tuan',
  'Quang',
  'Duc',
  'Hoang',
  'Xuan',
  'Thu'
]
const LAST_NAMES = [
  'Anh',
  'Binh',
  'Chau',
  'Dung',
  'Em',
  'Giang',
  'Hai',
  'Linh',
  'Minh',
  'Nga',
  'Phuc',
  'Quang',
  'Son',
  'Tuan',
  'Vy',
  'Yen',
  'Nam',
  'Hoa',
  'Thao'
]

function getRandomName() {
  const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const m = MIDDLE_NAMES[Math.floor(Math.random() * MIDDLE_NAMES.length)]
  const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  return `${f} ${m} ${l}`
}

// Cities and centers
// 50% HCMC, 30% Hanoi, 10% Da Nang, 10% Can Tho
const CITIES = [
  { name: 'Ho Chi Minh City', weight: 50 },
  { name: 'Ha Noi', weight: 30 },
  { name: 'Da Nang', weight: 10 },
  { name: 'Can Tho', weight: 10 }
]

function getRandomLocation() {
  const rand = Math.random() * 100
  let sum = 0
  let selectedCityName = 'Ho Chi Minh City'
  for (const city of CITIES) {
    sum += city.weight
    if (rand <= sum) {
      selectedCityName = city.name
      break
    }
  }

  const allLocations = [...HOSPITAL_DATABASE, ...EVENT_VENUES_DATABASE]
  const cityLocations = allLocations.filter((l) => l.city === selectedCityName)
  const baseHospital =
    cityLocations.length > 0
      ? cityLocations[Math.floor(Math.random() * cityLocations.length)]
      : allLocations[0]

  // Spread donors out ~1km (0.01 degrees)
  const angle = Math.random() * Math.PI * 2
  // We use a slightly constrained distance for FV Hospital (near river) to avoid water
  const maxDist = baseHospital.name.includes('FV Hospital') ? 0.003 : 0.01
  const distance = Math.random() * maxDist
  const latOffset = Math.sin(angle) * distance
  const lngOffset = Math.cos(angle) * distance

  return {
    city: selectedCityName === 'Ha Noi' ? 'Hanoi' : selectedCityName,
    lat: baseHospital.lat + latOffset,
    lng: baseHospital.lng + lngOffset
  }
}

// Cooldown logic: 85% ready (last donation > 56 days ago or null), 15% short cooldown (30-55 days ago)
function getRandomCooldown() {
  const isReady = Math.random() < 0.85
  const now = new Date()
  let lastDonationDate = null

  if (isReady) {
    // 50% never donated, 50% donated > 56 days ago
    if (Math.random() < 0.5) {
      const daysAgo = 57 + Math.floor(Math.random() * 200)
      lastDonationDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    }
  } else {
    // Short cooldown (30-55 days ago)
    const daysAgo = 30 + Math.floor(Math.random() * 26)
    lastDonationDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  }

  return {
    canDonateNow: isReady,
    lastDonationDate: lastDonationDate ? lastDonationDate.toISOString() : null
  }
}

function removeAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

function getRandomEmail(name) {
  const clean = removeAccents(name.toLowerCase()).replace(/[^a-z]/g, '')
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const num = Math.floor(Math.random() * 99)
  return `${clean}${num > 0 ? num : ''}@${domain}`
}

function getRandomPhone() {
  const prefixes = ['090', '091', '093', '097', '098', '039', '077', '085']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = String(Math.floor(1000000 + Math.random() * 9000000))
  return `${prefix}${suffix}`
}

const mockDonors = []

for (let i = 0; i < NUM_USERS; i++) {
  const loc = getRandomLocation()
  const cooldown = getRandomCooldown()
  const name = getRandomName()

  mockDonors.push({
    id: `mock_${String(i).padStart(4, '0')}`,
    displayName: name,
    email: getRandomEmail(name),
    bloodType: getRandomBloodType(),
    phoneNumber: getRandomPhone(),
    city: loc.city,
    lat: loc.lat,
    lng: loc.lng,
    canDonateNow: cooldown.canDonateNow,
    lastDonationDate: cooldown.lastDonationDate
  })
}

const outPath = path.join(__dirname, '..', 'src', 'data', 'mockDonors.json')
fs.writeFileSync(outPath, JSON.stringify(mockDonors, null, 2))
console.log(`Successfully generated ${NUM_USERS} mock donors to ${outPath}`)
