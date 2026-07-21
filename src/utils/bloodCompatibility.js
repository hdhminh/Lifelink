/**
 * bloodCompatibility.js
 *
 * Blood compatibility rules matrix for donor and recipient matches.
 * Essential medical rules for emergency transfusions.
 */

export const COMPATIBILITY_MAP = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
}

/**
 * Check if a donor blood type is compatible with a recipient blood type.
 * @param {string} donorType 
 * @param {string} recipientType 
 * @returns {boolean} True if compatible.
 */
export function canDonateTo(donorType, recipientType) {
  if (!donorType || !recipientType) return false
  if (recipientType === 'Any' || donorType === 'Any') return true
  
  const compatibleRecipients = COMPATIBILITY_MAP[donorType]
  if (!compatibleRecipients) return false
  
  return compatibleRecipients.includes(recipientType)
}

/**
 * Get all blood types that a specific donor type can donate to.
 * @param {string} donorType 
 * @returns {Array<string>} List of compatible recipient blood types.
 */
export function getCompatibleRecipientTypes(donorType) {
  if (!donorType) return []
  if (donorType === 'Any') return Object.keys(COMPATIBILITY_MAP)
  return COMPATIBILITY_MAP[donorType] || []
}

/**
 * Get all blood types that can donate to a specific recipient type.
 * @param {string} recipientType 
 * @returns {Array<string>} List of compatible donor blood types.
 */
export function getCompatibleDonorTypes(recipientType) {
  if (!recipientType) return []
  if (recipientType === 'Any') return Object.keys(COMPATIBILITY_MAP)
  
  const compatibleDonors = []
  for (const [donor, recipients] of Object.entries(COMPATIBILITY_MAP)) {
    if (recipients.includes(recipientType)) {
      compatibleDonors.push(donor)
    }
  }
  return compatibleDonors
}
