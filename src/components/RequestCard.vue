<template>
  <article
    ref="cardElement"
    :class="['ll-card', 'll-request-card', `ll-request-card--${request.urgency}`]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <header class="ll-card__header d-flex flex-column align-items-stretch gap-1">
      <div class="d-flex justify-content-between align-items-center w-100">
        <span class="ll-badge-blood-compact"><i class="bi bi-droplet-fill me-1 text-white"></i> {{ request.bloodType }}</span>
        <span class="ll-badge" v-highlight-urgency="request.urgency">● {{ request.urgency }}</span>
      </div>
      <div v-if="(!isAdmin && isCompatibleDonor) || isExpired || timeAgoText" class="d-flex flex-wrap align-items-center gap-2 mt-1">
        <span v-if="!isAdmin && isCompatibleDonor" class="badge bg-success text-white px-2 py-1" style="font-size: 0.68rem; border-radius: 12px; font-weight: 700; letter-spacing: 0.02em; display: inline-flex; align-items: center;">
          <i class="bi bi-heart-pulse-fill me-1"></i>Compatible
        </span>
        <span v-if="isExpired" class="badge bg-secondary text-white px-2 py-1" style="font-size: 0.68rem; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center;">
          <i class="bi bi-clock-fill me-1"></i>Expired
        </span>
        <span v-else-if="timeAgoText" class="text-slate-400 extra-small" :title="'Published: ' + formattedPublishDate" style="font-size: 0.7rem; display: inline-flex; align-items: center; cursor: help;">
          <i class="bi bi-clock me-1"></i>{{ timeAgoText }}
        </span>
      </div>
    </header>

    <div class="ll-card__body">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
        <h5 class="ll-request-title mb-0">{{ request.hospitalName }}</h5>
        <!-- Google Maps Link -->
        <a
          :href="buildMapsUrl(request.hospitalName + ', ' + request.city)"
          target="_blank"
          rel="noopener"
          class="ll-maps-link text-decoration-none small text-wine font-weight-700"
          title="Get directions on Google Maps"
        >
          <i class="bi bi-geo-alt-fill"></i> Map
        </a>
      </div>
      <p class="ll-text-meta mb-3"><i class="bi bi-building me-1"></i> {{ request.city }}</p>

      <div class="ll-request-metrics mb-2">
        <span>Still needed:</span>
        <strong class="text-wine">{{ stillNeeded }} units</strong>
      </div>
      <p class="ll-text-meta mb-2">
        Confirmed: {{ request.confirmedCount || 0 }} / {{ request.unitsNeeded }}
        <span v-if="request.arrivedCount || request.donatedCount || request.completedCount" class="text-slate-400 font-weight-normal ms-1" style="font-size: 0.78rem;">
          ({{ request.arrivedCount || 0 }} arrived, {{ request.donatedCount || 0 }} donated, {{ request.completedCount || 0 }} completed)
        </span>
      </p>
      <div class="ll-progress mb-3" aria-label="Donation confirmation progress">
        <div
          class="ll-progress-bar"
          :class="{ 'll-progress-bar--critical': request.urgency === 'critical' }"
          :style="{ width: `${progressWidth}%` }"
        ></div>
      </div>

      <p class="ll-request-description">{{ request.description }}</p>
      
      <!-- Contact Info with quick call trigger -->
      <div class="d-flex justify-content-between align-items-center ll-card-contact-row">
        <span class="small text-slate-500 font-weight-500">
          <i class="bi bi-info-circle me-1"></i> Contact us
        </span>
        <a :href="'tel:' + contactPhone" class="btn btn-outline-danger btn-sm py-0 px-2" style="font-size: 0.75rem;">
          <i class="bi-telephone-fill me-1"></i> Call {{ contactPhone }}
        </a>
      </div>
    </div>

    <footer class="ll-card__footer">
      <div v-if="isAdmin" class="d-flex flex-wrap gap-2">
        <button type="button" class="ll-btn-secondary ll-btn-sm flex-fill" @click="emit('edit')"><i class="bi bi-pencil me-1"></i> Edit</button>
        <button type="button" class="ll-btn-secondary ll-btn-sm flex-fill" @click="emit('status-change')">
          <i :class="[request.status === 'active' ? 'bi bi-check-lg' : 'bi bi-play-fill', 'me-1']"></i>
          {{ request.status === 'active' ? 'Fulfil' : 'Activate' }}
        </button>
        <button type="button" class="ll-btn-danger ll-btn-sm flex-fill" @click="emit('delete')"><i class="bi bi-trash me-1"></i> Delete</button>
      </div>
      <button
        v-else
        type="button"
        class="ll-btn-primary ll-btn-block"
        :class="{ 'll-btn-disabled': (!eligibility.eligible || isExpired) && stillNeeded > 0 }"
        :disabled="stillNeeded <= 0 || confirming || !eligibility.eligible || isExpired"
        @click="emit('confirm')"
      >
        <i class="bi" :class="isExpired ? 'bi-x-circle' : (eligibility.eligible ? 'bi-heart-fill' : 'bi-hourglass-split')"></i>
        <span class="ms-1">
          {{ confirming ? 'Confirming...' : (isExpired ? 'Request Expired' : (eligibility.eligible ? 'Confirm Availability' : `Cooldown (${eligibility.daysLeft}d left)`)) }}
        </span>
      </button>
      <div v-if="!isAdmin && !eligibility.eligible" class="text-center mt-2 text-warning small font-weight-500" style="font-size: 0.75rem; width: 100%;">
        <i class="bi bi-exclamation-circle-fill me-1"></i> You can donate again on {{ eligibility.nextDateFormatted }}
      </div>
      <div v-if="!isAdmin && isExpired" class="text-center mt-2 text-slate-400 small font-weight-500" style="font-size: 0.75rem; width: 100%;">
        <i class="bi bi-info-circle me-1"></i> This request has expired.
      </div>
    </footer>
  </article>
</template>

<script setup>
/**
 * RequestCard.vue
 * Displays one emergency request with urgency hierarchy and donor/admin actions.
 */
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { animate } from 'motion'
import { useAuth } from '@/composables/useAuth.js'
import { useEligibility } from '@/composables/useEligibility.js'

const { buildMapsUrl } = useGeolocation()
const { userProfile } = useAuth()
const { isEligible, daysUntilEligible, nextEligibleDate } = useEligibility()
import { canDonateTo } from '@/utils/bloodCompatibility.js'

const isCompatibleDonor = computed(() => {
  if (!userProfile.value) return false
  return canDonateTo(userProfile.value.bloodType, props.request.bloodType)
})

const props = defineProps({
  request: { type: Object, required: true },
  isAdmin: { type: Boolean, default: false },
  confirming: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'edit', 'delete', 'status-change'])

const eligibility = computed(() => {
  if (!userProfile.value) return { eligible: true, daysLeft: 0, nextDateFormatted: '' }
  const lastDate = userProfile.value.lastDonationDate
  const eligible = isEligible(lastDate)
  const daysLeft = daysUntilEligible(lastDate)
  const nextDate = nextEligibleDate(lastDate)
  return {
    eligible,
    daysLeft,
    nextDateFormatted: nextDate ? nextDate.toLocaleDateString('en-AU') : ''
  }
})

const stillNeeded = computed(() => Math.max(0, props.request.unitsNeeded - (props.request.confirmedCount || 0)))
const progressPercent = computed(() => Math.min(100, (((props.request.confirmedCount || 0) / props.request.unitsNeeded) * 100) || 0))

const formattedPublishDate = computed(() => {
  if (!props.request.createdAt) return ''
  const date = props.request.createdAt.toDate ? props.request.createdAt.toDate() : new Date(props.request.createdAt)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const contactPhone = computed(() => {
  const info = props.request.contactInfo?.trim()
  if (!info) return '115'
  
  const phonePattern = /^[0-9\s+\-()]{3,20}$/
  if (phonePattern.test(info)) {
    return info
  }
  return '115'
})

const progressWidth = ref(0)
const timeAgoText = ref('')
const isExpired = ref(false)
let timerId = null

function updateTimeAgo() {
  if (!props.request.createdAt) {
    timeAgoText.value = ''
    isExpired.value = false
    return
  }
  const createdSecs = props.request.createdAt.seconds || (new Date(props.request.createdAt).getTime() / 1000)
  const diffMs = Date.now() - (createdSecs * 1000)
  
  // Expiry thresholds: 24h Critical, 48h Urgent, 72h Moderate
  let thresholdHours = 72
  if (props.request.urgency === 'critical') thresholdHours = 24
  else if (props.request.urgency === 'urgent') thresholdHours = 48
  
  // Extend threshold in development so that demo data doesn't expire
  if (import.meta.env.DEV) {
    thresholdHours = 720 // 30 days
  }
  
  const thresholdMs = thresholdHours * 60 * 60 * 1000
  if (diffMs >= thresholdMs) {
    isExpired.value = true
  } else {
    isExpired.value = false
  }

  const diffMins = Math.floor(diffMs / (60 * 1000))
  if (diffMins < 1) {
    timeAgoText.value = 'just now'
  } else if (diffMins < 60) {
    timeAgoText.value = `${diffMins}m ago`
  } else {
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    if (hours < 24) {
      timeAgoText.value = `${hours}h ${mins}m ago`
    } else {
      const days = Math.floor(hours / 24)
      timeAgoText.value = `${days}d ago`
    }
  }
}

onMounted(() => {
  updateTimeAgo()
  timerId = setInterval(updateTimeAgo, 60 * 1000)
  setTimeout(() => {
    progressWidth.value = progressPercent.value
  }, 50)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

watch(progressPercent, (newVal) => {
  progressWidth.value = newVal
})

const cardElement = ref(null)

function handleMouseEnter() {
  animate(
    cardElement.value,
    { scale: 1.018, y: -4 },
    { type: "spring", stiffness: 260, damping: 20 }
  )
}

function handleMouseLeave() {
  animate(
    cardElement.value,
    { scale: 1, y: 0 },
    { type: "spring", stiffness: 260, damping: 20 }
  )
}
</script>

<style scoped>
.ll-request-card {
  border-top: 4px solid transparent !important;
  transition: box-shadow var(--ll-transition), border-color var(--ll-transition) !important;
}
.ll-request-card:hover {
  transform: none !important;
}
.ll-request-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ll-slate-900);
}

.ll-request-metrics {
  display: flex;
  justify-content: space-between;
  color: var(--ll-slate-700);
}

.text-wine {
  color: var(--ll-wine-red);
}

.ll-badge-blood-compact {
  background-color: var(--ll-wine-red);
  color: #fff;
  font-size: 0.76rem;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(142, 36, 53, 0.15);
  display: inline-flex;
  align-items: center;
}

.ll-maps-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  transition: opacity var(--ll-transition-fast);
  line-height: 1;
}

.ll-maps-link i {
  display: inline-flex;
  align-items: center;
  font-size: 0.95em;
  transform: translateY(-0.5px);
}

.ll-maps-link:hover {
  opacity: 0.75;
}

.ll-request-description {
  color: var(--ll-slate-500);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.font-weight-700 {
  font-weight: 700;
}

.ll-card-contact-row {
  border-top: 1px solid var(--ll-slate-200);
  margin-top: 1rem;
  padding-top: 0.85rem;
  margin-bottom: -0.65rem;
}
</style>
