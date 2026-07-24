<template>
  <nav class="navbar navbar-dark navbar-expand-lg ll-navbar sticky-top">
    <div class="container-fluid px-4 px-lg-5" style="max-width: 1440px; margin: 0 auto;">
      <RouterLink to="/" class="navbar-brand ll-navbar-brand">
        <i class="bi bi-droplet-fill text-danger me-1"></i> LifeLink
      </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarMain"
        aria-controls="navbarMain"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarMain">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/emergency-board"><i class="bi bi-hospital me-1"></i> Emergency Board</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/map"><i class="bi bi-geo-alt-fill me-1"></i> Live Map</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/events"><i class="bi bi-calendar-event me-1"></i> Events</RouterLink>
          </li>

          <li class="nav-item" v-if="!user">
            <RouterLink class="nav-link" to="/news"><i class="bi bi-newspaper me-1"></i> News</RouterLink>
          </li>
          <li class="nav-item" v-if="!user">
            <RouterLink class="nav-link" to="/about"><i class="bi bi-info-circle me-1"></i> About</RouterLink>
          </li>
          <li class="nav-item ms-lg-2" v-if="isAdmin">
            <RouterLink class="nav-link" to="/admin/requests">
              <span class="badge bg-warning text-dark"><i class="bi bi-shield-lock me-1"></i> Admin</span>
            </RouterLink>
          </li>
        </ul>

        <ul class="navbar-nav align-items-lg-center">
          <template v-if="!user">
            <li class="nav-item">
              <RouterLink class="btn btn-nav-ghost btn-sm" to="/login"><i class="bi bi-box-arrow-in-right me-1"></i> Login</RouterLink>
            </li>
            <li class="nav-item ms-lg-2">
              <RouterLink class="btn btn-nav-primary btn-sm" to="/register"><i class="bi bi-person-plus me-1"></i> Register</RouterLink>
            </li>
          </template>
          <template v-else>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/dashboard"><i class="bi bi-speedometer2 me-1"></i> {{ userBadgeLabel }}</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/profile"><i class="bi bi-person me-1"></i> Profile</RouterLink>
            </li>
            <li class="nav-item ms-lg-2">
              <button class="btn btn-nav-ghost btn-sm" @click="handleLogout"><i class="bi bi-box-arrow-right me-1"></i> Logout</button>
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
 * theme toggle, emergency board shortcuts, and role-based user navigation.
 */
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast.js'

const { user, userProfile, isAdmin, logout } = useAuth()
const router = useRouter()
const { showToast } = useToast()

const userBadgeLabel = computed(() => {
  if (!userProfile.value) return 'Dashboard'
  const name = userProfile.value.displayName || ''
  return name.trim() || 'Dashboard'
})

async function handleLogout() {
  await logout()
  showToast('Signed out successfully.', 'info')
  router.push({ name: 'Home' })
}
</script>

<style scoped>
.ll-navbar-brand {
  letter-spacing: -0.03em;
}

@media (max-width: 991.98px) {
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
    padding: 0.6rem 1rem !important; /* Make buttons taller and easier to tap on mobile */
  }
  
  /* Custom collapse slide-down animation */
  .navbar-collapse {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.25s var(--ease-drawer), opacity 0.2s var(--ease-out);
    display: block !important;
  }
  .navbar-collapse.collapsing {
    max-height: 0;
    opacity: 0;
    transition: max-height 0.25s var(--ease-drawer), opacity 0.2s var(--ease-out);
  }
  .navbar-collapse.show {
    max-height: 450px;
    opacity: 1;
    transition: max-height 0.3s var(--ease-drawer), opacity 0.25s var(--ease-out);
  }
}
</style>
