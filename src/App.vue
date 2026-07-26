<template>
  <div id="app" class="ll-app-shell">
    <AppLoader />
    <OfflineIndicator />
    <div class="ll-ambient-blob ll-ambient-blob-1" aria-hidden="true"></div>
    <div class="ll-ambient-blob ll-ambient-blob-2" aria-hidden="true"></div>
    <AppNavbar />

    <main class="ll-main" role="main">
      <RouterView v-slot="{ Component, route }">
        <transition name="page-fade" mode="out-in">
          <keep-alive max="5">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </transition>
      </RouterView>
    </main>
    <AppFooter />

    <!-- Global Toast Notifications Stack -->
    <!-- Global Toast Notifications Stack -->
    <GlobalToasts />

    <!-- GDPR Cookie Consent Banner -->
    <CookieConsent />

    <!-- Floating Support Chat Bubble & Window -->
    <SupportChatWidget />
  </div>
</template>

<script setup>
/**
 * App.vue
 * Root component. Renders global navbar, router view, and global footer.
 */
import AppLoader from '@/components/AppLoader.vue'
import { ref, watch, onUnmounted, nextTick, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useLiveSimulation } from '@/composables/useLiveSimulation.js'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import SupportChatWidget from '@/components/SupportChatWidget.vue'
import GlobalToasts from '@/components/GlobalToasts.vue'
import { useEmergencyNotifications } from '@/composables/useEmergencyNotifications.js'

// Initialize notifications listener
useEmergencyNotifications()

const { requestLocation } = useGeolocation()

onMounted(async () => {
  if (typeof window !== 'undefined') {
    // Initialize simulation engine
    const { initSimulation } = useLiveSimulation()
    initSimulation()

    const geoPrompted = localStorage.getItem('ll_geo_prompted')
    const geoGranted = localStorage.getItem('ll_geo_granted')
    if (!geoPrompted && geoGranted !== 'true') {
      localStorage.setItem('ll_geo_prompted', 'true')
      try {
        await requestLocation()
      } catch (e) {
        console.warn('Geolocation initial request denied:', e)
      }
    }
  }
})

</script>
