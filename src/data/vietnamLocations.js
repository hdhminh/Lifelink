export const VIETNAM_PROVINCES_2025 = [
  'An Giang',
  'Bac Ninh',
  'Ca Mau',
  'Cao Bang',
  'Can Tho',
  'Da Nang',
  'Dak Lak',
  'Dien Bien',
  'Dong Nai',
  'Dong Thap',
  'Gia Lai',
  'Ha Noi',
  'Ha Tinh',
  'Hai Phong',
  'Hue',
  'Hung Yen',
  'Khanh Hoa',
  'Lai Chau',
  'Lang Son',
  'Lao Cai',
  'Lam Dong',
  'Nghe An',
  'Ninh Binh',
  'Phu Tho',
  'Quang Ngai',
  'Quang Ninh',
  'Quang Tri',
  'Son La',
  'Tay Ninh',
  'Thai Nguyen',
  'Thanh Hoa',
  'Ho Chi Minh City',
  'Tuyen Quang',
  'Vinh Long'
]

const LEGACY_ADMINISTRATIVE_NAMES = {
  Hanoi: 'Ha Noi',
  'Thua Thien Hue': 'Hue',
  'Nha Trang': 'Khanh Hoa',
  'Buon Ma Thuot': 'Dak Lak',
  'Viet Tri': 'Phu Tho',
  'Hoa Binh': 'Phu Tho',
  'Binh Duong': 'Ho Chi Minh City',
  'Ba Ria - Vung Tau': 'Ho Chi Minh City',
  'Vung Tau': 'Ho Chi Minh City',
  'Bien Hoa': 'Dong Nai'
}

const LEGACY_TEXT_REPLACEMENTS = [
  ['— Binh Duong', '— Ho Chi Minh City'],
  ['— Hoa Binh', '— Phu Tho'],
  ['in Hoa Binh province', 'in Phu Tho'],
  ['in Bien Hoa', 'in Dong Nai'],
  ['Thua Thien Hue clinics', 'Hue clinics']
]

export function normalizeAdministrativeLocation(value) {
  if (!value || typeof value !== 'string') return value || ''
  return LEGACY_ADMINISTRATIVE_NAMES[value] || value
}

export function normalizeLocationRecord(record) {
  if (!record || typeof record !== 'object') return record
  return {
    ...record,
    city: normalizeAdministrativeLocation(record.city)
  }
}

export function normalizeEventRecord(record) {
  if (!record || typeof record !== 'object') return record

  let title = record.title || ''
  let description = record.description || ''
  let location = record.location || ''

  LEGACY_TEXT_REPLACEMENTS.forEach(([from, to]) => {
    title = title.replaceAll(from, to)
    description = description.replaceAll(from, to)
    location = location.replaceAll(from, to)
  })

  if (location === 'Binh Duong Youth Center') location = 'Thu Dau Mot Youth Center'
  if (location === 'Hoa Binh Provincial Cultural Palace') location = 'Phu Tho Cultural Palace'

  return {
    ...record,
    title,
    description,
    location,
    city: normalizeAdministrativeLocation(record.city)
  }
}
