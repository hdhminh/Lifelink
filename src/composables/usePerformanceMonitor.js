import { ref, onMounted } from 'vue'

const metrics = ref({
  lcp: null,
  fid: null,
  cls: 0,
  fcp: null,
  ttfb: null,
  routeTransitions: [],
  firestoreQueries: []
})

const isVisible = ref(false)
const isDev = import.meta.env.DEV

export function usePerformanceMonitor() {
  function initWebVitals() {
    if (typeof PerformanceObserver === 'undefined') return

    // LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.value.lcp = Math.round(lastEntry.startTime)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

    // FID
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        metrics.value.fid = Math.round(entry.processingStart - entry.startTime)
      })
    })
    fidObserver.observe({ type: 'first-input', buffered: true })

    // CLS
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          metrics.value.cls = Math.round(clsValue * 1000) / 1000
        }
      })
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    // FCP
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint')
      if (fcpEntry) {
        metrics.value.fcp = Math.round(fcpEntry.startTime)
      }
    })
    fcpObserver.observe({ type: 'paint', buffered: true })
  }

  function measureRouteTransition(from, to) {
    const start = performance.now()
    return () => {
      const duration = Math.round(performance.now() - start)
      metrics.value.routeTransitions.push({
        from: from.path,
        to: to.path,
        duration,
        timestamp: Date.now()
      })
      // Keep only last 50 transitions
      if (metrics.value.routeTransitions.length > 50) {
        metrics.value.routeTransitions.shift()
      }
    }
  }

  function measureFirestoreQuery(queryName) {
    const start = performance.now()
    return () => {
      const duration = Math.round(performance.now() - start)
      metrics.value.firestoreQueries.push({
        name: queryName,
        duration,
        timestamp: Date.now()
      })
      // Keep only last 50 queries
      if (metrics.value.firestoreQueries.length > 50) {
        metrics.value.firestoreQueries.shift()
      }
    }
  }

  function toggleOverlay() {
    if (isDev) {
      isVisible.value = !isVisible.value
    }
  }

  onMounted(() => {
    if (isDev) {
      initWebVitals()
      // Keyboard shortcut Ctrl+Shift+P
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          e.preventDefault()
          toggleOverlay()
        }
      })
    }
  })

  return {
    metrics,
    isVisible,
    isDev,
    measureRouteTransition,
    measureFirestoreQuery,
    toggleOverlay
  }
}
