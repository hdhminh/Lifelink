import { describe, it, expect } from 'vitest'

describe('usePerformanceMonitor', () => {
  it('initializes with default metrics', async () => {
    const { usePerformanceMonitor } = await import('@/composables/usePerformanceMonitor.js')
    const { metrics } = usePerformanceMonitor()
    expect(metrics.value.lcp).toBeNull()
    expect(metrics.value.fid).toBeNull()
    expect(metrics.value.cls).toBe(0)
  })

  it('tracks firestore query duration', async () => {
    const { usePerformanceMonitor } = await import('@/composables/usePerformanceMonitor.js')
    const { measureFirestoreQuery, metrics } = usePerformanceMonitor()
    const end = measureFirestoreQuery('test-query')
    end()
    expect(metrics.value.firestoreQueries.length).toBe(1)
    expect(metrics.value.firestoreQueries[0].name).toBe('test-query')
  })
})