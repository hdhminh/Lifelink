<template>
  <div>
    <!-- Premium Image Background Hero with Curve Space -->
    <section class="ll-hero-premium">
      <div class="container py-5 px-lg-4 position-relative z-index-2 text-white text-shadow-sm text-start">
        <div class="row">
          <div class="col-lg-9 col-12">
            <span ref="heroBadge" class="ll-badge-hero mb-3 text-uppercase font-weight-700" style="opacity: 0">Connecting Lives Vietnam</span>
            <h1 ref="heroTitle" class="display-3 fw-bold mb-3 ll-hero-title" style="opacity: 0">LifeLink</h1>
            <p ref="heroText" class="lead mb-4 text-white-80" style="max-width: 620px; opacity: 0">
              Connecting voluntary blood donors with hospitals in real-time. Every donation saves a life when seconds count.
            </p>
            <div ref="heroButtons" class="d-flex flex-wrap gap-3" style="opacity: 0">
              <RouterLink to="/emergency-board" class="ll-btn-primary ll-btn-lg text-decoration-none">
                <i class="bi bi-hospital me-2"></i> Browse Board
              </RouterLink>
              <RouterLink
                v-if="!user"
                to="/register"
                class="ll-btn-secondary ll-btn-lg text-decoration-none"
              >
                <i class="bi bi-person-plus me-2"></i> Join as Donor
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Transition Page Container (Beige Theme Layout A) -->
    <div class="ll-home-beige-bg">
      
      <!-- 1. Stats Row Overlapping Curved Bottom of Hero -->
      <div ref="statsContainer" class="ll-stats-overlap-container container max-w-1000">
        <div class="row g-4 text-center justify-content-center">
          <div class="col-md-4">
            <div class="ll-stat-card p-4 bg-white border rounded-lg shadow-sm">
              <div class="ll-stat-number text-wine">{{ donorCount.toLocaleString() }}+</div>
              <div class="ll-stat-label">Registered Donors</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="ll-stat-card p-4 bg-white border rounded-lg shadow-sm">
              <div class="ll-stat-number text-wine">{{ partnerCount }}</div>
              <div class="ll-stat-label">Partner Clinics & Hospitals</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="ll-stat-card p-4 bg-white border rounded-lg shadow-sm">
              <div class="ll-stat-number text-wine">{{ resolveRate }}%</div>
              <div class="ll-stat-label">Critical Requests Resolved</div>
            </div>
          </div>
        </div>
      </div>

      <div class="container max-w-1000">
        
        <!-- Double-Column Editorial Layout -->
        <div class="row g-5 text-start mb-5 pb-3">
          
          <!-- Left Column (Column A): Our Mission text & tambinh image -->
          <div class="col-md-6 ps-md-0 d-flex flex-column gap-5">
            <!-- Our Mission Text Block -->
            <div>
              <span class="ll-badge-subtle ll-badge-subtle--flush mb-2">Our Mission</span>
              <h2 class="ll-text-heading mb-3">Bridging Donors & Hospitals</h2>
              <p class="text-slate-700 mb-3 leading-relaxed" style="font-size: 0.92rem;">
                LifeLink is dedicated to bridging the gap between voluntary blood donors and healthcare facilities across Vietnam. By facilitating real-time coordination, we ensure that critical blood shortages are addressed swiftly and transparently.
              </p>
              <p class="text-slate-700 leading-relaxed font-weight-400" style="font-size: 0.92rem;">
                Our portal empowers individuals to register their donor status, receive location-based emergency notifications, and immediately coordinate safe donations directly with certified hospital staff.
              </p>
            </div>

            <!-- Tambinh Image (home-donation-event.jpg) -->
            <div class="d-block ll-image-frame ll-image-frame--process-photo">
              <img
                src="/images/home-donation-event.jpg"
                alt="Volunteer registration event"
                class="img-fluid rounded-lg shadow-sm"
                style="height: 350px; object-fit: cover; width: 100%;"
              >
            </div>
          </div>

          <!-- Right Column (Column B): Our Mission image (community) & How It Works -->
          <div class="col-md-6 pe-md-0 d-flex flex-column gap-5">
            <!-- Our Mission Image (home-community.jpg) -->
            <div class="d-block ll-image-frame ll-image-frame--mission-photo">
              <img
                src="/images/home-community.jpg"
                alt="Blue gloves preparing blood donation"
                class="img-fluid rounded-lg ll-home-img ll-home-img--mission shadow-md"
              >
            </div>

            <!-- How It Works Section -->
            <div class="ll-process-section">
              <div class="ll-process-section__intro">
                <span class="ll-badge-subtle ll-badge-subtle--flush mb-2">Our Process</span>
                <h2 class="ll-text-heading mb-1" style="font-size: 1.65rem;">How It Works</h2>
                <p class="text-slate-500 small mb-0" style="font-size: 0.85rem;">
                  Follow our simple three-step process to get started with blood donation.
                </p>
              </div>

              <div ref="timelineContainer" class="ll-vertical-steps-timeline position-relative">
                <!-- The vertical connector line -->
                <div class="ll-vertical-connector-line" aria-hidden="true" style="top: 20px; bottom: 20px;"></div>

                <!-- Step 1 -->
                <div class="ll-vertical-step-item position-relative mb-3">
                  <!-- Dot on the line -->
                  <div class="ll-vertical-step-dot"></div>
                  <div class="ll-vertical-step-card d-flex align-items-center bg-white border rounded-lg ms-4 ms-md-5">
                    <div class="ll-vertical-step-circle me-3">
                      <i class="bi bi-person-plus-fill"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-1 text-slate-900" style="font-size: 1.02rem; margin-bottom: 0.15rem;">1. Join Network</h6>
                      <p class="text-slate-500 mb-0" style="font-size: 0.86rem; line-height: 1.4;">Create your secure donor profile with blood type.</p>
                    </div>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="ll-vertical-step-item position-relative mb-3">
                  <div class="ll-vertical-step-dot"></div>
                  <div class="ll-vertical-step-card d-flex align-items-center bg-white border rounded-lg ms-4 ms-md-5">
                    <div class="ll-vertical-step-circle me-3">
                      <i class="bi bi-activity"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-1 text-slate-900" style="font-size: 1.02rem; margin-bottom: 0.15rem;">2. Track Live Board</h6>
                      <p class="text-slate-500 mb-0" style="font-size: 0.86rem; line-height: 1.4;">Monitor the live board for urgent requests.</p>
                    </div>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="ll-vertical-step-item position-relative mb-2">
                  <div class="ll-vertical-step-dot"></div>
                  <div class="ll-vertical-step-card d-flex align-items-center bg-white border rounded-lg ms-4 ms-md-5">
                    <div class="ll-vertical-step-circle me-3">
                      <i class="bi bi-heart-fill"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-1 text-slate-900" style="font-size: 1.02rem; margin-bottom: 0.15rem;">3. Save a Life</h6>
                      <p class="text-slate-500 mb-0" style="font-size: 0.86rem; line-height: 1.4;">Confirm availability and donate at hospital.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Key Features Section -->
        <section ref="featuresContainer" class="mb-5 pb-3 text-start">
          <div class="text-center mb-5">
            <span class="ll-badge-subtle mb-2">What We Offer</span>
            <h2 class="ll-text-heading">Key Features</h2>
            <p class="text-slate-500 small max-w-800 mx-auto">
              Experience a modern coordination network built for real-time safety, speed, and emergency response.
            </p>
          </div>
          <div class="row g-4">
            <div class="col-md-4">
              <div class="ll-feature-card h-100 p-1">
                <div class="ll-card__body d-flex align-items-start p-3">
                  <div class="me-3 mt-1">
                    <i class="bi bi-heart-pulse-fill text-wine fs-2" aria-hidden="true" style="color: var(--ll-wine-red);"></i>
                  </div>
                  <div>
                    <h5 class="fw-bold mb-1" style="font-size: 1.05rem;">Emergency Board</h5>
                    <p class="ll-text-meta mb-0 leading-relaxed" style="font-size: 0.85rem;">Urgent blood requests updated live as hospitals post them. Accessible to everyone instantly.</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="ll-feature-card h-100 p-1">
                <div class="ll-card__body d-flex align-items-start p-3">
                  <div class="me-3 mt-1">
                    <i class="bi bi-people-fill text-wine fs-2" aria-hidden="true" style="color: var(--ll-wine-red);"></i>
                  </div>
                  <div>
                    <h5 class="fw-bold mb-1" style="font-size: 1.05rem;">Donor Matching</h5>
                    <p class="ll-text-meta mb-0 leading-relaxed" style="font-size: 0.85rem;">Matches blood type and location metrics to instantly coordinate available local volunteer donors.</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="ll-feature-card h-100 p-1">
                <div class="ll-card__body d-flex align-items-start p-3">
                  <div class="me-3 mt-1">
                    <i class="bi bi-activity text-wine fs-2" aria-hidden="true" style="color: var(--ll-wine-red);"></i>
                  </div>
                  <div>
                    <h5 class="fw-bold mb-1" style="font-size: 1.05rem;">Real-Time Sync</h5>
                    <p class="ll-text-meta mb-0 leading-relaxed" style="font-size: 0.85rem;">Real-time sync of active requests and donor counts across all dashboards and boards instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. CTA Banner Section -->
        <section class="ll-cta-card-wrapper">
          <div class="ll-cta-banner bg-white border p-4 rounded-lg text-center text-md-start">
            <div class="row align-items-center g-4">
              <div class="col-md-8">
                <h4 class="fw-bold mb-2 text-wine" style="color: var(--ll-wine-red); font-size: 1.35rem;">Ready to make a life-saving impact?</h4>
                <p class="mb-0 text-slate-700 leading-relaxed" style="font-size: 0.9rem;">Join Vietnam's emergency blood donor network. Every single confirmation counts.</p>
              </div>
              <div class="col-md-4 text-md-end">
                <RouterLink
                  v-if="user"
                  to="/emergency-board"
                  class="ll-btn-primary text-decoration-none d-inline-block px-4 py-2"
                >
                  Go to Emergency Board
                </RouterLink>
                <RouterLink
                  v-else
                  to="/register"
                  class="ll-btn-primary text-decoration-none d-inline-block px-4 py-2"
                >
                  Join LifeLink Today
                </RouterLink>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Home.vue
 * Overhauled Stage 1 landing page matching the custom Wine Red & Beige minimal aesthetic.
 */
import { onMounted, ref } from 'vue'
import { animate, stagger } from 'motion'
import { useAuth } from '@/composables/useAuth.js'

const { user } = useAuth()

const donorCount = ref(0)
const partnerCount = ref(0)
const resolveRate = ref(0)

const heroBadge = ref(null)
const heroTitle = ref(null)
const heroText = ref(null)
const heroButtons = ref(null)

const statsContainer = ref(null)
const timelineContainer = ref(null)
const featuresContainer = ref(null)

onMounted(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReduced) {
    donorCount.value = 12486
    partnerCount.value = 48
    resolveRate.value = 98.4
    
    document.querySelectorAll('.ll-feature-card, .ll-vertical-step-item').forEach(el => {
      el.style.opacity = '1'
    })
    
    if (heroBadge.value) heroBadge.value.style.opacity = '1'
    if (heroTitle.value) heroTitle.value.style.opacity = '1'
    if (heroText.value) heroText.value.style.opacity = '1'
    if (heroButtons.value) heroButtons.value.style.opacity = '1'
    return
  }
  
  // Stagger entry for Hero
  animate(
    [heroBadge.value, heroTitle.value, heroText.value, heroButtons.value].filter(Boolean),
    { opacity: [0, 1], y: [16, 0] },
    { delay: stagger(0.08), duration: 0.5, easing: [0.23, 1, 0.32, 1] }
  )
  
  // Intersection Observer for Stats
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(0, 12486, {
          duration: 1.2,
          easing: "ease-out",
          onUpdate: (latest) => { donorCount.value = Math.floor(latest) }
        })
        animate(0, 48, {
          duration: 1.0,
          easing: "ease-out",
          onUpdate: (latest) => { partnerCount.value = Math.floor(latest) }
        })
        animate(0, 98, {
          duration: 0.8,
          easing: "ease-out",
          onUpdate: (latest) => { resolveRate.value = Math.floor(latest) }
        })
        statsObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })
  
  if (statsContainer.value) {
    statsObserver.observe(statsContainer.value)
  }

  // Intersection Observer for Timeline
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const stepItems = entry.target.querySelectorAll('.ll-vertical-step-item')
        animate(
          stepItems,
          { opacity: [0, 1], x: [-16, 0] },
          { delay: stagger(0.12), duration: 0.5, easing: [0.23, 1, 0.32, 1] }
        )
        timelineObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  if (timelineContainer.value) {
    timelineObserver.observe(timelineContainer.value)
  }

  // Intersection Observer for Features
  const featuresObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const featureCards = entry.target.querySelectorAll('.ll-feature-card')
        animate(
          featureCards,
          { opacity: [0, 1], y: [24, 0] },
          { delay: stagger(0.1), duration: 0.6, easing: [0.23, 1, 0.32, 1] }
        )
        featuresObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  if (featuresContainer.value) {
    featuresObserver.observe(featuresContainer.value)
  }
})
</script>

<style scoped>
.z-index-2 {
  z-index: 2;
}

/* Premium Image Background Hero with downward curve border-radius */
.ll-hero-premium {
  position: relative;
  min-height: 480px;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 6rem 0 8rem 0;
  background-image: linear-gradient(rgba(43, 34, 37, 0.72), rgba(43, 34, 37, 0.72)), url('/images/hero-blood-donation.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: scroll;
  border-bottom-left-radius: 50% 30px;
  border-bottom-right-radius: 50% 30px;
}

@media (min-width: 992px) {
  .ll-hero-premium {
    border-bottom-left-radius: 50% 80px;
    border-bottom-right-radius: 50% 80px;
  }
}

.ll-hero-title {
  color: #ffffff;
  letter-spacing: -0.04em;
  line-height: 1.1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.text-white-80 {
  color: rgba(255, 255, 255, 0.85) !important;
}

.text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Light badge-led page background tint */
.ll-home-beige-bg {
  position: relative;
  z-index: 2;
  padding: 2rem 0 6rem 0;
}

/* Stats Row Overlapping curved bottom of hero */
.ll-stats-overlap-container {
  margin-top: -70px;
  position: relative;
  z-index: 3;
  margin-bottom: 5rem;
}

@media (min-width: 992px) {
  .ll-stats-overlap-container {
    margin-top: -110px;
  }
}

.ll-stat-card {
  transition: all var(--ll-transition);
}

.ll-stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--ll-shadow-md) !important;
}

.ll-stat-number {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--ll-wine-red);
  margin-bottom: 0.25rem;
}

.ll-stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ll-slate-500);
}

/* Editorial Mission Layout */
.ll-image-frame {
  position: relative;
  border-radius: var(--ll-radius-lg);
  overflow: hidden;
  box-shadow: var(--ll-shadow-md);
  border: 1px solid var(--ll-slate-200);
}

.ll-home-img {
  width: 100%;
  height: 350px;
  object-fit: cover;
  transition: transform var(--ll-transition-slow);
}

.ll-home-img--mission {
  height: 300px;
}

.ll-image-frame--process-photo {
  margin-top: 3rem;
}

.ll-image-frame:hover .ll-home-img:not(.ll-home-img--mission) {
  transform: scale(1.03);
}

.ll-badge-subtle {
  display: inline-block;
  margin-left: 0;
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ll-wine-red);
  background-color: var(--ll-wine-light);
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
}

.ll-badge-subtle--flush {
  margin-left: -0.75rem;
}

.ll-process-section {
  margin-top: 1.85rem;
}

.ll-process-section__intro {
  margin-bottom: 1.1rem;
}

/* Key Features Grid Card */
.ll-feature-card {
  background: #ffffff;
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-lg);
  box-shadow: var(--ll-shadow-xs);
  transition: all var(--ll-transition);
  opacity: 0;
}

.ll-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--ll-shadow-sm);
  border-color: rgba(142, 36, 53, 0.1);
}

/* Vertical Steps Timeline */
.ll-vertical-steps-timeline {
  position: relative;
}

.ll-vertical-connector-line {
  position: absolute;
  top: 20px;
  bottom: 20px;
  left: 12px;
  width: 2px;
  background-color: var(--ll-wine-red);
  opacity: 0.15;
  z-index: 1;
}

@media (min-width: 768px) {
  .ll-vertical-connector-line {
    left: 24px;
  }
}

.ll-vertical-step-item {
  position: relative;
  z-index: 2;
  opacity: 0;
}

.ll-vertical-step-dot {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--ll-wine-red);
  border: 2px solid #ffffff;
  z-index: 3;
  transition: all var(--ll-transition);
}

@media (min-width: 768px) {
  .ll-vertical-step-dot {
    left: 24px;
  }
}

.ll-vertical-step-card {
  background: #ffffff;
  transition: all var(--ll-transition);
  border: 1px solid var(--ll-slate-200) !important;
  padding: 1rem 1.15rem;
}

.ll-vertical-step-circle {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: var(--ll-wine-light);
  color: var(--ll-wine-red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: var(--ll-shadow-xs);
  transition: all var(--ll-transition);
  flex-shrink: 0;
}

.ll-vertical-step-item:hover .ll-vertical-step-card {
  transform: translateX(6px);
  box-shadow: var(--ll-shadow-sm);
  border-color: rgba(142, 36, 53, 0.2) !important;
}

.ll-vertical-step-item:hover .ll-vertical-step-circle {
  background-color: var(--ll-wine-red);
  color: #ffffff;
  transform: scale(1.05);
}

.ll-vertical-step-item:hover .ll-vertical-step-dot {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 0 4px rgba(142, 36, 53, 0.15);
}

/* CTA Banner Card */
.ll-cta-banner {
  box-shadow: var(--ll-shadow-xs);
  transition: all var(--ll-transition);
}

.ll-cta-banner:hover {
  box-shadow: var(--ll-shadow-sm);
  transform: translateY(-2px);
}

.max-w-800 {
  max-width: 800px;
}
.max-w-1000 {
  max-width: 1000px;
}
.leading-relaxed {
  line-height: 1.7;
}
.rounded-lg {
  border-radius: var(--ll-radius-lg);
}

@media (max-width: 767.98px) {
  .ll-home-img--mission {
    height: 250px;
  }

  .ll-image-frame--process-photo {
    margin-top: 0;
  }

  .ll-process-section {
    margin-top: 0;
  }
}
</style>
