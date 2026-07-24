/**
 * hospitalCoordinates.js
 *
 * Real geographic coordinates (latitude, longitude) for partner clinics and hospitals
 * across major cities in Vietnam. Shared between RequestForm autocomplete and EmergencyMap.
 */

export const HOSPITAL_DATABASE = [
  // Ho Chi Minh City
  { name: 'Cho Ray Hospital', city: 'Ho Chi Minh City', lat: 10.7548, lng: 106.6601 },
  { name: 'FV Hospital', city: 'Ho Chi Minh City', lat: 10.7296, lng: 106.7222 },
  { name: 'Vinmec Central Park Hospital', city: 'Ho Chi Minh City', lat: 10.7937, lng: 106.7188 },
  { name: 'Gia Dinh People\'s Hospital', city: 'Ho Chi Minh City', lat: 10.8013, lng: 106.6912 },
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

/**
 * Finds hospital coordinates by name or returns city center defaults.
 * @param {string} hospitalName 
 * @param {string} [cityName] 
 * @returns {{ lat: number, lng: number }}
 */
export function getHospitalCoordinates(hospitalName, cityName) {
  const match = HOSPITAL_DATABASE.find(
    h => h.name.toLowerCase() === (hospitalName || '').toLowerCase()
  )
  if (match) {
    return { lat: match.lat, lng: match.lng }
  }

  // Fallbacks by city center if exact hospital name isn't matched
  const CITY_FALLBACKS = {
    'ho chi minh city': { lat: 10.7548, lng: 106.6601 },
    'ha noi': { lat: 21.0000, lng: 105.8426 },
    'da nang': { lat: 16.0716, lng: 108.2200 },
    'hue': { lat: 16.4637, lng: 107.5909 },
    'can tho': { lat: 10.0341, lng: 105.7557 },
    'hai phong': { lat: 20.8544, lng: 106.6778 },
    'nha trang': { lat: 12.2472, lng: 109.1917 }
  }

  const cityMatch = CITY_FALLBACKS[(cityName || '').toLowerCase()]
  if (cityMatch) return cityMatch

  // Default fallback (Cho Ray Hospital, HCMC)
  return { lat: 10.7548, lng: 106.6601 }
}
