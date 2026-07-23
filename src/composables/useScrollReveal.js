import { nextTick } from 'vue'

/**
 * useScrollReveal composable
 *
 * Exposes a `reveal` function that finds elements matching the selector
 * and animates them as they enter the viewport using IntersectionObserver.
 * Respects `prefers-reduced-motion` for accessibility compliance.
 */
export function useScrollReveal() {
  /**
   * Initialises IntersectionObserver-based reveal animations on matched elements.
   * Each element receives a staggered delay based on its DOM order.
   * @param {string} selector - CSS selector to find elements to animate.
   * @param {number} [delayMs=60] - Stagger delay between elements in milliseconds.
   * @returns {Promise<void>} Resolves after observers are attached.
   */
  const reveal = async (selector, delayMs = 60) => {
    // Wait for Vue's DOM update cycle
    await nextTick()
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target
          if (prefersReducedMotion) {
            target.classList.add('reveal-instant')
          } else {
            target.classList.add('reveal-visible')
          }
          observer.unobserve(target)
        }
      })
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -30px 0px'
    })

    const elements = document.querySelectorAll(selector)
    elements.forEach((el, index) => {
      if (!el.classList.contains('reveal-item')) {
        el.classList.add('reveal-item')
      }
      
      // Calculate stagger delay
      const delay = el.getAttribute('data-delay') || `${index * delayMs}ms`
      el.style.setProperty('--reveal-delay', delay)
      
      observer.observe(el)
    })
  }

  return { reveal }
}
