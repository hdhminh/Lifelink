import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useScrollReveal } from '@/composables/useScrollReveal.js'

describe('useScrollReveal.js', () => {
  let mockObserve
  let mockUnobserve
  let mockMatchMedia

  beforeEach(() => {
    document.body.innerHTML = ''
    mockObserve = vi.fn()
    mockUnobserve = vi.fn()
    mockMatchMedia = vi.fn().mockReturnValue({ matches: false })

    vi.stubGlobal('matchMedia', mockMatchMedia)
    
    // Proper constructor class mock for Vitest
    class MockIntersectionObserver {
      observe = mockObserve
      unobserve = mockUnobserve
      disconnect = vi.fn()
      constructor(callback) {
        // mock instance
      }
    }
    
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  it('exposes a reveal function', () => {
    const { reveal } = useScrollReveal()
    expect(typeof reveal).toBe('function')
  })

  it('adds reveal-item class and observes matching elements', async () => {
    const div1 = document.createElement('div')
    div1.className = 'test-card'
    document.body.appendChild(div1)

    const { reveal } = useScrollReveal()
    await reveal('.test-card')

    expect(div1.classList.contains('reveal-item')).toBe(true)
    expect(mockObserve).toHaveBeenCalledWith(div1)
  })

  it('calculates custom delay from data-delay attribute or fallback stagger', async () => {
    const div1 = document.createElement('div')
    div1.className = 'item'
    div1.setAttribute('data-delay', '250ms')

    const div2 = document.createElement('div')
    div2.className = 'item'

    document.body.appendChild(div1)
    document.body.appendChild(div2)

    const { reveal } = useScrollReveal()
    await reveal('.item', 100)

    expect(div1.style.getPropertyValue('--reveal-delay')).toBe('250ms')
    expect(div2.style.getPropertyValue('--reveal-delay')).toBe('100ms')
  })
})
