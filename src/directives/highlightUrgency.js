/**
 * highlightUrgency.js
 *
 * Custom directive: v-highlight-urgency.
 * Applies an urgency class based on critical, urgent, or moderate level.
 */

const URGENCY_CLASSES = {
  critical: 'll-urgency-critical',
  urgent: 'll-urgency-urgent',
  moderate: 'll-urgency-moderate'
}

/**
 * Removes all urgency classes from an element and applies the correct one.
 * @param {HTMLElement} el - Target element.
 * @param {string} level - Urgency level string.
 */
function applyUrgencyClass(el, level) {
  Object.values(URGENCY_CLASSES).forEach(cls => el.classList.remove(cls))

  const normalised = level?.toLowerCase()
  if (URGENCY_CLASSES[normalised]) {
    el.classList.add(URGENCY_CLASSES[normalised])
  }
}

export const vHighlightUrgency = {
  mounted(el, binding) {
    applyUrgencyClass(el, binding.value)
  },
  updated(el, binding) {
    applyUrgencyClass(el, binding.value)
  }
}
