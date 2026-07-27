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
          <component :is="Component" :key="route.fullPath" />
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
// Geolocation removed from App.vue mount
import { useLiveSimulation } from '@/composables/useLiveSimulation.js'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import SupportChatWidget from '@/components/SupportChatWidget.vue'
import GlobalToasts from '@/components/GlobalToasts.vue'
import { useEmergencyNotifications } from '@/composables/useEmergencyNotifications.js'

// Initialize notifications listener
useEmergencyNotifications()

// Geo prompt will be handled by components like LiveNetworkMap when needed

onMounted(async () => {
  if (typeof window !== 'undefined') {
    // Initialize simulation engine
    const { initSimulation } = useLiveSimulation()
    initSimulation()
  }
})

</script>
