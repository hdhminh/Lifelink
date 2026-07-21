/**
 * router/index.js
 *
 * Route definitions and navigation guards.
 *
 * History mode: createWebHashHistory()
 * - Required for Mercury static hosting (no server-side routing config).
 * - All URLs will be in the format: https://host/#/path
 *
 * Guards:
 * - requiresAuth  -> redirect to /login if not authenticated
 * - requiresAdmin -> redirect to /dashboard if authenticated but not admin
 *
 * All views are lazy-loaded for better initial page performance.
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebase.js'
import { doc, getDoc } from 'firebase/firestore'
import { useGuestSession } from '@/composables/useGuestSession.js'

const Home = () => import('@/views/Home.vue')
const News = () => import('@/views/News.vue')
const About = () => import('@/views/About.vue')
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const DonorDashboard = () => import('@/views/DonorDashboard.vue')
const EmergencyBoard = () => import('@/views/EmergencyBoard.vue')
const DonationEvents = () => import('@/views/DonationEvents.vue')
const AdminRequests = () => import('@/views/AdminRequests.vue')
const Profile = () => import('@/views/Profile.vue')

const routes = [
  { path: '/', name: 'Home', component: Home, meta: { title: 'LifeLink - Connected Lives Vietnam' } },
  { path: '/news', name: 'News', component: News, meta: { title: 'LifeLink - Blood Donation News' } },
  { path: '/about', name: 'About', component: About, meta: { title: 'LifeLink - About Us' } },
  { path: '/login', name: 'Login', component: Login, meta: { title: 'LifeLink - Sign In' } },
  { path: '/register', name: 'Register', component: Register, meta: { title: 'LifeLink - Create Account' } },
  { path: '/events', name: 'DonationEvents', component: DonationEvents, meta: { title: 'LifeLink - Donation Events' } },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DonorDashboard,
    meta: { title: 'LifeLink - Donor Dashboard', requiresAuth: true }
  },
  {
    path: '/emergency-board',
    name: 'EmergencyBoard',
    component: EmergencyBoard,
    meta: { title: 'LifeLink - Emergency Request Board' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { title: 'LifeLink - Donor Profile', requiresAuth: true }
  },
  {
    path: '/admin/requests',
    name: 'AdminRequests',
    component: AdminRequests,
    meta: { title: 'LifeLink - Admin Operations', requiresAuth: true, requiresAdmin: true }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ top: 0 })
      }, 200)
    })
  }
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta?.title || 'LifeLink'

  const currentUser = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribe()
      resolve(firebaseUser)
    })
  })

  if (to.path === '/' && !currentUser && !from.name) {
    const { getGuestSession } = useGuestSession()
    const session = getGuestSession()
    if (session.lastRoute && session.lastRoute !== '/' && session.lastRoute !== '/login' && session.lastRoute !== '/register') {
      next(session.lastRoute)
      return
    }
  }

  const requiresAuth = to.meta.requiresAuth
  const requiresAdmin = to.meta.requiresAdmin

  if (!requiresAuth) {
    next()
    return
  }

  if (!currentUser) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (requiresAdmin) {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        next({ name: 'Dashboard' })
        return
      }
    } catch (err) {
      console.error('Error fetching user profile for admin guard:', err)
      next({ name: 'Dashboard' })
      return
    }
  }

  next()
})

router.afterEach((to) => {
  if (!auth.currentUser && to.name && to.name !== 'Login' && to.name !== 'Register') {
    const { updateGuestSession } = useGuestSession()
    updateGuestSession({ lastRoute: to.fullPath })
  }
})

export default router
