import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { auth, db } from '@/firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

// Mock firebase elements
vi.mock('@/firebase.js', () => ({
  auth: {
    currentUser: null
  },
  db: {}
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn()
}))

describe('Router Integration & Navigation Guards', () => {
  let router

  const routes = [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div>Dashboard</div>' }, meta: { requiresAuth: true } },
    { path: '/admin', name: 'Admin', component: { template: '<div>Admin</div>' }, meta: { requiresAuth: true, requiresAdmin: true } }
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    router = createRouter({
      history: createWebHashHistory(),
      routes
    })
  })

  it('redirects unauthenticated users to login for protected pages', async () => {
    // Mock user as not logged in
    onAuthStateChanged.mockImplementation((authInstance, callback) => {
      callback(null)
      return () => {}
    })

    router.beforeEach(async (to, from, next) => {
      const requiresAuth = to.meta.requiresAuth
      if (requiresAuth && !auth.currentUser) {
        next({ name: 'Login' })
      } else {
        next()
      }
    })

    await router.push('/dashboard')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('allows authenticated users to access dashboard', async () => {
    auth.currentUser = { uid: 'user123', email: 'donor@lifelink.vn' }
    onAuthStateChanged.mockImplementation((authInstance, callback) => {
      callback(auth.currentUser)
      return () => {}
    })

    router.beforeEach(async (to, from, next) => {
      const requiresAuth = to.meta.requiresAuth
      if (requiresAuth && !auth.currentUser) {
        next({ name: 'Login' })
      } else {
        next()
      }
    })

    await router.push('/dashboard')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })
})
