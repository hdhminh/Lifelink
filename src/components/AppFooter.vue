<script setup>
/**
 * AppFooter.vue
 *
 * Global application footer component containing quick navigation links,
 * branding, copyright notice, and emergency network declaration.
 */
</script>

<template>
  <footer class="ll-footer mt-auto">
    <div class="container-fluid px-4 px-lg-5" style="max-width: 1440px; margin: 0 auto;">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <RouterLink to="/" class="ll-footer__brand text-decoration-none d-inline-block">
            <i class="bi bi-droplet-fill text-danger me-1"></i> LifeLink
          </RouterLink>
          <div class="ll-footer__copy">Emergency donor coordination network</div>
        </div>
        <div class="d-flex flex-wrap gap-4">
          <RouterLink to="/emergency-board" class="text-decoration-none ll-footer-link"><i class="bi bi-hospital me-1"></i> Emergency Board</RouterLink>
          <RouterLink to="/events" class="text-decoration-none ll-footer-link"><i class="bi bi-calendar-event me-1"></i> Events</RouterLink>
          <RouterLink to="/map" class="text-decoration-none ll-footer-link"><i class="bi bi-geo-alt-fill me-1"></i> Live Map</RouterLink>
          <RouterLink to="/news" class="text-decoration-none ll-footer-link"><i class="bi bi-newspaper me-1"></i> News</RouterLink>
          <RouterLink to="/about" class="text-decoration-none ll-footer-link"><i class="bi bi-info-circle me-1"></i> About</RouterLink>
        </div>
      </div>
      <div class="mt-4 pt-3 border-top ll-footer-meta d-flex justify-content-between flex-wrap gap-2">
        <span>Emergency Blood Donor Network &copy; 2026.</span>
        <span>LifeLink Vietnam • Saving Lives Together</span>
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
  color: #F87171;
  letter-spacing: -0.02em;
  transition: opacity var(--ll-transition-fast);
}
.ll-footer__brand:hover {
  color: #F87171;
  opacity: 0.85;
}
.ll-footer__copy {
  color: #E2E8F0;
  margin-top: 0.35rem;
  font-size: 0.825rem;
}
.ll-footer-link {
  color: #E2E8F0;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color var(--ll-transition-fast);
}
.ll-footer-link:hover {
  color: #fff;
}
.ll-footer-meta {
  border-top-color: rgba(255, 255, 255, 0.1) !important;
  color: #CBD5E1;
  font-size: 0.8rem;
}
</style>
