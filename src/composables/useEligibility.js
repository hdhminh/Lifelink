/**
 * useEligibility.js
 *
 * Helper composable to calculate donor cooldown periods and next eligible donation dates.
 * Standard medical protocol: 56 days (8 weeks) between full blood donations.
 */

import { computed } from 'vue'

export const DONATION_COOLDOWN_DAYS = 56
export const COOLDOWN_MS = DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

export function useEligibility() {
  /**
   * Helper to parse Firestore Timestamp or Date object/string into JS Date.
   */
  function parseDate(value) {
    if (!value) return null
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate()
    }
    return new Date(value)
  }

  /**
   * Check if a donor is currently eligible based on last donation date.
   * @param {Object|Date|string|null} lastDonationDate 
   * @returns {boolean} True if eligible or no prior donation.
   */
  function isEligible(lastDonationDate) {
    const lastDate = parseDate(lastDonationDate)
    if (!lastDate) return true
    return Date.now() - lastDate.getTime() >= COOLDOWN_MS
  }

  /**
   * Calculate the next date the donor is allowed to donate.
   * @param {Object|Date|string|null} lastDonationDate 
   * @returns {Date|null} Date object or null if never donated.
   */
  function nextEligibleDate(lastDonationDate) {
    const lastDate = parseDate(lastDonationDate)
    if (!lastDate) return null
    return new Date(lastDate.getTime() + COOLDOWN_MS)
  }

  /**
   * Calculate number of days remaining until the donor is eligible.
   * @param {Object|Date|string|null} lastDonationDate 
   * @returns {number} Days remaining (0 if already eligible).
   */
  function daysUntilEligible(lastDonationDate) {
    const nextDate = nextEligibleDate(lastDonationDate)
    if (!nextDate) return 0
    const diff = nextDate.getTime() - Date.now()
    return diff <= 0 ? 0 : Math.ceil(diff / (24 * 60 * 60 * 1000))
  }

  return {
    isEligible,
    nextEligibleDate,
    daysUntilEligible
  }
}
