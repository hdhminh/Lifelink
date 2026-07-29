<script setup>
/**
 * AppFooter.vue
 *
 * Global application footer component containing quick navigation links,
 * branding, copyright notice, privacy settings re-open, and emergency network declaration.
 */
import { useGdprConsent } from '@/composables/useGdprConsent.js'

const { showSettings } = useGdprConsent()
</script>

<template>
  <footer class="ll-footer mt-auto">
    <div class="container-fluid px-4 px-lg-5" style="max-width: 1440px; margin: 0 auto">
      <div
        class="d-flex flex-column flex-md-row justify-content-between align-items-center text-center text-md-start gap-4"
      >
        <div class="mb-2 mb-md-0">
          <RouterLink to="/" class="ll-footer__brand text-decoration-none d-inline-block">
            <i class="bi bi-droplet-fill text-danger me-1"></i> LifeLink
          </RouterLink>
          <div class="ll-footer__copy">Emergency donor coordination network</div>
        </div>
        <div class="d-flex flex-wrap justify-content-center justify-content-md-end gap-3 gap-md-4">
          <RouterLink to="/emergency-board" class="text-decoration-none ll-footer-link"
            >Emergency</RouterLink
          >
          <RouterLink to="/events" class="text-decoration-none ll-footer-link">Events</RouterLink>
          <RouterLink to="/map" class="text-decoration-none ll-footer-link">Map</RouterLink>
          <RouterLink to="/news" class="text-decoration-none ll-footer-link">News</RouterLink>
          <RouterLink to="/about" class="text-decoration-none ll-footer-link">About</RouterLink>
        </div>
      </div>
      <div
        class="mt-4 pt-3 border-top ll-footer-meta d-flex justify-content-center justify-content-md-between flex-column flex-md-row align-items-center gap-3 text-center text-md-start"
      >
        <div class="d-flex flex-wrap justify-content-center gap-2">
          <span>LifeLink Vietnam &copy; 2026.</span>
        </div>
        <button
          class="btn btn-link p-0 text-decoration-none ll-footer-link"
          style="color: inherit; font-size: inherit; font-weight: inherit;"
          @click="showSettings"
        >
          Privacy & Permissions
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.ll-footer {
  background-color: var(--ll-espresso);
  color: var(--ll-slate-300);
  padding: 2.5rem 0;
  margin-top: auto;
  font-size: 0.875rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.ll-footer__brand {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.25rem;
  color: #ffffff;
  letter-spacing: -0.02em;
  transition: opacity var(--ll-transition-fast);
}
.ll-footer__brand:hover {
  color: #ffffff;
  opacity: 0.85;
}
.ll-footer__copy {
  color: #e2e8f0;
  margin-top: 0.35rem;
  font-size: 0.825rem;
}
.ll-footer-link {
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color var(--ll-transition-fast);
}
.ll-footer-link:hover {
  color: #fff;
}
.ll-footer-meta {
  border-top-color: rgba(255, 255, 255, 0.1) !important;
  color: #cbd5e1;
  font-size: 0.8rem;
}
</style>
