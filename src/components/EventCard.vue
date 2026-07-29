<template>
  <article class="ll-card h-100 d-flex flex-column">
    <header class="ll-card__header d-flex justify-content-between align-items-center gap-2">
      <span class="ll-date-badge">{{ formattedDate }}</span>
      <span class="ll-badge ll-badge-category">{{ event.category }}</span>
    </header>
    <div class="ll-card__body flex-grow-1">
      <div class="ll-card-title-row mb-1">
        <h5 class="ll-event-title mb-0">{{ displayTitle }}</h5>
        <!-- Internal Live Map Link -->
        <RouterLink
          :to="{ path: '/map', query: { event: event.id } }"
          class="ll-inline-map-link"
          title="View event location on Live Map"
        >
          <i class="bi bi-geo-alt-fill"></i>
          <span>Map</span>
        </RouterLink>
      </div>
      <p class="ll-text-meta mb-1"><i class="bi bi-building me-1"></i> {{ event.city }}</p>
      <p class="ll-text-meta mb-2">{{ event.location }}</p>
      <p class="ll-event-description">{{ event.description }}</p>
    </div>
    <footer class="ll-card__footer">
      <p class="ll-text-meta mb-2">{{ event.interestedCount || 0 }} people interested</p>
      <div v-if="isAdmin" class="d-flex gap-2">
        <button type="button" class="ll-btn-secondary ll-btn-sm flex-fill" @click="emit('edit')">
          <i class="bi bi-pencil me-1"></i> Edit
        </button>
        <button type="button" class="ll-btn-danger ll-btn-sm flex-fill" @click="emit('delete')">
          <i class="bi bi-trash me-1"></i> Delete
        </button>
      </div>
      <button
        v-else
        type="button"
        :class="[
          'll-btn-block',
          'll-event-interest-button',
          isInterested ? 'll-event-interest-button--active' : 'll-event-interest-button--pending'
        ]"
        :title="isLoggedIn ? 'Toggle Interested' : 'Log in to mark Interested'"
        @click="emit('toggle-interested')"
      >
        <i
          :class="[
            isInterested ? 'bi bi-check-circle-fill text-white' : 'bi bi-heart-fill text-white',
            'me-1'
          ]"
        ></i>
        {{ isInterested ? 'Interested' : 'Interested' }}
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
  const title = props.event?.title
  if (!title) return ''
  return title.split(' — ')[0].trim()
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

.font-weight-700 {
  font-weight: 700;
}

.ll-event-interest-button {
  border: 1px solid transparent;
  min-height: 44px;
  border-radius: var(--ll-radius-sm);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  transition:
    background-color var(--ll-transition-fast),
    border-color var(--ll-transition-fast),
    color var(--ll-transition-fast),
    transform var(--ll-transition-fast),
    box-shadow var(--ll-transition-fast);
}

.ll-event-interest-button--pending {
  background: var(--ll-wine-red);
  border-color: var(--ll-wine-red);
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(142, 36, 53, 0.16);
}

.ll-event-interest-button--pending:hover,
.ll-event-interest-button--pending:focus {
  background: #a3263d;
  border-color: #a3263d;
  color: #ffffff;
  transform: translateY(-1px);
}

.ll-event-interest-button--active {
  background: #198754;
  border-color: #198754;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(25, 135, 84, 0.16);
}

.ll-event-interest-button--active:hover,
.ll-event-interest-button--active:focus {
  background: #157347;
  border-color: #157347;
  color: #ffffff;
  transform: translateY(-1px);
}
</style>
