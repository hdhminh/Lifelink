<template>
  <div>
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h5 class="fw-bold mb-0 text-slate-900">
        <i class="bi bi-people-fill text-wine me-2"></i>System Users
      </h5>
      <div class="ll-search-wrapper dashboard-style-4">
        <i class="bi bi-search ll-search-icon"></i>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          class="form-control form-control-sm"
          type="text"
          :placeholder="`Search ${allSystemUsers.length} users (Name, Phone, City)...`"
        />
      </div>
    </div>

    <div v-if="usersLoading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
    </div>

    <!-- Single Unified User Accounts Table -->
    <div v-else class="ll-card ll-table-card shadow-sm border rounded-3 overflow-hidden">
      <div class="table-responsive dashboard-style-5">
        <table class="table table-sm align-middle mb-0 ll-admin-table dashboard-style-6">
          <thead class="sticky-top bg-slate-50 border-bottom border-slate-200 dashboard-style-7">
            <tr>
              <th class="dashboard-style-8 text-center" scope="col">No.</th>
              <th class="dashboard-style-9" scope="col">User Info</th>
              <th class="dashboard-style-10" scope="col">Phone</th>
              <th class="dashboard-style-11" scope="col">City</th>
              <th class="dashboard-style-12" scope="col">Blood</th>
              <th class="dashboard-style-13" scope="col">Status</th>
              <th class="dashboard-style-14" scope="col">Role</th>
              <th class="dashboard-style-15" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, index) in allSystemUsers.slice(0, userDisplayLimit)" :key="u.id">
              <td class="dashboard-style-16 text-center">{{ index + 1 }}</td>
              <td class="dashboard-style-17">
                <div class="d-flex flex-column">
                  <strong class="text-slate-900 text-truncate dashboard-style-18" :title="u.displayName">{{ u.displayName }}</strong>
                  <span class="text-slate-500 text-truncate dashboard-style-19" :title="u.email">{{ u.email }}</span>
                </div>
              </td>
              <td class="text-truncate dashboard-style-20">
                <a
                  v-if="u.phoneNumber"
                  :href="`tel:${u.phoneNumber}`"
                  class="text-wine text-decoration-none fw-bold dashboard-style-21"
                >
                  <i class="bi bi-telephone-fill me-1"></i>{{ u.phoneNumber }}
                </a>
                <span v-else class="text-muted small">-</span>
              </td>
              <td class="text-truncate dashboard-style-20" :title="u.city">
                {{ u.city }}
              </td>
              <td class="dashboard-style-22">
                <span class="ll-badge-blood d-inline-flex align-items-center justify-content-center" style="height: 32px; padding-left: 12px; padding-right: 12px;">{{ u.bloodType || 'N/A' }}</span>
              </td>
              <td class="dashboard-style-22">
                <span
                  :class="
                    u.canDonateNow !== false
                      ? 'badge bg-success text-white'
                      : 'badge bg-secondary text-white'
                  "
                  class="dashboard-style-23 d-inline-flex align-items-center justify-content-center px-3"
                  style="height: 32px; font-size: 0.85rem;"
                >
                  {{ u.canDonateNow !== false ? 'Ready' : 'Cooldown' }}
                </span>
              </td>
              <td class="dashboard-style-22">
                <select
                  class="form-select form-select-sm d-inline-block shadow-xs ll-select-button dashboard-style-24"
                  style="height: 32px; padding-top: 0; padding-bottom: 0;"
                  :value="u.role || 'donor'"
                  :disabled="u.uid === userProfile.uid"
                  :title="`Change role for ${u.displayName}`"
                  @change="$emit('prompt-role-change', u, $event.target.value, $event)"
                >
                  <option value="donor">Donor</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td class="dashboard-style-25">
                <div class="d-flex justify-content-end align-items-center gap-2 dashboard-style-26">
                  <button
                    class="ll-btn-secondary btn-sm px-2 py-0 d-inline-flex align-items-center justify-content-center dashboard-style-27"
                    style="height: 32px;"
                    type="button"
                    title="View participation history"
                    @click="$emit('view-user-history', u)"
                  >
                    <i class="bi bi-clock-history me-1"></i>History
                  </button>
                  <button
                    class="ll-icon-button ll-icon-button--danger d-inline-flex align-items-center justify-content-center dashboard-style-28"
                    style="height: 32px; width: 32px;"
                    type="button"
                    title="Delete user"
                    :disabled="u.uid === userProfile.uid"
                    @click="$emit('handle-delete-user', u.id)"
                  >
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="allSystemUsers.length === 0">
              <td colspan="8" class="text-center py-4 text-slate-500">
                No matching users found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="allSystemUsers.length > 0"
        class="card-footer bg-slate-50 py-2 px-3 d-flex flex-wrap justify-content-between align-items-center border-top border-slate-200"
      >
        <span class="small text-slate-500 font-weight-500">
          Showing
          <strong>{{ Math.min(userDisplayLimit, allSystemUsers.length) }}</strong> of
          <strong>{{ allSystemUsers.length }}</strong> system users
        </span>
        <button
          v-if="userDisplayLimit < allSystemUsers.length"
          type="button"
          class="btn btn-link text-wine text-decoration-none btn-sm p-0 font-weight-600 dashboard-style-29"
          @click="$emit('load-more-users')"
        >
          Load More <i class="bi bi-chevron-down ms-1"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: { type: String, default: '' },
  usersLoading: { type: Boolean, default: false },
  allSystemUsers: { type: Array, default: () => [] },
  userDisplayLimit: { type: Number, default: 100 },
  userProfile: { type: Object, required: true }
})

defineEmits([
  'update:searchQuery',
  'prompt-role-change',
  'view-user-history',
  'handle-delete-user',
  'load-more-users'
])
</script>
