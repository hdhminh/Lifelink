import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActiveResponses } from '@/composables/useActiveResponses.js'

vi.mock('@/firebase.js', () => ({ rtdb: {} }))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn((ref, callback) => {
    callback({
      val: () => ({
        req1_donor1: { donorId: 'donor1', requestId: 'req1', status: 'en_route', distanceMeters: 4000, etaMins: 10 },
        req1_donor2: { donorId: 'donor2', requestId: 'req1', status: 'approaching', distanceMeters: 300, etaMins: 1 }
      })
    })
    return vi.fn()
  }),
  off: vi.fn()
}))

describe('useActiveResponses.js', () => {
  let activeResp

  beforeEach(() => {
    activeResp = useActiveResponses()
  })

  it('initialises with loading true and empty responses', () => {
    expect(activeResp.responses.value).toEqual([])
  })

  it('populates responses when startListening is called', () => {
    activeResp.startListening()
    expect(activeResp.responses.value.length).toBe(2)
    expect(activeResp.loading.value).toBe(false)
  })

  it('filters responses by requestId', () => {
    activeResp.startListening()
    const filtered = activeResp.getResponsesForRequest('req1')
    expect(filtered.length).toBe(2)
    expect(activeResp.getResponsesForRequest('non_existent').length).toBe(0)
  })

  it('counts en-route and approaching responders for a request', () => {
    activeResp.startListening()
    const count = activeResp.getEnRouteCountForRequest('req1')
    expect(count).toBe(2)
  })
})
