<template>
  <div class="ll-page-container" style="min-height: 80vh">
    <div class="ll-section-header reveal-header">
      <div>
        <h1 class="ll-section-title">
          <i class="bi bi-calendar-event me-2" style="color: #8e2435"></i> Donation Events
        </h1>

        <p class="ll-text-meta mb-0">Browse upcoming drives, campaigns, and awareness workshops.</p>
      </div>
      <button v-if="isAdmin" type="button" class="ll-btn-primary" @click="openCreateForm">
        <i class="bi bi-plus-lg me-1"></i> New Event
      </button>
    </div>

    <section class="ll-toolbar reveal-header" data-delay="100ms">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-8">
          <label for="event-search" class="ll-text-label mb-1">Search Events</label>
          <div class="ll-search-wrapper">
            <i class="bi bi-search ll-search-icon" aria-hidden="true"></i>
            <input
              id="event-search"
              v-model="searchQuery"
              class="form-control"
              type="search"
              placeholder="Search title, location, or city"
              aria-label="Search title, location, or city"
              autocomplete="off"
            />
          </div>
        </div>
        <div class="col-12 col-md-4">
          <label for="event-category" class="ll-text-label mb-1">Category</label>
          <select
            id="event-category"
            v-model="filterCategory"
            class="form-select"
            aria-label="Filter events by category"
          >
            <option value="">All Categories</option>
            <option value="Drive">Drive</option>
            <option value="Campaign">Campaign</option>
            <option value="Workshop">Workshop</option>
          </select>
        </div>
      </div>
      <p class="ll-text-meta mb-0 mt-3">
        Showing {{ paginatedEvents.length }} of {{ filteredEvents.length }} events
      </p>
    </section>

    <AlertMessage v-if="error" type="danger" :message="error" />

    <LoadingSpinner v-if="loading" message="Loading donation events..." />

    <div>
      <div v-if="paginatedEvents.length === 0" class="ll-empty-state ll-event-fade-in reveal-item">
        <div class="ll-empty-state__icon"><i class="bi bi-calendar-x text-muted"></i></div>
        <div class="ll-empty-state__title">No donation events found</div>
        <p class="ll-empty-state__body">Try clearing your search or category filter.</p>
      </div>

      <section v-else class="row g-4 ll-event-fade-in">
        <div
          v-for="event in paginatedEvents"
          :key="event.id"
          class="col-lg-4 col-md-6 col-12 reveal-item"
        >
          <EventCard
            :event="event"
            :is-logged-in="!!user"
            :is-interested="isInterested(event)"
            :is-admin="isAdmin"
            @toggle-interested="handleToggleInterested(event.id)"
            @edit="openEditForm(event)"
            @delete="handleDelete(event.id)"
          />
        </div>
      </section>

      <PaginationControls
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="currentPage = $event"
      />
    </div>

    <div v-if="showForm && isAdmin" class="ll-form-overlay">
      <div class="ll-page-container ll-event-form-container">
        <EventForm
          :initial-data="editingEvent"
          :is-editing="!!editingEvent"
          @submit="handleFormSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>

    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Event"
      message="Are you sure you want to permanently delete this donation event?"
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Event Interest Double Confirmation Modal -->
    <ConfirmModal
      :show="showInterestModal"
      :title="isRegisteringInterest ? 'Mark Interested' : 'Remove Interest'"
      :message="
        isRegisteringInterest
          ? `Are you sure you want to mark interest for '${pendingInterestEvent?.title}'?`
          : `Are you sure you want to remove your interest for '${pendingInterestEvent?.title}'?`
      "
      :confirm-label="isRegisteringInterest ? 'Interested' : 'Remove Interest'"
      @confirm="commitToggleInterested"
      @cancel="showInterestModal = false"
    />
  </div>
</template>

<script setup>
/**
 * DonationEvents.vue
 * Events listing with search, pagination, Interested toggle, and admin CRUD.
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useDonationEvents } from '@/composables/useDonationEvents.js'
import { useGuestSession } from '@/composables/useGuestSession.js'
import EventCard from '@/components/EventCard.vue'
import EventForm from '@/components/EventForm.vue'
import EmergencyMap from '@/components/EmergencyMap.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useToast } from '@/composables/useToast.js'

const ITEMS_PER_PAGE = 6
const router = useRouter()
const { user, isAdmin } = useAuth()
const {
  events,
  loading,
  error,
  startListening,
  stopListening,
  fetchEvents,
  toggleInterested,
  toggleGuestInterested,
  createEvent,
  updateEvent,
  deleteEvent
} = useDonationEvents()
const { getGuestSession, updateGuestSession } = useGuestSession()

const { showToast } = useToast()

const viewMode = ref('list')
const searchQuery = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const showForm = ref(false)
const editingEvent = ref(null)
const showDeleteModal = ref(false)
const deletingEventId = ref(null)

const showInterestModal = ref(false)
const pendingInterestEvent = ref(null)
const isRegisteringInterest = ref(true)

const guestInterestedEvents = ref([])

const filteredEvents = computed(() => {
  return events.value.filter((e) => {
    const q = searchQuery.value.toLowerCase().trim()
    const matchSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q)
    const matchCategory = !filterCategory.value || e.category === filterCategory.value
    return matchSearch && matchCategory
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredEvents.value.length / ITEMS_PER_PAGE))
)
const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredEvents.value.slice(start, start + ITEMS_PER_PAGE)
})

/**
 * Checks whether the current user marked an event as Interested.
 * @param {Object} event - Event document data.
 * @returns {boolean} Interested state for the current user.
 */
function isInterested(event) {
  if (user.value) {
    return event.likedBy?.includes(user.value.uid)
  }
  const session = getGuestSession()
  const guestInterestId = `guest:${session.guestId}`
  return event.likedBy?.includes(guestInterestId)
}

function handleToggleInterested(eventId) {
  const targetEvent = events.value.find((e) => e.id === eventId)
  if (!targetEvent) return

  const session = getGuestSession()
  const actorId = user.value?.uid || `guest:${session.guestId}`
  pendingInterestEvent.value = targetEvent
  isRegisteringInterest.value = !targetEvent.likedBy?.includes(actorId)
  showInterestModal.value = true
}

async function commitToggleInterested() {
  if (!pendingInterestEvent.value) return
  const targetEvent = pendingInterestEvent.value
  const eventId = targetEvent.id
  const isRegistering = isRegisteringInterest.value

  showInterestModal.value = false
  pendingInterestEvent.value = null

  try {
    if (user.value) {
      await toggleInterested(eventId, user.value.uid)
    } else {
      const session = getGuestSession()
      await toggleGuestInterested(eventId, session.guestId)
      const nextList = isRegistering
        ? [...new Set([...guestInterestedEvents.value, eventId])]
        : guestInterestedEvents.value.filter((id) => String(id) !== String(eventId))
      guestInterestedEvents.value = nextList
      updateGuestSession({ interestedEvents: nextList })
    }
    if (isRegistering) {
      showToast(
        user.value
          ? `Marked interested in "${targetEvent.title}". You can track it in your Dashboard.`
          : `Marked interested in "${targetEvent.title}".`,
        'success'
      )
    } else {
      showToast(`Removed interest for "${targetEvent.title}".`, 'info')
    }
  } catch (err) {
    showToast('Failed to update event interest.', 'danger')
  }
}

/**
 * Opens create event overlay.
 * @returns {void}
 */
function openCreateForm() {
  editingEvent.value = null
  showForm.value = true
}

/**
 * Opens edit event overlay.
 * @param {Object} event - Event document data.
 * @returns {void}
 */
function openEditForm(event) {
  editingEvent.value = { ...event }
  showForm.value = true
}

/**
 * Closes event form overlay.
 * @returns {void}
 */
function closeForm() {
  showForm.value = false
  editingEvent.value = null
}

/**
 * Creates or updates an event.
 * @param {Object} formData - Validated event data.
 * @returns {Promise<void>}
 */
async function handleFormSubmit(formData) {
  try {
    if (editingEvent.value) {
      await updateEvent(editingEvent.value.id, formData)
      showToast('Event updated successfully.', 'success')
    } else {
      await createEvent(formData)
      showToast('Event created successfully.', 'success')
    }
    closeForm()
  } catch (err) {
    showToast(err.message || 'Event operation failed.', 'danger')
  }
}

/**
 * Opens delete confirmation for an event.
 * @param {string} eventId - Event document ID.
 * @returns {void}
 */
function handleDelete(eventId) {
  deletingEventId.value = eventId
  showDeleteModal.value = true
}

/**
 * Deletes the selected event.
 * @returns {Promise<void>}
 */
async function confirmDelete() {
  if (!deletingEventId.value) return
  try {
    await deleteEvent(deletingEventId.value)
    showToast('Event deleted successfully.', 'success')
  } catch (err) {
    showToast(err.message || 'Could not delete event.', 'danger')
  } finally {
    showDeleteModal.value = false
    deletingEventId.value = null
  }
}

import { useScrollReveal } from '@/composables/useScrollReveal.js'

const { reveal } = useScrollReveal()

watch([searchQuery, filterCategory], () => {
  currentPage.value = 1
  if (!user.value) {
    updateGuestSession({
      eventFilters: {
        searchQuery: searchQuery.value,
        category: filterCategory.value
      }
    })
  }
})

watch(
  [loading, paginatedEvents],
  ([newLoading, newEvents]) => {
    if (!newLoading && newEvents.length > 0) {
      reveal('.reveal-item', 60)
    }
  },
  { immediate: true }
)

watch(
  [events, () => user.value],
  ([newEvents, currentUser]) => {
    if (currentUser) return
    const session = getGuestSession()
    const guestInterestId = `guest:${session.guestId}`
    const syncedEventIds = newEvents
      .filter((event) => event.likedBy?.includes(guestInterestId))
      .map((event) => event.id)
    guestInterestedEvents.value = syncedEventIds
    updateGuestSession({ interestedEvents: syncedEventIds })
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  reveal('.reveal-header', 60)
  startListening()
  if (!user.value) {
    const session = getGuestSession()
    if (session.eventFilters) {
      searchQuery.value = session.eventFilters.searchQuery || ''
      filterCategory.value = session.eventFilters.category || ''
    }
    guestInterestedEvents.value = []
  }
})

onUnmounted(() => {
  stopListening()
})
</script>

<style>
.ll-event-form-container {
  max-width: 720px;
  padding-top: 3rem;
  padding-bottom: 3rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ll-event-fade-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
