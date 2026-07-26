<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="fw-bold mb-0 text-slate-900">
        <i class="bi bi-calendar-event-fill text-wine me-2"></i>Campaigns & Drives
      </h5>
      <button class="ll-btn-primary btn-sm px-3" type="button" @click="$emit('open-create-event-form')">
        <i class="bi bi-plus-lg me-1"></i> New Event
      </button>
    </div>
    <div v-if="adminEventsLoading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
    </div>
    <div v-else class="ll-card ll-table-card">
      <div class="table-responsive">
        <table class="table align-middle mb-0 ll-admin-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Date</th>
              <th scope="col">Category</th>
              <th scope="col">Location</th>
              <th scope="col">City</th>
              <th scope="col">Interested</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="ev in eventsList" :key="ev.id">
              <tr>
                <td>
                  <strong>{{ formatEventTitle(ev.title) }}</strong>
                </td>
                <td>{{ formatEventDate(ev.date) }}</td>
                <td>
                  <span class="badge bg-secondary">{{ ev.category }}</span>
                </td>
                <td>{{ ev.location }}</td>
                <td>{{ ev.city }}</td>
                <td>
                  <i class="bi bi-heart-fill text-wine me-1"></i
                  >{{ ev.interestedCount || 0 }}
                </td>
                <td>
                  <div class="d-flex gap-2 align-items-center">
                    <button
                      class="ll-btn-secondary btn-sm py-1 px-2 dashboard-style-31"
                      type="button"
                      @click="$emit('toggle-event-expand', ev.id)"
                    >
                      <i
                        class="bi"
                        :class="
                          expandedEventIds.includes(ev.id)
                            ? 'bi-chevron-up'
                            : 'bi-people-fill'
                        "
                      ></i>
                      Attendees ({{ ev.interestedCount || 0 }})
                    </button>
                    <button
                      class="ll-icon-button"
                      type="button"
                      title="Edit event"
                      @click="$emit('open-edit-event-form', ev)"
                    >
                      <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button
                      class="ll-icon-button ll-icon-button--danger"
                      type="button"
                      title="Delete event"
                      @click="$emit('handle-delete-event', ev.id)"
                    >
                      <i class="bi bi-trash-fill"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Expandable Attendees Details Row -->
              <tr v-if="expandedEventIds.includes(ev.id)" class="ll-expanded-row">
                <td colspan="7" class="p-3 dashboard-style-32">
                  <div class="card shadow-none border border-slate-100 mb-0">
                    <div class="card-header py-2 bg-slate-50">
                      <span class="small fw-bold text-slate-800"
                        ><i class="bi bi-people-fill text-wine me-1"></i>Registered
                        Attendees for {{ formatEventTitle(ev.title) }}</span
                      >
                    </div>
                    <div class="card-body p-0">
                      <div
                        v-if="getParticipantsForEvent(ev.likedBy).length === 0"
                        class="text-center py-3 text-slate-400 small"
                      >
                        No attendees registered for this event yet.
                      </div>
                      <table v-else class="table table-sm align-middle mb-0 small">
                        <thead>
                          <tr class="table-light">
                            <th scope="col" class="ps-3">Name</th>
                            <th scope="col">Email</th>
                            <th scope="col" class="text-end pe-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="attendee in getParticipantsForEvent(ev.likedBy)"
                            :key="attendee.uid"
                          >
                            <td class="ps-3">
                              <strong>{{ attendee.displayName }}</strong>
                            </td>
                            <td>{{ attendee.email }}</td>
                            <td class="text-end pe-3">
                              <button
                                class="btn btn-sm btn-outline-danger py-0 px-2 dashboard-style-31"
                                type="button"
                                @click="
                                  $emit('remove-user-from-event', ev.id, attendee.uid, attendee.displayName)
                                "
                              >
                                <i class="bi bi-x-circle me-1"></i>Remove Attendance
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="eventsList.length === 0">
              <td colspan="7" class="text-center py-4 text-slate-500">
                No donation events found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  adminEventsLoading: { type: Boolean, default: false },
  eventsList: { type: Array, default: () => [] },
  expandedEventIds: { type: Array, default: () => [] },
  getParticipantsForEvent: { type: Function, required: true },
  formatEventTitle: { type: Function, required: true },
  formatEventDate: { type: Function, required: true }
})

defineEmits([
  'open-create-event-form',
  'toggle-event-expand',
  'open-edit-event-form',
  'handle-delete-event',
  'remove-user-from-event'
])
</script>
