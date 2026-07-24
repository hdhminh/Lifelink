<template>
  <article class="ll-card h-100 d-flex flex-column">
    <header class="ll-card__header d-flex justify-content-between align-items-center gap-2">
      <span class="ll-date-badge">{{ formattedDate }}</span>
      <span class="ll-badge ll-badge-category">{{ event.category }}</span>
    </header>
    <div class="ll-card__body flex-grow-1">
      <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
        <h5 class="ll-event-title mb-0">{{ displayTitle }}</h5>
        <!-- Internal Live Map Link -->
        <RouterLink
          :to="{ path: '/map', query: { event: event.id } }"
          class="ll-maps-link text-decoration-none small text-wine font-weight-700"
          title="View event location on Live Map"
        >
          <i class="bi bi-geo-alt-fill"></i> Map
        </RouterLink>

      </div>
      <p class="ll-text-meta mb-1"><i class="bi bi-building me-1"></i> {{ event.city }}</p>
      <p class="ll-text-meta mb-3">{{ event.location }}</p>
      <p class="ll-event-description">{{ event.description }}</p>
    </div>
    <footer class="ll-card__footer">
      <p class="ll-text-meta mb-3">{{ event.interestedCount || 0 }} people interested</p>
      <div v-if="isAdmin" class="d-flex gap-2">
        <button type="button" class="ll-btn-secondary ll-btn-sm flex-fill" @click="emit('edit')"><i class="bi bi-pencil me-1"></i> Edit</button>
        <button type="button" class="ll-btn-danger ll-btn-sm flex-fill" @click="emit('delete')"><i class="bi bi-trash me-1"></i> Delete</button>
      </div>
      <button
        v-else
        type="button"
        :class="[isInterested ? 'll-btn-primary' : 'll-btn-secondary', 'll-btn-block']"
        :title="isLoggedIn ? 'Toggle Interested' : 'Log in to mark Interested'"
        @click="emit('toggle-interested')"
      >
        <i :class="[isInterested ? 'bi bi-check-circle-fill text-white' : 'bi-heart', 'me-1']"></i>
        {{ isInterested ? 'Interested (Registered)' : 'Interested' }}
      </button>
    </footer>
  </article>
</template>

<script setup>
/**
 * EventCard.vue
 * Displays a donation event with Interested and admin actions.
 */
import { computed } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation.js'

const { buildMapsUrl } = useGeolocation()

const props = defineProps({
  event: { type: Object, required: true },
  isLoggedIn: { type: Boolean, default: false },
  isInterested: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-interested', 'edit', 'delete'])

const displayTitle = computed(() => {
  const title = props.event.title
  if (!title) return ''
  const parts = title.split(' — ')
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim()
    const lowerLast = lastPart.toLowerCase()
    const isEventTopic = lowerLast.includes('drive') || 
                         lowerLast.includes('festival') || 
                         lowerLast.includes('campaign') || 
                         lowerLast.includes('blood') || 
                         lowerLast.includes('ceremony') || 
                         lowerLast.includes('workshop') ||
                         lowerLast.includes('meeting') ||
                         lowerLast.includes('opening')
    if (!isEventTopic) {
      return parts.slice(0, -1).join(' — ').trim()
    }
  }
  return title
})

const formattedDate = computed(() => {
  if (!props.event.date) return 'Date TBC'
  return new Date(`${props.event.date}T00:00:00`).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
})
</script>

<style scoped>
.ll-date-badge {
  color: var(--ll-wine-red);
  background: var(--ll-wine-light);
  border: 1px solid rgba(142, 36, 53, 0.2);
  border-radius: var(--ll-radius-sm);
  padding: 0.25rem 0.55rem;
  font-size: 0.8125rem;
  font-weight: 700;
}

.ll-event-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ll-slate-900);
}

.ll-event-description {
  color: var(--ll-slate-500);
  font-size: 0.9rem;
  margin-bottom: 0;
}

.text-wine {
  color: var(--ll-wine-red);
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
.font-weight-700 {
  font-weight: 700;
}
</style>
