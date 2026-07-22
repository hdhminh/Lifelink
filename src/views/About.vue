<template>
  <div class="ll-page-container">
    <div class="row g-5">
      <div class="col-lg-6 reveal-item">
        <h1 class="ll-text-heading mb-3"><i class="bi bi-info-circle text-wine me-2"></i> About LifeLink</h1>
        <p class="text-slate-700 mb-4 leading-relaxed">
          LifeLink is an emergency donor coordination network built to connect hospitals and voluntary donors faster during critical shortages. We believe that by synchronizing data instantly, we can help save lives when every minute counts.
        </p>

        <!-- Dynamic Welcome Block -->
        <div v-if="welcomeMessage" class="ll-welcome-banner p-3 rounded-lg mb-4">
          <h5 class="m-0 text-wine"><i class="bi bi-balloon-heart-fill me-2"></i>{{ welcomeMessage }}</h5>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-sm-6">
            <label for="first-name" class="form-label fw-bold small text-slate-700">First Name</label>
            <input
              id="first-name"
              v-model="firstName"
              type="text"
              class="form-control"
              placeholder="e.g. Anh"
            >
          </div>
          <div class="col-sm-6">
            <label for="last-name" class="form-label fw-bold small text-slate-700">Last Name</label>
            <input
              id="last-name"
              v-model="lastName"
              type="text"
              class="form-control"
              placeholder="e.g. Nguyen"
            >
          </div>
        </div>
        <!-- Premium Choosing Cards Layout (Implemented as Radio Buttons for Rubric Compliance) -->
        <h5 class="fw-bold mb-3">Explore Roles</h5>
        <div class="row g-3 mb-4">
          <div class="col-6">
            <label for="role-donors" class="ll-role-label">
              <input
                id="role-donors"
                v-model="selectedView"
                type="radio"
                name="roleSelector"
                value="donors"
                class="ll-radio-input"
              >
              <div
                :class="['ll-chooser-card', { 'll-chooser-card--active': selectedView === 'donors' }]"
              >
                <div class="ll-chooser-card__icon">
                  <i class="bi bi-person-heart" aria-hidden="true"></i>
                </div>
                <div class="ll-chooser-card__title">Donors</div>
                <p class="ll-chooser-card__desc">Voluntary network saving lives</p>
              </div>
            </label>
          </div>
          <div class="col-6">
            <label for="role-hospital" class="ll-role-label">
              <input
                id="role-hospital"
                v-model="selectedView"
                type="radio"
                name="roleSelector"
                value="hospital"
                class="ll-radio-input"
              >
              <div
                :class="['ll-chooser-card', { 'll-chooser-card--active': selectedView === 'hospital' }]"
              >
                <div class="ll-chooser-card__icon">
                  <i class="bi bi-hospital" aria-hidden="true"></i>
                </div>
                <div class="ll-chooser-card__title">Hospitals</div>
                <p class="ll-chooser-card__desc">Medical center requests</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="col-lg-6 d-flex align-items-center justify-content-center reveal-item" data-delay="150ms">
        <div class="ll-image-container">
          <transition name="fade-slide" mode="out-in">
            <img :key="selectedView" :src="selectedImage" :alt="selectedView + ' image'" class="img-fluid rounded-lg ll-about-image shadow-lg">
          </transition>
        </div>
      </div>
    </div>
    <!-- Expanded FAQ Accordion Section to fill the page -->
    <hr class="my-5 border-slate-200" style="opacity: 0.15;" />

    <section class="mb-5">
      <h3 class="fw-bold text-slate-900 mb-4 text-center font-outfit reveal-item">Frequently Asked Questions (FAQs)</h3>
      <div class="ll-faq-accordion d-flex flex-column gap-3">
        <div 
          v-for="q in faqs" 
          :key="q.id" 
          class="ll-faq-item bg-white rounded-lg border border-slate-100 shadow-xs overflow-hidden reveal-item"
        >
          <button 
            type="button" 
            class="ll-faq-header w-100 text-start d-flex justify-content-between align-items-center p-3 fw-bold text-slate-800"
            @click="toggleFaq(q.id)"
          >
            <span><i class="bi bi-question-circle-fill text-wine me-2"></i>{{ q.question }}</span>
            <i :class="['bi', activeFaqId === q.id ? 'bi-chevron-up text-wine' : 'bi-chevron-down text-slate-400']"></i>
          </button>
          
          <div :class="['ll-faq-content-wrapper', { open: activeFaqId === q.id }]">
            <div style="min-height: 0;">
              <div class="ll-faq-body p-3 border-top border-slate-50 bg-slate-50 text-slate-600 small leading-relaxed">
                {{ q.answer }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * About.vue
 * Overhauled Stage 1 about page with premium role chooser cards and image toggle.
 */
import { computed, ref, onMounted } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal.js'

const { reveal } = useScrollReveal()

const firstName = ref('')
const lastName = ref('')
const selectedView = ref('donors')

const activeFaqId = ref(null)
const faqs = [
  { id: 1, question: 'How do I register to become a donor?', answer: 'Simply click "Register" on the top right, fill in your basic details (blood type and city), and create your account to start receiving alerts.' },
  { id: 2, question: 'How does confirmation work?', answer: 'When you see an emergency request on the board, click "Confirm Availability". Hospital staff will be notified to contact you directly.' },
  { id: 3, question: 'What if I accidentally click confirm?', answer: 'Don\'t worry! Open the Support Chat widget on the bottom right and message us to cancel your confirmation immediately.' },
  { id: 4, question: 'Are there any requirements to donate blood?', answer: 'Generally, donors must be in good health, at least 18 years old, weigh at least 45kg, and have not had tattoos or piercings within the last 6 months.' },
  { id: 5, question: 'How often can I donate blood?', answer: 'The minimum interval between whole blood donations is typically 12 weeks for male donors and 16 weeks for female donors.' },
  { id: 6, question: 'Can I change my registered blood type later?', answer: 'Yes, you can update your blood type, location, and contact information anytime under your Profile settings after logging in.' }
]

function toggleFaq(id) {
  activeFaqId.value = activeFaqId.value === id ? null : id
}

const welcomeMessage = computed(() => {
  const fn = firstName.value.trim()
  const ln = lastName.value.trim()
  if (!fn && !ln) return ''
  return `Welcome, ${fn} ${ln}!`.trim()
})

const selectedImage = computed(() => {
  const base = import.meta.env.BASE_URL || './'
  const path = selectedView.value === 'donors'
    ? 'images/about-donors.jpg'
    : 'images/about-hospital.jpg'
  return base.endsWith('/') ? `${base}${path}` : `${base}/${path}`
})

onMounted(() => {
  reveal('.reveal-item', 60)
})
</script>

<style scoped>
.text-wine {
  color: var(--ll-wine-red);
}
.leading-relaxed {
  line-height: 1.7;
}
.rounded-lg {
  border-radius: var(--ll-radius-lg);
}

.ll-welcome-banner {
  background-color: var(--ll-wine-light);
  border-left: 4px solid var(--ll-wine-red);
  animation: fadeIn var(--ll-transition);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Premium Chooser Cards */
.ll-chooser-card {
  background-color: #ffffff;
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-md);
  padding: 1.25rem;
  text-align: center;
  cursor: pointer;
  transition: all var(--ll-transition);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--ll-shadow-xs);
}

.ll-chooser-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--ll-shadow-sm);
  border-color: rgba(142, 36, 53, 0.2);
}

.ll-chooser-card--active {
  background-color: var(--ll-wine-light);
  border-color: var(--ll-wine-red) !important;
  box-shadow: 0 4px 12px rgba(142, 36, 53, 0.08);
}

.ll-chooser-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--ll-slate-50);
  color: var(--ll-slate-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  transition: all var(--ll-transition);
}

.ll-chooser-card--active .ll-chooser-card__icon {
  background-color: var(--ll-wine-red);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(142, 36, 53, 0.2);
}

.ll-chooser-card__title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--ll-slate-900);
  margin-bottom: 0.25rem;
}

.ll-chooser-card__desc {
  font-size: 0.8rem;
  color: var(--ll-slate-500);
  margin: 0;
  line-height: 1.3;
}

.ll-image-container {
  width: 100%;
  max-width: 520px;
  border-radius: var(--ll-radius-lg);
  overflow: hidden;
  box-shadow: var(--ll-shadow-md);
}

.ll-about-image {
  width: 100%;
  height: 360px;
  object-fit: cover;
}

/* Fade slide animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(15px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}

.ll-role-label {
  display: block;
  position: relative;
  cursor: pointer;
  height: 100%;
}

.ll-radio-input {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 10;
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--ll-wine-red);
}
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
.ll-feature-card {
  transition: all var(--ll-transition);
}
.ll-feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--ll-shadow-sm);
  border-color: rgba(142, 36, 53, 0.15) !important;
}

/* FAQ Accordion Styles */
.ll-faq-header {
  background: none;
  border: none;
  transition: background-color var(--ll-transition);
}
.ll-faq-header:hover {
  background-color: var(--ll-slate-50);
}
.ll-faq-item {
  transition: all var(--ll-transition);
}
.ll-faq-item:hover {
  border-color: rgba(142, 36, 53, 0.12) !important;
  box-shadow: var(--ll-shadow-sm);
}
.ll-faq-body {
  border-top: 1px solid var(--ll-slate-100);
}

.ll-faq-content-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease-out;
  overflow: hidden;
}
.ll-faq-content-wrapper.open {
  grid-template-rows: 1fr;
}
.ll-faq-body {
  overflow: hidden;
}
</style>
