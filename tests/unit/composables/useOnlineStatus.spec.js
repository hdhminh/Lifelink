import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('addEventListener', vi.fn())
    vi.stubGlobal('removeEventListener', vi.fn())
  })

  it('initializes with navigator.onLine value', async () => {
    const { useOnlineStatus } = await import('@/composables/useOnlineStatus.js')
    const { isOnline } = useOnlineStatus()
    expect(isOnline.value).toBe(true)
  })

  it('formats status correctly', async () => {
    const { useOnlineStatus } = await import('@/composables/useOnlineStatus.js')
    const { formattedStatus } = useOnlineStatus()
    expect(formattedStatus.value).toBe('Online')
  })
})