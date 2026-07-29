<template>
  <nav class="navbar navbar-dark navbar-expand-lg ll-navbar sticky-top">
    <div class="container-fluid px-3 px-lg-5" style="max-width: 1440px; margin: 0 auto">
      <RouterLink to="/" class="navbar-brand ll-navbar-brand" aria-label="LifeLink Homepage" @click="closeNav">
        <i class="bi bi-droplet-fill text-danger me-1"></i> LifeLink
      </RouterLink>

      <div class="ll-navbar-quick-actions">
        <div class="ll-notification-nav">
          <button
            type="button"
            class="btn btn-nav-ghost btn-sm ll-notification-trigger"
            aria-label="Open notifications"
            :aria-expanded="showNotifications"
            @click.stop="toggleNotifications"
          >
            <i class="bi bi-bell-fill"></i>
            <span v-if="unreadCount > 0" class="ll-notification-count">{{ unreadCount }}</span>
          </button>
          <div v-if="showNotifications" class="ll-notification-menu" @click.stop>
            <div class="ll-notification-menu__header">
              <strong>Notifications</strong>
              <button
                v-if="notifications.length"
                type="button"
                class="ll-notification-clear"
                @click="clearNotifications"
              >
                Clear
              </button>
            </div>
            <div v-if="notifications.length" class="ll-notification-list">
              <button
                v-for="item in notifications"
                :key="item.id"
                type="button"
                :class="['ll-notification-item', { 'll-notification-item--unread': !item.read }]"
                @click="openNotification(item)"
              >
                <span class="ll-notification-title">{{ item.title }}</span>
                <span class="ll-notification-body">{{ item.body }}</span>
                <span class="ll-notification-time">{{ formatNotificationTime(item.createdAt) }}</span>
              </button>
            </div>
            <div v-else class="ll-notification-empty">No notifications yet.</div>
          </div>
        </div>

      <button
        class="navbar-toggler"
        type="button"
        :aria-expanded="isNavOpen"
        aria-label="Toggle navigation"
        @click="toggleNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      </div>

      <div id="navbarMain" :class="['collapse', 'navbar-collapse', { show: isNavOpen }]">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/emergency-board" @click="closeNav"
              ><i class="bi bi-hospital me-1"></i> Emergency</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/events" @click="closeNav"
              ><i class="bi bi-calendar-event me-1"></i> Events</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/map" @click="closeNav"
              ><i class="bi bi-geo-alt-fill me-1"></i> Map</RouterLink
            >
          </li>

          <li v-if="!user" class="nav-item">
            <RouterLink class="nav-link" to="/news" @click="closeNav"
              ><i class="bi bi-newspaper me-1"></i> News</RouterLink
            >
          </li>
          <li v-if="!user" class="nav-item">
            <RouterLink class="nav-link" to="/about" @click="closeNav"
              ><i class="bi bi-info-circle me-1"></i> About</RouterLink
            >
          </li>
        </ul>

        <ul class="navbar-nav align-items-lg-center">
          <template v-if="!user">
            <li class="nav-item">
              <RouterLink class="btn btn-nav-ghost btn-sm" to="/login" @click="closeNav"
                ><i class="bi bi-box-arrow-in-right me-1"></i> Login</RouterLink
              >
            </li>
            <li class="nav-item ms-lg-2">
              <RouterLink class="btn btn-nav-primary btn-sm" to="/register" @click="closeNav"
                ><i class="bi bi-person-plus me-1"></i> Register</RouterLink
              >
            </li>
          </template>
          <template v-else>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/dashboard" @click="closeNav"
                ><i class="bi bi-speedometer2 me-1"></i> {{ userBadgeLabel }}</RouterLink
              >
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/profile" @click="closeNav"
                ><i class="bi bi-person me-1"></i> Profile</RouterLink
              >
            </li>
            <li class="nav-item ms-lg-2">
              <button class="btn btn-nav-ghost btn-sm" @click="handleLogout">
                <i class="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
/**
 * AppNavbar.vue
 *
 * Top navigation bar supporting responsive mobile menu toggle,
 * auto-close on page navigation, theme toggle, and role-based user navigation.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast.js'
import { useNotificationCenter } from '@/composables/useNotificationCenter.js'

const { user, userProfile, logout } = useAuth()
const router = useRouter()
const route = useRoute()
const { showToast } = useToast()
const { notifications, unreadCount, markAllRead, clearNotifications } = useNotificationCenter()

const isNavOpen = ref(false)
const showNotifications = ref(false)

function toggleNav() {
  isNavOpen.value = !isNavOpen.value
}

function closeNav() {
  isNavOpen.value = false
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    markAllRead()
  }
}

function closeNotifications() {
  showNotifications.value = false
}

function openNotification(item) {
  closeNotifications()
  if (item.url) {
    window.location.href = item.url
  }
}

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(route, () => {
  closeNav()
  closeNotifications()
})

onMounted(() => {
  document.addEventListener('click', closeNotifications)
})

onUnmounted(() => {
  document.removeEventListener('click', closeNotifications)
})

const userBadgeLabel = computed(() => {
  if (!userProfile.value) return 'Dashboard'
  const name = userProfile.value.displayName || ''
  return name.trim() || 'Dashboard'
})

async function handleLogout() {
  closeNav()
  await logout()
  showToast('Signed out successfully.', 'info')
  router.push({ name: 'Home' })
}
</script>

<style scoped>
.ll-navbar-brand {
  letter-spacing: -0.03em;
  order: 1;
}

.navbar-collapse {
  order: 2;
  flex-grow: 1;
}

.ll-navbar-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.75rem;
  order: 3;
}

.ll-notification-nav {
  position: relative;
}

.ll-notification-trigger {
  position: relative;
  width: 38px;
  min-width: 38px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
}

.ll-notification-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #dc3545;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 18px;
  box-shadow: 0 0 0 2px var(--ll-navbar-bg, #251e21);
}

.ll-notification-menu {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  width: min(340px, calc(100vw - 2rem));
  max-height: 420px;
  overflow: hidden;
  background: #ffffff;
  color: var(--ll-slate-800);
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-md);
  box-shadow: var(--ll-shadow-lg);
  z-index: 1200;
}

.ll-notification-menu__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--ll-slate-200);
  color: var(--ll-wine-red);
}

.ll-notification-clear {
  border: none;
  background: transparent;
  color: var(--ll-wine-red);
  font-size: 0.78rem;
  font-weight: 800;
}

.ll-notification-list {
  max-height: 355px;
  overflow-y: auto;
}

.ll-notification-item {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--ll-slate-200);
  background: #ffffff;
  padding: 0.75rem 0.9rem;
  text-align: left;
  display: grid;
  gap: 0.2rem;
}

.ll-notification-item:hover,
.ll-notification-item:focus {
  background: var(--ll-surface-alt);
}

.ll-notification-item--unread {
  background: var(--ll-wine-light);
}

.ll-notification-title {
  color: var(--ll-slate-900);
  font-size: 0.86rem;
  font-weight: 800;
}

.ll-notification-body {
  color: var(--ll-slate-500);
  font-size: 0.8rem;
  line-height: 1.35;
}

.ll-notification-time {
  color: var(--ll-slate-400);
  font-size: 0.72rem;
}

.ll-notification-empty {
  padding: 1rem;
  color: var(--ll-slate-500);
  font-size: 0.86rem;
}

@media (max-width: 991.98px) {
  .ll-navbar-brand {
    margin-right: 0;
  }

  .ll-navbar-quick-actions {
    margin-left: auto;
  }

  .navbar-collapse {
    order: 4;
    flex-basis: 100%;
  }

  .navbar-nav {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    gap: 0.5rem;
  }
  .navbar-nav .nav-item {
    width: 100%;
  }
  .navbar-nav .btn {
    width: 100%;
    text-align: center;
    margin-left: 0 !important;
    padding: 0.6rem 1rem !important;
  }

  .ll-notification-menu {
    position: absolute;
    right: -3.25rem;
    width: min(320px, calc(100vw - 1.25rem));
  }

  .navbar-collapse {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition:
      max-height 0.25s var(--ease-drawer),
      opacity 0.2s var(--ease-out);
    display: block !important;
  }
  .navbar-collapse.collapsing {
    max-height: 0;
    opacity: 0;
    transition:
      max-height 0.25s var(--ease-drawer),
      opacity 0.2s var(--ease-out);
  }
  .navbar-collapse.show {
    max-height: 450px;
    opacity: 1;
    transition:
      max-height 0.3s var(--ease-drawer),
      opacity 0.25s var(--ease-out);
  }
}
</style>
