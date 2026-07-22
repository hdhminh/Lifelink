<template>
  <div class="ll-page-container">
    <LoadingSpinner v-if="authLoading || (user && !userProfile)" message="Loading your dashboard..." />
    <div v-else-if="!userProfile" class="ll-empty-state">
      <div class="ll-empty-state__icon"><i class="bi bi-person-fill text-muted"></i></div>
      <div class="ll-empty-state__title">Profile not found</div>
      <p class="ll-empty-state__body">Please log out and sign in again.</p>
    </div>
    <template v-else>
      <!-- Premium Profile Summary Panel -->
      <section class="ll-card mb-5 ll-profile-summary-premium reveal-item">
        <div class="ll-card__body d-flex flex-column flex-md-row justify-content-between gap-4 align-items-md-center">
          <div>
            <h1 class="ll-text-heading mb-2">Welcome back, {{ userProfile.displayName }}!</h1>
            <div class="d-flex flex-wrap align-items-center gap-3 mt-2">
              <span class="small text-slate-700 font-weight-500"><i class="bi bi-geo-alt-fill text-wine me-1"></i> {{ userProfile.city }}</span>
              <span v-if="!isAdmin" :class="['ll-status-pill', eligibleInfo.eligible ? 'll-status-pill--active' : 'll-status-pill--inactive']">
                <span class="ll-status-dot"></span>
                {{ eligibleInfo.eligible ? 'Ready to Donate' : `Cooldown Active (${eligibleInfo.daysLeft} days left)` }}
              </span>
              <span v-else class="ll-status-pill ll-status-pill--admin">
                <i class="bi bi-shield-lock-fill text-wine me-1"></i>
                Authorized Admin
              </span>
            </div>
          </div>
          <div v-if="!isAdmin" class="ll-blood-display-circle">
            <span class="ll-blood-letter">{{ userProfile.bloodType }}</span>
            <span class="ll-blood-label">Type</span>
          </div>
          <div v-else class="ll-admin-display-circle">
            <i class="bi bi-shield-shaded ll-admin-icon"></i>
            <span class="ll-admin-label">Admin</span>
          </div>
        </div>
      </section>

      <!-- Elegant Admin Actions Banner -->
      <section v-if="isAdmin" class="ll-admin-banner-premium mb-5 reveal-item" data-delay="100ms">
        <div>
          <strong class="text-wine fs-5"><i class="bi bi-shield-lock me-2"></i>Admin Operations</strong>
          <p class="mb-0 text-slate-700 small mt-1">Manage emergency requests, events, users, and support threads from one control surface.</p>
        </div>
        <RouterLink to="/admin/requests" class="ll-btn-primary">Manage Requests</RouterLink>
      </section>


      <!-- History Activity Section for Normal Donors -->
      <section class="mt-5 reveal-item" data-delay="150ms" v-if="!isAdmin">
        <div class="ll-section-header">
          <h2 class="ll-section-title"><i class="bi bi-clock-history me-2 text-wine"></i>My Donation Activity</h2>
        </div>
        
        <div class="row g-4">
          <!-- Confirmed Emergency Requests -->
          <div class="col-md-6 col-12">
            <div class="ll-card h-100">
              <div class="ll-card__header d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0 text-wine"><i class="bi bi-heart-fill me-2"></i>Emergency Confirmations</h5>
                <span class="badge bg-danger rounded-pill">{{ confirmations.length }}</span>
              </div>
              <div class="ll-card__body">
                <div v-if="confirmationsLoading" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
                </div>
                <div v-else-if="confirmations.length === 0" class="text-center py-4 text-slate-500">
                  <p class="mb-0">You haven't confirmed any emergency requests yet.</p>
                  <RouterLink to="/emergency-board" class="btn btn-sm btn-outline-danger mt-2">View Board</RouterLink>
                </div>
                <div v-else class="list-group list-group-flush">
                  <div v-for="conf in confirmations" :key="conf.id" class="list-group-item px-0 py-3 border-bottom border-slate-100">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <h6 class="fw-bold mb-1 text-slate-900">
                          {{ conf.hospitalName || 'Emergency Request' }}
                          <span :class="['badge ms-2', getStatusBadgeClass(conf.status)]" style="font-size: 0.65rem; padding: 0.25em 0.5em; border-radius: 4px; font-weight: 700;">
                            {{ conf.status ? conf.status.toUpperCase() : 'CONFIRMED' }}
                          </span>
                        </h6>
                        <p class="small text-slate-500 mb-0">
                          <i class="bi bi-geo-alt-fill text-wine me-1"></i>{{ conf.city }} | Blood: <strong>{{ conf.bloodType }}</strong>
                        </p>
                        <p class="small text-slate-400 mb-0 mt-1">Confirmed on {{ formatDateTime(conf.createdAt) }}</p>
                      </div>
                      <a :href="buildMapsUrl((conf.hospitalName || 'Emergency Request') + ', ' + (conf.city || ''))" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary flex-shrink-0">
                        <i class="bi bi-geo-alt-fill"></i> Map
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Registered Events -->
          <div class="col-md-6 col-12">
            <div class="ll-card h-100">
              <div class="ll-card__header d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0 text-wine"><i class="bi bi-calendar-check-fill me-2"></i>Registered Events</h5>
                <span class="badge rounded-pill" style="background-color: var(--ll-wine-red); color: white;">{{ registeredEvents.length }}</span>
              </div>
              <div class="ll-card__body">
                <div v-if="eventsLoading" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
                </div>
                <div v-else-if="registeredEvents.length === 0" class="text-center py-4 text-slate-500">
                  <p class="mb-0">You haven't registered for any events yet.</p>
                  <RouterLink to="/events" class="btn btn-sm btn-outline-danger mt-2">Browse Events</RouterLink>
                </div>
                <div v-else class="list-group list-group-flush">
                  <div v-for="ev in registeredEvents" :key="ev.id" class="list-group-item px-0 py-3 border-bottom border-slate-100">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <h6 class="fw-bold mb-1 text-slate-900">{{ ev.title }}</h6>
                        <p class="small text-slate-500 mb-0">
                          <i class="bi bi-geo-alt-fill text-wine me-1"></i>{{ ev.location }}, {{ ev.city }}
                        </p>
                        <p class="small text-slate-400 mb-0 mt-1">Date: {{ formatEventDate(ev.date) }}</p>
                      </div>
                      <RouterLink to="/events" class="btn btn-sm btn-outline-primary flex-shrink-0">
                        View
                      </RouterLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- System Overview Section for Admins -->
      <section class="mt-5" v-else>
        <div class="ll-section-header">
          <h2 class="ll-section-title"><i class="bi bi-speedometer2 me-2 text-wine"></i>System Administration Overview</h2>
        </div>
        
        <div v-if="stats.loading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading system metrics...</span>
          </div>
        </div>
        <div v-else>
          <!-- Statistic Cards -->
          <div class="row g-4 text-center mb-5">
            <div class="col-md-3 col-sm-6 col-12">
              <div class="ll-card p-4">
                <div class="ll-stat-number text-wine">{{ stats.usersCount }}</div>
                <div class="ll-stat-label">Total System Users</div>
              </div>
            </div>
            <div class="col-md-3 col-sm-6 col-12">
              <div class="ll-card p-4">
                <div class="ll-stat-number text-wine">{{ stats.activeRequestsCount }}</div>
                <div class="ll-stat-label">Active Requests</div>
              </div>
            </div>
            <div class="col-md-3 col-sm-6 col-12">
              <div class="ll-card p-4">
                <div class="ll-stat-number text-wine">{{ stats.totalConfirmationsCount }}</div>
                <div class="ll-stat-label">Total Confirmations</div>
              </div>
            </div>
            <div class="col-md-3 col-sm-6 col-12">
              <div class="ll-card p-4">
                <div class="ll-stat-number text-wine">{{ stats.eventsCount }}</div>
                <div class="ll-stat-label">Outreach Events</div>
              </div>
            </div>
          </div>

          <!-- Administration Tabs and Directory Lists -->
          <div class="ll-tabs mb-4" role="tablist" aria-label="Admin management directories">
            <button
              type="button"
              class="ll-tab-button"
              :class="{ 'll-tab-button--active': activeAdminTab === 'users' }"
              @click="activeAdminTab = 'users'"
            >
              <i class="bi bi-people-fill me-1"></i> Manage Users
            </button>
            <button
              type="button"
              class="ll-tab-button"
              :class="{ 'll-tab-button--active': activeAdminTab === 'requests' }"
              @click="activeAdminTab = 'requests'"
            >
              <i class="bi bi-exclamation-triangle-fill me-1"></i> Manage Emergency Board
            </button>
            <button
              type="button"
              class="ll-tab-button"
              :class="{ 'll-tab-button--active': activeAdminTab === 'events' }"
              @click="activeAdminTab = 'events'"
            >
              <i class="bi bi-calendar-event-fill me-1"></i> Manage Events
            </button>
            <button
              type="button"
              class="ll-tab-button"
              :class="{ 'll-tab-button--active': activeAdminTab === 'chat' }"
              @click="activeAdminTab = 'chat'"
            >
              <i class="bi bi-chat-dots-fill me-1"></i> Live Support Chat
              <span v-if="unreadChatsCount > 0" class="badge bg-danger rounded-pill ms-1" style="font-size: 0.7rem;">{{ unreadChatsCount }}</span>
            </button>
          </div>

          <!-- User Management Panel -->
          <div v-if="activeAdminTab === 'users'">
            <div v-if="usersLoading" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
            </div>
            <div v-else class="ll-card ll-table-card">
              <div class="table-responsive">
                <table class="table align-middle mb-0 ll-admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">City</th>
                      <th scope="col">Blood</th>
                      <th scope="col">Role</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="u in usersList" :key="u.id">
                      <td><strong>{{ u.displayName }}</strong></td>
                      <td>{{ u.email }}</td>
                      <td>
                        <a v-if="u.phoneNumber" :href="`tel:${u.phoneNumber}`" class="text-wine text-decoration-none fw-bold">
                          <i class="bi bi-telephone-fill me-1"></i>{{ u.phoneNumber }}
                        </a>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td>{{ u.city }}</td>
                      <td><span class="ll-badge-blood">{{ u.bloodType || 'N/A' }}</span></td>
                      <td>
                        <select
                          class="form-select form-select-sm"
                          style="max-width: 120px;"
                          :value="u.role"
                          :disabled="u.uid === userProfile.uid"
                          :title="`Change role for ${u.displayName}`"
                          @change="updateUserRole(u.id, $event.target.value)"
                        >
                          <option value="donor">Donor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <div class="d-flex gap-2">
                          <button
                            class="ll-btn-secondary btn-sm py-1 px-2"
                            style="font-size: 0.75rem;"
                            type="button"
                            title="View participation history"
                            @click="viewUserHistory(u)"
                          >
                            <i class="bi bi-clock-history me-1"></i>History
                          </button>
                          <button
                            class="ll-icon-button ll-icon-button--danger"
                            type="button"
                            title="Delete user"
                            :disabled="u.uid === userProfile.uid"
                            @click="handleDeleteUser(u.id)"
                          >
                            <i class="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="usersList.length === 0">
                      <td colspan="6" class="text-center py-4 text-slate-500">No users found in database.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Emergency Board Management Panel -->
          <div v-else-if="activeAdminTab === 'requests'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0 text-slate-900">Emergency Requests</h5>
              <button class="ll-btn-primary btn-sm px-3" type="button" @click="openCreateRequestForm">
                <i class="bi bi-plus-lg me-1"></i> New Request
              </button>
            </div>
            
            <div class="ll-tabs mb-4" role="tablist" aria-label="Request status filters">
              <button
                v-for="tab in requestStatusTabs"
                :key="tab.value"
                type="button"
                class="ll-tab-button btn-sm py-1 px-3"
                style="font-size: 0.85rem;"
                :class="{ 'll-tab-button--active': selectedRequestStatus === tab.value }"
                @click="selectedRequestStatus = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>

            <div v-if="requestsLoadingState" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
            </div>
            <div v-else class="ll-card ll-table-card">
              <div class="table-responsive">
                <table class="table align-middle mb-0 ll-admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Hospital</th>
                      <th scope="col">City</th>
                      <th scope="col">Blood</th>
                      <th scope="col">Urgency</th>
                      <th scope="col">Status</th>
                      <th scope="col">Units</th>
                      <th scope="col">Confirmed</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="req in filteredAdminRequests" :key="req.id">
                      <tr>
                        <td><strong>{{ req.hospitalName }}</strong></td>
                        <td>{{ req.city }}</td>
                        <td><span class="ll-badge-blood">{{ req.bloodType }}</span></td>
                        <td><span class="ll-badge" v-highlight-urgency="req.urgency">{{ req.urgency }}</span></td>
                        <td>
                          <select
                            class="form-select form-select-sm"
                            :value="req.status"
                            :title="`Change status for ${req.hospitalName}`"
                            @change="handleRequestStatusSelect(req, $event.target.value)"
                          >
                            <option value="active">Active</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>{{ req.unitsNeeded }}</td>
                        <td>{{ req.confirmedCount || 0 }}</td>
                        <td>
                          <div class="d-flex gap-2 align-items-center">
                            <button
                              class="ll-btn-secondary btn-sm py-1 px-2"
                              style="font-size: 0.75rem;"
                              type="button"
                              @click="toggleRequestExpand(req.id)"
                            >
                              <i class="bi" :class="expandedRequestIds.includes(req.id) ? 'bi-chevron-up' : 'bi-people-fill'"></i>
                              Donors ({{ req.confirmedCount || 0 }})
                            </button>
                            <button class="ll-icon-button" type="button" title="Edit request" @click="openEditRequestForm(req)">
                              <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="ll-icon-button ll-icon-button--danger" type="button" title="Delete request" @click="handleDeleteRequest(req.id)">
                              <i class="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Expandable Donors Details Row -->
                      <tr v-if="expandedRequestIds.includes(req.id)" class="ll-expanded-row">
                        <td colspan="8" class="p-3" style="background: #F8FAFC;">
                          <div class="card shadow-none border border-slate-100 mb-0">
                            <div class="card-header py-2 bg-slate-50">
                              <span class="small fw-bold text-slate-800"><i class="bi bi-people-fill text-wine me-1"></i>Confirmed Donors for {{ req.hospitalName }}</span>
                            </div>
                            <div class="card-body p-0">
                              <div v-if="getConfirmationsForRequest(req.id).length === 0" class="text-center py-3 text-slate-400 small">
                                No donors confirmed for this request yet.
                              </div>
                              <table v-else class="table table-sm align-middle mb-0 small">
                                <thead>
                                  <tr class="table-light">
                                    <th scope="col" class="ps-3">Name</th>
                                    <th scope="col">Phone Number</th>
                                    <th scope="col">Blood Type</th>
                                    <th scope="col">Confirmed Date</th>
                                    <th scope="col">Status</th>
                                    <th scope="col" class="text-end pe-3">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="c in getConfirmationsForRequest(req.id)" :key="c.id">
                                    <td class="ps-3"><strong>{{ c.donorName }}</strong></td>
                                    <td>
                                      <a v-if="c.donorPhone && c.donorPhone !== 'N/A'" :href="`tel:${c.donorPhone}`" class="text-wine text-decoration-none fw-bold">
                                        <i class="bi bi-telephone-fill me-1"></i>{{ c.donorPhone }}
                                      </a>
                                      <span v-else class="text-muted">N/A</span>
                                    </td>
                                    <td><span class="badge bg-danger">{{ c.bloodType }}</span></td>
                                    <td>{{ formatDateTime(c.createdAt) }}</td>
                                    <td>
                                      <select
                                        class="form-select form-select-sm"
                                        style="max-width: 120px; font-size: 0.78rem;"
                                        :value="c.status || 'confirmed'"
                                        @change="changeConfirmationStatus(c.id, $event.target.value)"
                                      >
                                        <option value="confirmed">Confirmed</option>
                                        <option value="arrived">Arrived</option>
                                        <option value="donated">Donated</option>
                                        <option value="completed">Completed</option>
                                      </select>
                                    </td>
                                    <td class="text-end pe-3">
                                      <button
                                        class="btn btn-sm btn-outline-danger py-0 px-2"
                                        style="font-size: 0.75rem;"
                                        type="button"
                                        @click="handleCancelConfirmation(c.id, req.id, c.donorName)"
                                      >
                                        <i class="bi bi-x-circle me-1"></i>Cancel Donation
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
                    <tr v-if="filteredAdminRequests.length === 0">
                      <td colspan="8" class="text-center py-4 text-slate-500">No requests found in this status.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Event Management Panel -->
          <div v-else-if="activeAdminTab === 'events'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0 text-slate-900">Campaigns & Drives</h5>
              <button class="ll-btn-primary btn-sm px-3" type="button" @click="openCreateEventForm">
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
                        <td><strong>{{ formatEventTitle(ev.title) }}</strong></td>
                        <td>{{ formatEventDate(ev.date) }}</td>
                        <td><span class="badge bg-secondary">{{ ev.category }}</span></td>
                        <td>{{ ev.location }}</td>
                        <td>{{ ev.city }}</td>
                        <td><i class="bi bi-heart-fill text-wine me-1"></i>{{ ev.interestedCount || 0 }}</td>
                        <td>
                          <div class="d-flex gap-2 align-items-center">
                            <button
                              class="ll-btn-secondary btn-sm py-1 px-2"
                              style="font-size: 0.75rem;"
                              type="button"
                              @click="toggleEventExpand(ev.id)"
                            >
                              <i class="bi" :class="expandedEventIds.includes(ev.id) ? 'bi-chevron-up' : 'bi-people-fill'"></i>
                              Attendees ({{ ev.interestedCount || 0 }})
                            </button>
                            <button class="ll-icon-button" type="button" title="Edit event" @click="openEditEventForm(ev)">
                              <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="ll-icon-button ll-icon-button--danger" type="button" title="Delete event" @click="handleDeleteEvent(ev.id)">
                              <i class="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Expandable Attendees Details Row -->
                      <tr v-if="expandedEventIds.includes(ev.id)" class="ll-expanded-row">
                        <td colspan="7" class="p-3" style="background: #F8FAFC;">
                          <div class="card shadow-none border border-slate-100 mb-0">
                            <div class="card-header py-2 bg-slate-50">
                              <span class="small fw-bold text-slate-800"><i class="bi bi-people-fill text-wine me-1"></i>Registered Attendees for {{ formatEventTitle(ev.title) }}</span>
                            </div>
                            <div class="card-body p-0">
                              <div v-if="getParticipantsForEvent(ev.likedBy).length === 0" class="text-center py-3 text-slate-400 small">
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
                                  <tr v-for="attendee in getParticipantsForEvent(ev.likedBy)" :key="attendee.uid">
                                    <td class="ps-3"><strong>{{ attendee.displayName }}</strong></td>
                                    <td>{{ attendee.email }}</td>
                                    <td class="text-end pe-3">
                                      <button
                                        class="btn btn-sm btn-outline-danger py-0 px-2"
                                        style="font-size: 0.75rem;"
                                        type="button"
                                        @click="removeUserFromEvent(ev.id, attendee.uid, attendee.displayName)"
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
                      <td colspan="7" class="text-center py-4 text-slate-500">No donation events found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Live Support Chat Panel -->
          <div v-else-if="activeAdminTab === 'chat'">
            <div class="row g-4" style="height: 520px;">
              <!-- User Chat Directory (Left Sidebar) -->
              <div class="col-md-4 col-12 h-100 d-flex flex-column">
                <h5 class="fw-bold mb-3 text-slate-900"><i class="bi bi-people-fill text-wine me-2"></i>Active Conversations</h5>
                <div class="list-group list-group-flush flex-grow-1 overflow-y-auto border rounded bg-white">
                  <button
                    v-for="chat in uniqueChats"
                    :key="chat.chatId"
                    type="button"
                    class="list-group-item list-group-item-action py-3 px-3 border-bottom border-slate-100 text-start"
                    :class="{ 'active bg-danger-subtle text-dark border-danger-subtle': activeChatId === chat.chatId }"
                    @click="activeChatId = chat.chatId"
                  >
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <strong class="text-slate-900 small">{{ chat.userDisplayName }}</strong>
                    </div>
                    <p class="mb-0 text-slate-500 text-truncate small" style="max-width: 200px;">
                      {{ chat.lastMessageText }}
                    </p>
                  </button>
                  <div v-if="uniqueChats.length === 0" class="text-center py-5 text-slate-400 small">
                    No active support chats.
                  </div>
                </div>
              </div>

              <!-- Selected Chat Area (Right Pane) -->
              <div class="col-md-8 col-12 h-100 d-flex flex-column">
                <template v-if="activeChatId">
                  <div class="d-flex flex-column h-100 border rounded bg-white overflow-hidden">
                    <!-- Chat Header -->
                    <div class="bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                      <div>
                        <strong class="text-slate-900 d-block small">
                          Chat with {{ uniqueChats.find(c => c.chatId === activeChatId)?.userDisplayName || 'User' }}
                        </strong>
                        <span class="text-slate-400" style="font-size: 0.75rem;">
                          {{ uniqueChats.find(c => c.chatId === activeChatId)?.userEmail }}
                        </span>
                      </div>
                    </div>

                    <!-- Chat Body / Messages -->
                    <div class="flex-grow-1 p-3 overflow-y-auto bg-slate-50 d-flex flex-column gap-2" ref="adminChatScrollContainer" style="height: 350px;">
                      <div
                        v-for="msg in activeChatMessages"
                        :key="msg.id"
                        class="d-flex flex-column"
                        :style="msg.senderId === 'admin' ? 'align-self: flex-end; align-items: flex-end; max-width: 75%;' : 'align-self: flex-start; align-items: flex-start; max-width: 75%;'"
                      >
                        <div
                          class="p-2 rounded small"
                          :style="msg.senderId === 'admin' ? 'background-color: var(--ll-wine-red); color: white; border-bottom-right-radius: 2px;' : 'background-color: white; color: var(--ll-slate-900); border: 1px solid var(--ll-slate-200); border-bottom-left-radius: 2px;'"
                        >
                          {{ msg.text }}
                        </div>
                      </div>
                    </div>

                    <!-- Chat Footer / Input -->
                    <div class="p-3 border-top bg-light">
                      <form @submit.prevent="sendAdminChatMessage" class="d-flex gap-2 align-items-stretch">
                        <input
                          id="admin-chat-input"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Type your reply..."
                          v-model="adminChatInputText"
                          aria-label="Type your reply"
                          autocomplete="off"
                          style="height: 38px;"
                        />
                        <button type="submit" class="btn btn-danger btn-sm px-4 d-flex align-items-center justify-content-center gap-1" style="height: 38px;"><i class="bi bi-send-fill"></i> Send</button>
                      </form>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="border rounded bg-white h-100 d-flex flex-column align-items-center justify-content-center text-slate-400 py-5">
                    <i class="bi bi-chat-left-dots fs-1 mb-2 text-slate-300"></i>
                    <p class="small">Select a conversation from the sidebar to start live support messaging.</p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- User History Details Modal -->
    <div v-if="showUserHistoryModal && selectedHistoryUser" class="ll-form-overlay">
      <div class="ll-page-container" style="max-width: 800px; padding-top: 3rem; padding-bottom: 3rem;">
        <div class="ll-card">
          <div class="ll-card__header d-flex justify-content-between align-items-center">
            <h5 class="fw-bold mb-0 text-wine"><i class="bi bi-clock-history me-2"></i>Participation History: {{ selectedHistoryUser.displayName }}</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="showUserHistoryModal = false"></button>
          </div>
          <div class="ll-card__body p-4">
            <div class="mb-4 pb-3 border-bottom border-slate-100">
              <div class="row g-3">
                <div class="col-sm-6">
                  <span class="text-slate-400 small d-block">Email Address</span>
                  <span class="text-slate-800 fw-bold">{{ selectedHistoryUser.email }}</span>
                </div>
                <div class="col-sm-3">
                  <span class="text-slate-400 small d-block">Blood Type</span>
                  <span class="badge bg-danger">{{ selectedHistoryUser.bloodType || 'N/A' }}</span>
                </div>
                <div class="col-sm-3">
                  <span class="text-slate-400 small d-block">City Location</span>
                  <span class="text-slate-800 fw-bold">{{ selectedHistoryUser.city || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Emergency Board Confirmations List inside User History -->
            <div class="mb-4">
              <h6 class="fw-bold text-wine mb-3"><i class="bi bi-heart-fill me-2"></i>Emergency Board Confirmations ({{ userHistoryConfirmations.length }})</h6>
              <div v-if="userHistoryConfirmations.length === 0" class="text-center py-3 bg-slate-50 text-slate-500 rounded small">
                No active or historical blood donation confirmations.
              </div>
              <div v-else class="table-responsive">
                <table class="table table-sm align-middle mb-0 small">
                  <thead>
                    <tr class="table-light">
                      <th scope="col">Hospital</th>
                      <th scope="col">City</th>
                      <th scope="col">Urgency</th>
                      <th scope="col">Confirmed Date</th>
                      <th scope="col" class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in userHistoryConfirmations" :key="c.id">
                      <td><strong>{{ c.hospitalName }}</strong></td>
                      <td>{{ c.city }}</td>
                      <td><span class="ll-badge" v-highlight-urgency="c.urgency">{{ c.urgency }}</span></td>
                      <td>{{ formatDateTime(c.createdAt) }}</td>
                      <td class="text-end">
                        <button
                          class="btn btn-sm btn-outline-danger py-0 px-2"
                          style="font-size: 0.75rem;"
                          type="button"
                          @click="handleCancelConfirmation(c.id, c.requestId, selectedHistoryUser.displayName)"
                        >
                          <i class="bi bi-x-circle me-1"></i>Cancel
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Registered Outreach Events List inside User History -->
            <div>
              <h6 class="fw-bold text-wine mb-3"><i class="bi bi-calendar-check-fill me-2"></i>Registered Outreach Events ({{ userHistoryEvents.length }})</h6>
              <div v-if="userHistoryEvents.length === 0" class="text-center py-3 bg-slate-50 text-slate-500 rounded small">
                Not registered for any outreach campaign events.
              </div>
              <div v-else class="table-responsive">
                <table class="table table-sm align-middle mb-0 small">
                  <thead>
                    <tr class="table-light">
                      <th scope="col">Event Title</th>
                      <th scope="col">Category</th>
                      <th scope="col">Location</th>
                      <th scope="col">Date</th>
                      <th scope="col" class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ev in userHistoryEvents" :key="ev.id">
                      <td><strong>{{ ev.title }}</strong></td>
                      <td><span class="badge bg-secondary">{{ ev.category }}</span></td>
                      <td>{{ ev.location }}, {{ ev.city }}</td>
                      <td>{{ formatEventDate(ev.date) }}</td>
                      <td class="text-end">
                        <button
                          class="btn btn-sm btn-outline-danger py-0 px-2"
                          style="font-size: 0.75rem;"
                          type="button"
                          @click="removeUserFromEvent(ev.id, selectedHistoryUser.uid || selectedHistoryUser.id, selectedHistoryUser.displayName)"
                        >
                          <i class="bi bi-x-circle me-1"></i>Remove
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="ll-card__footer d-flex justify-content-end gap-2 bg-slate-50 border-top">
            <button type="button" class="ll-btn-secondary px-4" @click="showUserHistoryModal = false">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Request Form Overlay -->
    <div v-if="showRequestForm" class="ll-form-overlay">
      <div class="ll-page-container ll-admin-form-container">
        <RequestForm
          :initial-data="editingRequest"
          :is-editing="!!editingRequest"
          @submit="handleRequestFormSubmit"
          @cancel="closeRequestForm"
        />
      </div>
    </div>

    <!-- Admin Event Form Overlay -->
    <div v-if="showEventForm" class="ll-form-overlay">
      <div class="ll-page-container ll-event-form-container">
        <EventForm
          :initial-data="editingEvent"
          :is-editing="!!editingEvent"
          @submit="handleEventFormSubmit"
          @cancel="closeEventForm"
        />
      </div>
    </div>

    <!-- Confirm Modal for Deleting User -->
    <ConfirmModal
      :show="showUserDeleteModal"
      title="Delete User Account"
      message="Are you sure you want to permanently delete this user profile? This cannot be undone."
      confirm-label="Delete User"
      @confirm="confirmDeleteUser"
      @cancel="showUserDeleteModal = false"
    />

    <!-- Confirm Modal for Deleting Request -->
    <ConfirmModal
      :show="showRequestDeleteModal"
      title="Delete Emergency Request"
      message="Are you sure you want to permanently delete this emergency request? This cannot be undone."
      confirm-label="Delete"
      @confirm="confirmDeleteRequest"
      @cancel="showRequestDeleteModal = false"
    />

    <!-- Confirm Modal for Deleting Event -->
    <ConfirmModal
      :show="showEventDeleteModal"
      title="Delete Donation Event"
      message="Are you sure you want to permanently delete this event? This will also remove registrations."
      confirm-label="Delete Event"
      @confirm="confirmDeleteEvent"
      @cancel="showEventDeleteModal = false"
    />
  </div>
</template>

<script setup>
/**
 * DonorDashboard.vue
 * Role-aware donor dashboard with profile summary and quick actions.
 */
import { ref, watch, reactive, computed, onUnmounted, nextTick } from 'vue'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, arrayRemove, increment, orderBy } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useSupportChat } from '@/composables/useSupportChat.js'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import EventForm from '@/components/EventForm.vue'
import RequestForm from '@/components/RequestForm.vue'
import { useConfirmDonation } from '@/composables/useConfirmDonation.js'
import { useToast } from '@/composables/useToast.js'
import { useEligibility } from '@/composables/useEligibility.js'

const { user, userProfile, isAdmin, authLoading } = useAuth()
const { isEligible, nextEligibleDate, daysUntilEligible } = useEligibility()
const { showToast } = useToast()

watch(isAdmin, (val) => {
  document.title = val ? 'LifeLink - Admin Dashboard' : 'LifeLink - Donor Dashboard'
}, { immediate: true })

const eligibleInfo = computed(() => {
  const lastDate = userProfile.value?.lastDonationDate
  const eligible = isEligible(lastDate)
  if (eligible) {
    return {
      eligible: true,
      statusTitle: 'Ready to Donate',
      statusBody: 'You are eligible to confirm availability for emergency requests.',
      progressPercent: 100,
      daysLeft: 0
    }
  } else {
    const daysLeft = daysUntilEligible(lastDate)
    const nextDate = nextEligibleDate(lastDate)
    const percent = Math.min(100, Math.max(0, ((56 - daysLeft) / 56) * 100))
    return {
      eligible: false,
      statusTitle: 'Cooldown Active',
      statusBody: `Next eligible: ${nextDate ? nextDate.toLocaleDateString('en-AU') : ''}`,
      progressPercent: percent,
      daysLeft
    }
  }
})
const { buildMapsUrl } = useGeolocation()

function formatEventTitle(title) {
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
}
const {
  listenToThreads,
  listenToThreadMessages,
  sendAdminMessage,
  markAdminThreadRead
} = useSupportChat()

const stats = reactive({
  usersCount: 0,
  activeRequestsCount: 0,
  totalConfirmationsCount: 0,
  eventsCount: 0,
  loading: false
})

function updateAdminStatsFromLists() {
  stats.usersCount = usersList.value.length
  stats.activeRequestsCount = requestList.value.filter(req => req.status === 'active').length
  stats.totalConfirmationsCount = allConfirmationsList.value.length
  stats.eventsCount = eventsList.value.length
}

async function loadAdminStats(isSilent = false) {
  if (!isSilent) stats.loading = true
  try {
    await Promise.all([
      fetchUsers(true),
      fetchEvents(true),
      fetchRequests(true),
      fetchAllConfirmations(true)
    ])
    updateAdminStatsFromLists()
  } catch (err) {
    console.error('Error loading admin stats:', err)
  } finally {
    if (!isSilent) stats.loading = false
  }
}


const confirmations = ref([])
const registeredEvents = ref([])
const confirmationsLoading = ref(false)
const eventsLoading = ref(false)

async function loadHistory() {
  if (!userProfile.value) return
  const userId = userProfile.value.uid || userProfile.value.id
  
  confirmationsLoading.value = true
  eventsLoading.value = true
  
  try {
    const qConf = query(
      collection(db, 'confirmations'),
      where('donorId', '==', userId)
    )
    const snapConf = await getDocs(qConf)
    const listConf = []
    
    for (const docSnap of snapConf.docs) {
      const conf = { id: docSnap.id, ...docSnap.data() }
      if (!conf.hospitalName && conf.requestId) {
        try {
          const reqSnap = await getDoc(doc(db, 'emergencyRequests', conf.requestId))
          if (reqSnap.exists()) {
            const reqData = reqSnap.data()
            conf.hospitalName = reqData.hospitalName
            conf.city = reqData.city
            conf.urgency = reqData.urgency
          }
        } catch (err) {
          console.error('Error backfilling request details:', err)
        }
      }
      listConf.push(conf)
    }

    listConf.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0
      const timeB = b.createdAt?.seconds || 0
      return timeB - timeA
    })
    confirmations.value = listConf
  } catch (err) {
    console.error('Error fetching confirmations:', err)
  } finally {
    confirmationsLoading.value = false
  }

  try {
    const qEv = query(
      collection(db, 'events'),
      where('likedBy', 'array-contains', userId)
    )
    const snapEv = await getDocs(qEv)
    const listEv = snapEv.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    listEv.sort((a, b) => new Date(a.date) - new Date(b.date))
    registeredEvents.value = listEv
  } catch (err) {
    console.error('Error fetching registered events:', err)
  } finally {
    eventsLoading.value = false
  }
}

// System Administration Directory & Management
const activeAdminTab = ref('users')
const usersList = ref([])
const eventsList = ref([])
const allConfirmationsList = ref([])
const usersLoading = ref(false)
const adminEventsLoading = ref(false)
const confirmationsLoadingState = ref(false)

async function fetchUsers(isSilent = false) {
  if (!isSilent) usersLoading.value = true
  try {
    const snap = await getDocs(collection(db, 'users'))
    usersList.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error('Error fetching users:', err)
    showToast('Failed to fetch system users.', 'danger')
  } finally {
    if (!isSilent) usersLoading.value = false
  }
}

async function fetchEvents(isSilent = false) {
  if (!isSilent) adminEventsLoading.value = true
  try {
    const snap = await getDocs(collection(db, 'events'))
    eventsList.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    eventsList.value.sort((a, b) => new Date(a.date) - new Date(b.date))
  } catch (err) {
    console.error('Error fetching events:', err)
    showToast('Failed to fetch events.', 'danger')
  } finally {
    if (!isSilent) adminEventsLoading.value = false
  }
}

async function fetchAllConfirmations(isSilent = false) {
  if (!isSilent) confirmationsLoadingState.value = true
  try {
    const snap = await getDocs(collection(db, 'confirmations'))
    allConfirmationsList.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error('Error fetching confirmations:', err)
  } finally {
    if (!isSilent) confirmationsLoadingState.value = false
  }
}

async function updateUserRole(userId, newRole) {
  try {
    await updateDoc(doc(db, 'users', userId), { role: newRole })
    showToast(`User role successfully changed to ${newRole}.`, 'success')
    await fetchUsers(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error updating user role:', err)
    showToast(err.message || 'Failed to update user role.', 'danger')
  }
}

const showUserDeleteModal = ref(false)
const userToDelete = ref(null)

function handleDeleteUser(userId) {
  userToDelete.value = userId
  showUserDeleteModal.value = true
}

async function confirmDeleteUser() {
  if (!userToDelete.value) return
  try {
    await deleteDoc(doc(db, 'users', userToDelete.value))
    showToast('User profile deleted successfully.', 'success')
    await fetchUsers(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error deleting user:', err)
    showToast(err.message || 'Failed to delete user.', 'danger')
  } finally {
    showUserDeleteModal.value = false
    userToDelete.value = null
  }
}

// Emergency Board Request Management
const requestList = ref([])
const requestsLoadingState = ref(false)

const selectedRequestStatus = ref('all')
const showRequestForm = ref(false)
const editingRequest = ref(null)
const showRequestDeleteModal = ref(false)
const requestToDeleteId = ref(null)

const requestStatusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Cancelled', value: 'cancelled' }
]

const filteredAdminRequests = computed(() => {
  if (selectedRequestStatus.value === 'all') return requestList.value
  return requestList.value.filter(req => req.status === selectedRequestStatus.value)
})

async function fetchRequests(isSilent = false) {
  if (!isSilent) requestsLoadingState.value = true
  try {
    const q = query(collection(db, 'emergencyRequests'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    requestList.value = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
  } catch (err) {
    console.error('Error fetching requests:', err)
    showToast('Failed to fetch emergency requests.', 'danger')
  } finally {
    if (!isSilent) requestsLoadingState.value = false
  }
}

function openCreateRequestForm() {
  editingRequest.value = null
  showRequestForm.value = true
}

function openEditRequestForm(req) {
  editingRequest.value = { ...req }
  showRequestForm.value = true
}

function closeRequestForm() {
  showRequestForm.value = false
  editingRequest.value = null
}

async function handleRequestFormSubmit(formData) {
  try {
    const dataToSave = { ...formData }
    const customCreatedAt = dataToSave.createdAt
    delete dataToSave.createdAt

    if (editingRequest.value) {
      await updateDoc(doc(db, 'emergencyRequests', editingRequest.value.id), {
        ...dataToSave,
        createdAt: customCreatedAt || editingRequest.value.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      showToast('Request updated successfully.', 'success')
    } else {
      await addDoc(collection(db, 'emergencyRequests'), {
        ...dataToSave,
        confirmedCount: 0,
        status: 'active',
        createdBy: userProfile.value.uid || userProfile.value.id,
        createdAt: customCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      showToast('Request created successfully.', 'success')
    }
    closeRequestForm()
    await fetchRequests(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error saving request:', err)
    showToast(err.message || 'Request operation failed.', 'danger')
  }
}

async function handleRequestStatusSelect(req, status) {
  try {
    await updateDoc(doc(db, 'emergencyRequests', req.id), {
      status,
      updatedAt: serverTimestamp()
    })
    showToast(`Request marked as ${status}.`, 'success')
    await fetchRequests(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error updating request status:', err)
    showToast(err.message || 'Could not update status.', 'danger')
  }
}

function handleDeleteRequest(requestId) {
  requestToDeleteId.value = requestId
  showRequestDeleteModal.value = true
}

async function confirmDeleteRequest() {
  if (!requestToDeleteId.value) return
  try {
    await deleteDoc(doc(db, 'emergencyRequests', requestToDeleteId.value))
    showToast('Request deleted successfully.', 'success')
    await fetchRequests(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error deleting request:', err)
    showToast(err.message || 'Could not delete request.', 'danger')
  } finally {
    showRequestDeleteModal.value = false
    requestToDeleteId.value = null
  }
}

// Donor cancellation & status workflow logic
const { cancelConfirmation, updateConfirmationStatus } = useConfirmDonation()

async function changeConfirmationStatus(confId, newStatus) {
  try {
    await updateConfirmationStatus(confId, newStatus)
    showToast(`Donation status updated to ${newStatus}.`, 'success')
    await fetchAllConfirmations(true)
    await loadHistory()
  } catch (err) {
    console.error('Error updating status:', err)
    showToast(err.message || 'Failed to update status.', 'danger')
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'arrived': return 'bg-info text-white'
    case 'donated': return 'bg-warning text-dark'
    case 'completed': return 'bg-success text-white'
    default: return 'bg-secondary text-white'
  }
}

async function handleCancelConfirmation(confId, reqId, donorName) {
  try {
    await cancelConfirmation(confId, reqId)
    showToast(`Cancelled blood donation confirmation for donor ${donorName}.`, 'success')
    await fetchAllConfirmations(true)
    await fetchRequests(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error cancelling confirmation:', err)
    showToast(err.message || 'Failed to cancel confirmation.', 'danger')
  }
}

// Event Management
const showEventForm = ref(false)
const editingEvent = ref(null)
const showEventDeleteModal = ref(false)
const eventToDelete = ref(null)

function openCreateEventForm() {
  editingEvent.value = null
  showEventForm.value = true
}

function openEditEventForm(event) {
  editingEvent.value = { ...event }
  showEventForm.value = true
}

function closeEventForm() {
  showEventForm.value = false
  editingEvent.value = null
}

async function handleEventFormSubmit(formData) {
  try {
    if (editingEvent.value) {
      await updateDoc(doc(db, 'events', editingEvent.value.id), {
        ...formData
      })
      showToast('Event updated successfully.', 'success')
    } else {
      await addDoc(collection(db, 'events'), {
        ...formData,
        interestedCount: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      })
      showToast('Event created successfully.', 'success')
    }
    closeEventForm()
    await fetchEvents(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error saving event:', err)
    showToast(err.message || 'Failed to save event.', 'danger')
  }
}

function handleDeleteEvent(eventId) {
  eventToDelete.value = eventId
  showEventDeleteModal.value = true
}

async function confirmDeleteEvent() {
  if (!eventToDelete.value) return
  try {
    await deleteDoc(doc(db, 'events', eventToDelete.value))
    showToast('Event deleted successfully.', 'success')
    await fetchEvents(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error deleting event:', err)
    showToast(err.message || 'Failed to delete event.', 'danger')
  } finally {
    showEventDeleteModal.value = false
    eventToDelete.value = null
  }
}

// Expanded sections inside lists
const expandedRequestIds = ref([])
const expandedEventIds = ref([])

function toggleRequestExpand(reqId) {
  if (expandedRequestIds.value.includes(reqId)) {
    expandedRequestIds.value = expandedRequestIds.value.filter(id => id !== reqId)
  } else {
    expandedRequestIds.value.push(reqId)
  }
}

function toggleEventExpand(eventId) {
  if (expandedEventIds.value.includes(eventId)) {
    expandedEventIds.value = expandedEventIds.value.filter(id => id !== eventId)
  } else {
    expandedEventIds.value.push(eventId)
  }
}

function getConfirmationsForRequest(requestId) {
  return allConfirmationsList.value.filter(c => c.requestId === requestId)
}

function getParticipantsForEvent(likedByArray) {
  if (!likedByArray || likedByArray.length === 0) return []
  return likedByArray.map(uid => {
    const u = usersList.value.find(userItem => userItem.uid === uid || userItem.id === uid)
    return {
      uid,
      displayName: u?.displayName || 'Unknown User',
      email: u?.email || 'N/A'
    }
  })
}

async function removeUserFromEvent(eventId, userId, userName) {
  try {
    const eventRef = doc(db, 'events', eventId)
    await updateDoc(eventRef, {
      likedBy: arrayRemove(userId),
      interestedCount: increment(-1)
    })
    showToast(`Removed registration for ${userName}.`, 'success')
    await fetchEvents(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error removing user from event:', err)
    showToast(err.message || 'Failed to remove user from event.', 'danger')
  }
}

// User History Modal
const selectedHistoryUser = ref(null)
const showUserHistoryModal = ref(false)

const userHistoryConfirmations = computed(() => {
  if (!selectedHistoryUser.value) return []
  const uid = selectedHistoryUser.value.uid || selectedHistoryUser.value.id
  return allConfirmationsList.value.filter(c => c.donorId === uid)
})

const userHistoryEvents = computed(() => {
  if (!selectedHistoryUser.value) return []
  const uid = selectedHistoryUser.value.uid || selectedHistoryUser.value.id
  return eventsList.value.filter(ev => ev.likedBy?.includes(uid))
})

function viewUserHistory(user) {
  selectedHistoryUser.value = user
  showUserHistoryModal.value = true
}

// Support Chat Threads (Admin side)
const supportThreads = ref([])
const activeChatId = ref(null)
const activeChatMessages = ref([])
const adminChatInputText = ref('')
const adminChatScrollContainer = ref(null)
let adminActiveThreadUnsubscribe = null

const uniqueChats = computed(() => {
  return supportThreads.value
    .map((thread) => {
      const code = thread.id ? (thread.id.split('_')[1]?.substring(0, 4).toUpperCase() || 'GUEST') : 'GUEST'
      const defaultGuestName = `Guest #${code}`
      const defaultGuestEmail = `Guest Session #${code}`
      
      let name = thread.participantDisplayName
      if (!name || name === 'Guest User') {
        name = thread.participantType === 'guest' ? defaultGuestName : 'Unknown User'
      }
      let email = thread.participantEmail
      if (!email || email === 'Guest Session') {
        email = thread.participantType === 'guest' ? defaultGuestEmail : 'N/A'
      }

      return {
        chatId: thread.id,
        userDisplayName: name,
        userEmail: email,
        lastMessageText: thread.lastMessage || '',
        lastMessageTime: thread.lastMessageAt?.seconds || 0,
        lastMessageSenderRole: thread.lastMessageSenderRole || 'participant',
        adminLastReadAt: thread.adminLastReadAt?.seconds || 0,
        participantType: thread.participantType || 'guest'
      }
    })
    .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
})

const activeChatThread = computed(() => {
  return uniqueChats.value.find(chat => chat.chatId === activeChatId.value) || null
})

const unreadChatsCount = computed(() => {
  let count = 0
  uniqueChats.value.forEach(chat => {
    const isUnread = chat.lastMessageSenderRole !== 'admin' && chat.lastMessageTime > chat.adminLastReadAt
    if (isUnread && activeChatId.value !== chat.chatId) {
      count++
    }
  })
  return count
})

let adminChatUnsubscribe = null

function listenToAllSupportMessages() {
  if (adminChatUnsubscribe) {
    adminChatUnsubscribe()
    adminChatUnsubscribe = null
  }
  adminChatUnsubscribe = listenToThreads((threads) => {
    supportThreads.value = threads
  }, (err) => {
    console.error('Error listening to support threads:', err)
  })
}

async function sendAdminChatMessage() {
  if (!adminChatInputText.value || !adminChatInputText.value.trim() || !activeChatId.value || !activeChatThread.value) return
  const text = adminChatInputText.value.trim()
  adminChatInputText.value = ''
  
  try {
    await sendAdminMessage({
      threadId: activeChatId.value,
      participantId: activeChatId.value,
      participantType: activeChatThread.value.participantType,
      participantDisplayName: activeChatThread.value.userDisplayName,
      participantEmail: activeChatThread.value.userEmail,
      text
    })
  } catch (err) {
    console.error('Error sending message as admin:', err)
  }
}

watch(activeChatId, async (threadId) => {
  if (adminActiveThreadUnsubscribe) {
    adminActiveThreadUnsubscribe()
    adminActiveThreadUnsubscribe = null
  }

  activeChatMessages.value = []
  if (!threadId) return

  adminActiveThreadUnsubscribe = listenToThreadMessages(threadId, (messages) => {
    activeChatMessages.value = messages
  }, (err) => {
    console.error('Error listening to active support thread messages:', err)
  })

  try {
    await markAdminThreadRead(threadId)
  } catch (err) {
    console.warn('Could not mark admin thread as read:', err)
  }
})

watch(activeChatMessages, () => {
  nextTick(() => {
    if (adminChatScrollContainer.value) {
      adminChatScrollContainer.value.scrollTop = adminChatScrollContainer.value.scrollHeight
    }
  })
}, { deep: true })

watch(userProfile, async (newProfile) => {
  if (newProfile) {
    if (isAdmin.value) {
      await loadAdminStats()
      listenToAllSupportMessages()
    } else {
      loadHistory()
    }
  } else {
    confirmations.value = []
    registeredEvents.value = []
    usersList.value = []
    eventsList.value = []
    requestList.value = []
    allConfirmationsList.value = []
    supportThreads.value = []
    activeChatMessages.value = []
    activeChatId.value = null
    if (adminChatUnsubscribe) {
      adminChatUnsubscribe()
      adminChatUnsubscribe = null
    }
    if (adminActiveThreadUnsubscribe) {
      adminActiveThreadUnsubscribe()
      adminActiveThreadUnsubscribe = null
    }
  }
}, { immediate: true })

function formatDateTime(value) {
  if (!value) return '—'
  const date = value.toDate ? value.toDate() : new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatEventDate(value) {
  if (!value) return '—'
  const date = value.toDate ? value.toDate() : new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

import { useScrollReveal } from '@/composables/useScrollReveal.js'

const { reveal } = useScrollReveal()

watch([authLoading, userProfile], ([newAuth, newProfile]) => {
  if (!newAuth && newProfile) {
    reveal('.reveal-item', 60)
  }
}, { immediate: true })

onUnmounted(() => {
  if (adminChatUnsubscribe) {
    adminChatUnsubscribe()
  }
  if (adminActiveThreadUnsubscribe) {
    adminActiveThreadUnsubscribe()
  }
})
</script>

<style scoped>
.text-wine {
  color: var(--ll-wine-red);
}
.leading-relaxed {
  line-height: 1.6;
}

.border-slate-100 {
  border-color: var(--ll-slate-100) !important;
}

.ll-profile-summary-premium {
  background-color: #ffffff;
  border: 1px solid var(--ll-slate-200);
  box-shadow: var(--ll-shadow-sm);
}

.ll-blood-display-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--ll-wine-light);
  border: 2px solid var(--ll-wine-red);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(142, 36, 53, 0.15);
}

.ll-blood-display-circle .ll-blood-letter {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--ll-wine-red);
  line-height: 1;
}

.ll-blood-display-circle .ll-blood-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ll-slate-500);
  margin-top: 2px;
}

.ll-admin-display-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--ll-wine-light);
  border: 2px solid var(--ll-wine-red);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(142, 36, 53, 0.15);
}

.ll-admin-display-circle .ll-admin-icon {
  font-size: 2rem;
  color: var(--ll-wine-red);
  line-height: 1;
}

.ll-admin-display-circle .ll-admin-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ll-slate-500);
  margin-top: 2px;
}

/* Glowing status pill */
.ll-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.25rem 0.8rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
}

.ll-status-pill--active {
  background-color: var(--ll-success-bg);
  color: var(--ll-success-text);
  border: 1px solid rgba(46, 125, 99, 0.15);
}

.ll-status-pill--inactive {
  background-color: var(--ll-slate-100);
  color: var(--ll-slate-500);
  border: 1px solid var(--ll-slate-200);
}

.ll-status-pill--admin {
  background-color: var(--ll-wine-light);
  color: var(--ll-wine-red);
  border: 1px solid rgba(142, 36, 53, 0.2);
}

.ll-status-pill--active .ll-status-dot {
  width: 7px;
  height: 7px;
  background-color: var(--ll-success);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--ll-success);
}

.ll-status-pill--inactive .ll-status-dot {
  width: 7px;
  height: 7px;
  background-color: var(--ll-slate-400);
  border-radius: 50%;
}

/* Premium Admin Operations Banner */
.ll-admin-banner-premium {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  background: var(--ll-surface);
  border: 1px solid var(--ll-slate-200);
  border-radius: var(--ll-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--ll-shadow-sm);
}

/* Quick Action Circle Icons */
.ll-action-card:hover .ll-action-icon-circle {
  background-color: var(--ll-wine-red);
  color: #ffffff;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(142, 36, 53, 0.2);
}

.ll-action-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--ll-wine-light);
  color: var(--ll-wine-red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  margin: 0 auto;
  transition: all var(--ll-transition);
}

.ll-card p {
  color: var(--ll-slate-500);
}

@media (max-width: 767.98px) {
  .ll-admin-banner-premium {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
}

.ll-stat-number {
  font-family: 'Outfit', sans-serif;
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.2;
}

.ll-stat-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ll-slate-500);
  margin-top: 0.25rem;
}

.ll-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ll-tab-button {
  border: 1px solid var(--ll-slate-300);
  background: var(--ll-surface);
  color: var(--ll-slate-700);
  border-radius: var(--ll-radius-sm);
  padding: 0.45rem 0.9rem;
  font-weight: 600;
  transition: all var(--ll-transition);
}

.ll-tab-button--active {
  border-color: var(--ll-crimson);
  background: var(--ll-crimson-light);
  color: var(--ll-crimson-dark);
}

.ll-table-card {
  overflow: visible;
}

.ll-admin-table th {
  color: var(--ll-slate-700);
  font-size: 0.8125rem;
  font-weight: 700;
  background: var(--ll-surface-alt);
  white-space: nowrap;
}

.ll-admin-table td {
  color: var(--ll-slate-700);
  font-size: 0.875rem;
}

.ll-icon-button {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--ll-slate-300);
  background: var(--ll-surface);
  color: var(--ll-slate-700);
  border-radius: var(--ll-radius-sm);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ll-icon-button:hover {
  background: var(--ll-slate-100);
}

.ll-icon-button--danger {
  color: var(--ll-error);
  border-color: #FECACA;
}

.ll-admin-form-container, .ll-event-form-container {
  max-width: 720px;
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.ll-expanded-row td {
  border-bottom: 1px solid var(--ll-slate-200);
}
</style>
