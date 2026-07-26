import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useGdprConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows banner when no consent stored', async () => {
    const { useGdprConsent } = await import('@/composables/useGdprConsent.js')
    const { showBanner } = useGdprConsent()
    expect(showBanner.value).toBe(true)
  })

  it('grants consent and saves to localStorage', async () => {
    const { useGdprConsent } = await import('@/composables/useGdprConsent.js')
    const { grantConsent, hasConsent } = useGdprConsent()
    grantConsent('location')
    expect(hasConsent('location')).toBe(true)
    expect(localStorage.getItem('ll_gdpr_consent')).toBeTruthy()
  })

  it('revokes consent correctly', async () => {
    const { useGdprConsent } = await import('@/composables/useGdprConsent.js')
    const { grantConsent, revokeConsent, hasConsent } = useGdprConsent()
    grantConsent('analytics')
    revokeConsent('analytics')
    expect(hasConsent('analytics')).toBe(false)
  })
})