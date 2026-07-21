import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '@/composables/useToast.js'

describe('useToast.js', () => {
  let toastModule

  beforeEach(() => {
    toastModule = useToast()
    // Clear toasts list for test isolation
    toastModule.toasts.value = []
    vi.useFakeTimers()
  })

  it('adds a toast message to the toasts list', () => {
    toastModule.showToast('Test notification', 'success')
    expect(toastModule.toasts.value.length).toBe(1)
    expect(toastModule.toasts.value[0]).toMatchObject({
      message: 'Test notification',
      type: 'success'
    })
  })

  it('automatically removes toast after duration timeout', () => {
    toastModule.showToast('Temporary alert', 'info', 1000)
    expect(toastModule.toasts.value.length).toBe(1)

    vi.advanceTimersByTime(1000)
    expect(toastModule.toasts.value.length).toBe(0)
  })

  it('removes toast by ID manually', () => {
    toastModule.showToast('Item 1', 'warning')
    toastModule.showToast('Item 2', 'danger')
    expect(toastModule.toasts.value.length).toBe(2)

    const firstId = toastModule.toasts.value[0].id
    toastModule.removeToast(firstId)

    expect(toastModule.toasts.value.length).toBe(1)
    expect(toastModule.toasts.value[0].message).toBe('Item 2')
  })
})
