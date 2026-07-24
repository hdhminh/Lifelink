/**
 * hospitalCoordinates.js
 *
 * Real geographic coordinates (latitude, longitude) for partner clinics, hospitals,
 * event venues, and regional centers across Vietnam.
 */

export const HOSPITAL_DATABASE = [
  // Ho Chi Minh City
  { name: 'Cho Ray Hospital', city: 'Ho Chi Minh City', lat: 10.7548, lng: 106.6601 },
  { name: 'FV Hospital', city: 'Ho Chi Minh City', lat: 10.7296, lng: 106.7222 },
  { name: 'Vinmec Central Park Hospital', city: 'Ho Chi Minh City', lat: 10.7937, lng: 106.7188 },
  { name: 'Gia Dinh People\'s Hospital', city: 'Ho Chi Minh City', lat: 10.8013, lng: 106.6912 },
  { name: 'Gia Dinh People Hospital', city: 'Ho Chi Minh City', lat: 10.8013, lng: 106.6912 },
  { name: 'Blood Transfusion Hematology Hospital', city: 'Ho Chi Minh City', lat: 10.7561, lng: 106.6644 },
  { name: 'University Medical Center HCMC', city: 'Ho Chi Minh City', lat: 10.7556, lng: 106.6619 },
  { name: 'HCMC People\'s Hospital 115', city: 'Ho Chi Minh City', lat: 10.7744, lng: 106.6653 },

  // Ha Noi
  { name: 'Bach Mai Hospital', city: 'Ha Noi', lat: 21.0000, lng: 105.8426 },
  { name: 'Viet Duc Hospital', city: 'Ha Noi', lat: 21.0267, lng: 105.8480 },
  { name: 'Vinmec Times City Hospital', city: 'Ha Noi', lat: 20.9961, lng: 105.8672 },
  { name: 'Vietnam National Children\'s Hospital', city: 'Ha Noi', lat: 21.0239, lng: 105.8117 },
  { name: 'Hanoi French Hospital', city: 'Ha Noi', lat: 20.9997, lng: 105.8406 },
  { name: 'National Institute of Hematology and Blood Transfusion', city: 'Ha Noi', lat: 21.0208, lng: 105.7911 },

  // Binh Duong
  { name: 'Binh Duong General Hospital', city: 'Binh Duong', lat: 10.9805, lng: 106.6519 },

  // Da Nang
  { name: 'Da Nang General Hospital', city: 'Da Nang', lat: 16.0716, lng: 108.2200 },
  { name: 'Vinmec Da Nang Hospital', city: 'Da Nang', lat: 16.0375, lng: 108.2144 },
  { name: 'Da Nang Family Hospital', city: 'Da Nang', lat: 16.0611, lng: 108.2131 },

  // Hue
  { name: 'Hue Central Hospital', city: 'Hue', lat: 16.4637, lng: 107.5909 },

  // Can Tho
  { name: 'Can Tho General Hospital', city: 'Can Tho', lat: 10.0341, lng: 105.7557 },
  { name: 'Can Tho Central General Hospital', city: 'Can Tho', lat: 10.0161, lng: 105.7608 },

  // Hai Phong
  { name: 'Hai Phong International Hospital', city: 'Hai Phong', lat: 20.8544, lng: 106.6778 },
  { name: 'Viet Tiep Friendship Hospital', city: 'Hai Phong', lat: 20.8572, lng: 106.6789 },

  // Nha Trang / Khanh Hoa
  { name: 'Khanh Hoa Province General Hospital', city: 'Nha Trang', lat: 12.2472, lng: 109.1917 },
  { name: 'Vinmec Nha Trang Hospital', city: 'Nha Trang', lat: 12.2153, lng: 109.2081 }
]

export const EVENT_VENUES_DATABASE = [
  { name: 'Youth Cultural Center HCMC', city: 'Ho Chi Minh City', lat: 10.7828, lng: 106.6983 },
  { name: 'Dak Lak Provincial Cultural Center', city: 'Buon Ma Thuot', lat: 12.6667, lng: 108.0500 },
  { name: 'Phu Tho Provincial Sports Stadium', city: 'Viet Tri', lat: 21.3227, lng: 105.4019 },
  { name: 'Hoa Binh Provincial Cultural Palace', city: 'Hoa Binh', lat: 20.8174, lng: 105.3382 },
  { name: 'Lang Son Provincial Convention Center', city: 'Lang Son', lat: 21.8528, lng: 106.7618 },
  { name: 'Luu Huu Phuoc Park Can Tho', city: 'Can Tho', lat: 10.0341, lng: 105.7811 },
  { name: 'Binh Duong Youth Center', city: 'Binh Duong', lat: 10.9805, lng: 106.6519 },
  { name: 'Dong Nai Children House', city: 'Bien Hoa', lat: 10.9458, lng: 106.8247 },
  { name: 'Nha Trang Youth Center', city: 'Nha Trang', lat: 12.2472, lng: 109.1917 },
  { name: 'Hanoi Medical University', city: 'Ha Noi', lat: 21.0031, lng: 105.8294 },
  { name: 'Hai Phong Sports Stadium', city: 'Hai Phong', lat: 20.8544, lng: 106.6778 }
]

const CITY_FALLBACKS = {
  'ho chi minh city': { lat: 10.7548, lng: 106.6601 },
  'tp.hcm': { lat: 10.7548, lng: 106.6601 },
  'tphcm': { lat: 10.7548, lng: 106.6601 },
  'hcmc': { lat: 10.7548, lng: 106.6601 },
  'hcm': { lat: 10.7548, lng: 106.6601 },
  'ho chi minh': { lat: 10.7548, lng: 106.6601 },
  'ha noi': { lat: 21.0285, lng: 105.8542 },
  'hanoi': { lat: 21.0285, lng: 105.8542 },
  'hà nội': { lat: 21.0285, lng: 105.8542 },
  'lang son': { lat: 21.8528, lng: 106.7618 },
  'lạng sơn': { lat: 21.8528, lng: 106.7618 },
  'binh duong': { lat: 10.9805, lng: 106.6519 },
  'bình dương': { lat: 10.9805, lng: 106.6519 },
  'da nang': { lat: 16.0716, lng: 108.2200 },
  'đà nẵng': { lat: 16.0716, lng: 108.2200 },
  'hue': { lat: 16.4637, lng: 107.5909 },
  'thừa thiên huế': { lat: 16.4637, lng: 107.5909 },
  'can tho': { lat: 10.0341, lng: 105.7557 },
  'cần thơ': { lat: 10.0341, lng: 105.7557 },
  'hai phong': { lat: 20.8544, lng: 106.6778 },
  'hải phòng': { lat: 20.8544, lng: 106.6778 },
  'nha trang': { lat: 12.2472, lng: 109.1917 },
  'khanh hoa': { lat: 12.2472, lng: 109.1917 },
  'khánh hòa': { lat: 12.2472, lng: 109.1917 },
  'quang ninh': { lat: 20.9599, lng: 107.0434 },
  'quảng ninh': { lat: 20.9599, lng: 107.0434 },
  'ha long': { lat: 20.9599, lng: 107.0434 },
  'hạ long': { lat: 20.9599, lng: 107.0434 },
  'lam dong': { lat: 11.9404, lng: 108.4583 },
  'lâm đồng': { lat: 11.9404, lng: 108.4583 },
  'da lat': { lat: 11.9404, lng: 108.4583 },
  'đà lạt': { lat: 11.9404, lng: 108.4583 },
  'vung tau': { lat: 10.3460, lng: 107.0843 },
  'vũng tàu': { lat: 10.3460, lng: 107.0843 },
  'ba ria - vung tau': { lat: 10.3460, lng: 107.0843 },
  'bà rịa - vũng tàu': { lat: 10.3460, lng: 107.0843 },
  'nghe an': { lat: 18.6734, lng: 105.6813 },
  'nghệ an': { lat: 18.6734, lng: 105.6813 },
  'vinh': { lat: 18.6734, lng: 105.6813 },
  'thanh hoa': { lat: 19.8067, lng: 105.7853 },
  'thanh hóa': { lat: 19.8067, lng: 105.7853 },
  'phu tho': { lat: 21.3227, lng: 105.4019 },
  'phú thọ': { lat: 21.3227, lng: 105.4019 },
  'hoa binh': { lat: 20.8174, lng: 105.3382 },
  'hòa bình': { lat: 20.8174, lng: 105.3382 },
  'dak lak': { lat: 12.6667, lng: 108.0500 },
  'đắk lắk': { lat: 12.6667, lng: 108.0500 },
  'buon ma thuot': { lat: 12.6667, lng: 108.0500 },
  'buôn ma thuột': { lat: 12.6667, lng: 108.0500 },
  'dong nai': { lat: 10.9458, lng: 106.8247 },
  'đồng nai': { lat: 10.9458, lng: 106.8247 },
  'bien hoa': { lat: 10.9458, lng: 106.8247 },
  'biên hòa': { lat: 10.9458, lng: 106.8247 }
}

/**
 * Finds hospital or event venue coordinates by name or returns city center defaults.
 * @param {string} hospitalName 
 * @param {string} [cityName] 
 * @returns {{ lat: number, lng: number }}
 */
export function getHospitalCoordinates(hospitalName, cityName) {
  const nameLower = (hospitalName || '').toLowerCase()
  const cityLower = (cityName || '').toLowerCase()

  // 1. Exact hospital match
  const hospMatch = HOSPITAL_DATABASE.find(
    h => h.name.toLowerCase() === nameLower
  )
  if (hospMatch) {
    return { lat: hospMatch.lat, lng: hospMatch.lng }
  }

  // 2. Exact event venue match
  const venueMatch = EVENT_VENUES_DATABASE.find(
    v => v.name.toLowerCase() === nameLower || nameLower.includes(v.name.toLowerCase())
  )
  if (venueMatch) {
    return { lat: venueMatch.lat, lng: venueMatch.lng }
  }

  // 3. City fallback by explicit cityName
  if (cityLower && CITY_FALLBACKS[cityLower]) {
    return CITY_FALLBACKS[cityLower]
  }

  // 4. Check if hospitalName/location text contains any known city keyword
  for (const [key, coords] of Object.entries(CITY_FALLBACKS)) {
    if (nameLower.includes(key)) {
      return coords
    }
  }

  // Default fallback (Cho Ray Hospital, HCMC)
  return { lat: 10.7548, lng: 106.6601 }
}
