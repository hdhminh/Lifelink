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
                  <span class="d-inline-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style="background-color: var(--ll-wine-red); width: 24px; height: 24px; border-radius: 50%; font-size: 0.75rem;">{{ confirmations.length }}</span>
                </div>
              <div class="ll-card__body">
                <div v-if="confirmationsLoading" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
                </div>
                <div v-else-if="confirmations.length === 0" class="text-center py-4 text-slate-500">
                  <p class="mb-0">You haven't confirmed any emergency requests yet.</p>
                  <RouterLink to="/emergency-board" class="btn btn-sm mt-2" style="color: var(--ll-wine-red); border: 1px solid var(--ll-wine-red);">View Board</RouterLink>
                </div>
                <div v-else class="list-group list-group-flush">
                  <div v-for="conf in confirmations" :key="conf.id" class="list-group-item px-0 py-3 border-bottom border-slate-100">
                    <div class="d-flex justify-content-between align-items-center gap-3">
                      <div>
                        <h3 class="fw-bold mb-1 d-flex align-items-center" style="font-size: 0.95rem; color: var(--ll-slate-900);">
                          {{ conf.hospitalName || 'Emergency Request' }}
                          <span :class="['badge ms-2', getStatusBadgeClass(conf.status)]" style="font-size: 0.65rem; padding: 0.25em 0.5em; border-radius: 4px; font-weight: 700;">
                            {{ conf.status ? conf.status.toUpperCase() : 'CONFIRMED' }}
                          </span>
                        </h3>
                        <p class="small text-slate-500 mb-0">
                          <i class="bi bi-geo-alt-fill text-wine me-1"></i>{{ conf.city }} | Blood: <strong>{{ conf.bloodType }}</strong>
                        </p>
                        <p class="small text-slate-400 mb-0 mt-1">Confirmed on {{ formatDateTime(conf.createdAt) }}</p>
                      </div>
                      <RouterLink :to="{ path: '/map', query: { request: conf.requestId } }" class="btn btn-sm flex-shrink-0" style="color: var(--ll-wine-red); border: 1px solid var(--ll-wine-red);">
                        <i class="bi bi-geo-alt-fill"></i> Map
                      </RouterLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Interested Events -->
          <div class="col-md-6 col-12">
            <div class="ll-card h-100">
              <div class="ll-card__header d-flex justify-content-between align-items-center">
                  <h5 class="fw-bold mb-0 text-wine"><i class="bi bi-calendar-check-fill me-2"></i>Interested Events</h5>
                  <span class="d-inline-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style="background-color: var(--ll-wine-red); width: 24px; height: 24px; border-radius: 50%; font-size: 0.75rem;">{{ registeredEvents.length }}</span>
                </div>
              <div class="ll-card__body">
                <div v-if="eventsLoading" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
                </div>
                <div v-else-if="registeredEvents.length === 0" class="text-center py-4 text-slate-500">
                  <p class="mb-0">You haven't marked interest in any events yet.</p>
                  <RouterLink to="/events" class="btn btn-sm mt-2" style="color: var(--ll-wine-red); border: 1px solid var(--ll-wine-red);">Browse Events</RouterLink>
                </div>
                <div v-else class="list-group list-group-flush">
                  <div v-for="ev in registeredEvents" :key="ev.id" class="list-group-item px-0 py-3 border-bottom border-slate-100">
                    <div class="d-flex justify-content-between align-items-center gap-3">
                      <div>
                        <h3 class="fw-bold mb-1 text-slate-900 fs-6">{{ ev.title }}</h3>
                        <p class="small text-slate-500 mb-0">
                          <i class="bi bi-geo-alt-fill text-wine me-1"></i>{{ ev.location }}, {{ ev.city }}
                        </p>
                        <p class="small text-slate-400 mb-0 mt-1">Date: {{ formatEventDate(ev.date) }}</p>
                      </div>
                      <RouterLink to="/events" class="ll-dashboard-view-button flex-shrink-0">
                        <i class="bi bi-eye-fill"></i> View
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
          <AdminAnalytics :stats="stats" />

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
          <AdminUserManagement
            v-if="activeAdminTab === 'users'"
            v-model:searchQuery="userSearchQuery"
            :usersLoading="usersLoading"
            :allSystemUsers="allSystemUsers"
            :userDisplayLimit="userDisplayLimit"
            :userProfile="userProfile"
            @prompt-role-change="promptRoleChange"
            @view-user-history="viewUserHistory"
            @handle-delete-user="handleDeleteUser"
            @load-more-users="userDisplayLimit += 100"
          />

          <!-- Emergency Board Management Panel -->
          <AdminRequestManagement
            v-else-if="activeAdminTab === 'requests'"
            :requestStatusTabs="requestStatusTabs"
            v-model:selectedRequestStatus="selectedRequestStatus"
            :requestsLoadingState="requestsLoadingState"
            :filteredAdminRequests="filteredAdminRequests"
            :expandedRequestIds="expandedRequestIds"
            :getConfirmationsForRequest="getConfirmationsForRequest"
            :formatDateTime="formatDateTime"
            @open-create-request-form="openCreateRequestForm"
            @handle-request-status-select="handleRequestStatusSelect"
            @toggle-request-expand="toggleRequestExpand"
            @open-edit-request-form="openEditRequestForm"
            @handle-delete-request="handleDeleteRequest"
            @change-confirmation-status="changeConfirmationStatus"
            @handle-cancel-confirmation="handleCancelConfirmation"
          />

          <!-- Event Management Panel -->
          <AdminEventManagement
            v-else-if="activeAdminTab === 'events'"
            :adminEventsLoading="adminEventsLoading"
            :eventsList="eventsList"
            :expandedEventIds="expandedEventIds"
            :getParticipantsForEvent="getParticipantsForEvent"
            :formatEventTitle="formatEventTitle"
            :formatEventDate="formatEventDate"
            @open-create-event-form="openCreateEventForm"
            @toggle-event-expand="toggleEventExpand"
            @open-edit-event-form="openEditEventForm"
            @handle-delete-event="handleDeleteEvent"
            @remove-user-from-event="removeUserFromEvent"
          />

          <!-- Live Support Chat Panel -->
          <div v-else-if="activeAdminTab === 'chat'">
            <div class="row g-4" style="height: 520px;">
              <!-- User Chat Directory (Left Sidebar) -->
              <div class="col-md-4 col-12 h-100 d-flex flex-column">
                <h5 class="fw-bold mb-3 text-slate-900"><i class="bi bi-people-fill text-wine me-2"></i>Active Conversations</h5>
                <div class="list-group list-group-flush flex-grow-1 overflow-y-auto border rounded bg-white">
                  <div
                    v-for="chat in uniqueChats"
                    :key="chat.chatId"
                    class="list-group-item ll-chat-thread-item py-3 px-3 border-bottom border-slate-100"
                    :class="{ 'active bg-danger-subtle text-dark border-danger-subtle': activeChatId === chat.chatId }"
                  >
                    <div class="ll-chat-thread-header mb-1">
                      <button
                        type="button"
                        class="ll-chat-thread-button text-start"
                        @click="activeChatId = chat.chatId"
                      >
                        <strong class="text-slate-900 small text-truncate d-block">{{ chat.userDisplayName }}</strong>
                      </button>
                      <button
                        type="button"
                        class="ll-chat-delete-button"
                        aria-label="Delete support chat"
                        title="Delete chat"
                        @click="promptDeleteSupportChat(chat.chatId)"
                      >
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </div>
                    <button
                      type="button"
                      class="ll-chat-thread-button text-start"
                      @click="activeChatId = chat.chatId"
                    >
                      <span class="mb-0 text-slate-500 text-truncate small d-block" style="max-width: 200px;">
                      <span :class="['ll-chat-role-badge', getThreadRoleBadgeClass(chat.lastMessageSenderRole)]">
                        {{ getThreadLastSenderLabel(chat.lastMessageSenderRole) }}
                      </span>
                      {{ chat.lastMessageText }}
                      </span>
                    </button>
                  </div>
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
                        :style="getAdminChatMessageFrameStyle(msg)"
                      >
                        <div
                          class="ll-admin-chat-message-label"
                          :class="getAdminChatLabelClass(msg)"
                        >
                          {{ getAdminChatSenderLabel(msg) }}
                        </div>
                        <div
                          class="p-2 rounded small ll-admin-chat-bubble"
                          :class="getAdminChatBubbleClass(msg)"
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
                        <button
                          type="submit"
                          class="btn btn-sm px-4 d-flex align-items-center justify-content-center gap-1 ll-admin-chat-send-button"
                          style="height: 38px;"
                        >
                          <i class="bi bi-send-fill"></i> Send
                        </button>
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

            <!-- Interested Outreach Events List inside User History -->
            <div>
              <h6 class="fw-bold text-wine mb-3"><i class="bi bi-calendar-check-fill me-2"></i>Interested Outreach Events ({{ userHistoryEvents.length }})</h6>
              <div v-if="userHistoryEvents.length === 0" class="text-center py-3 bg-slate-50 text-slate-500 rounded small">
                No interested outreach campaign events.
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

    <!-- Confirm Modal for User Role Change -->
    <ConfirmModal
      :show="showRoleConfirmModal"
      title="Confirm Role Change"
      :message="`Are you sure you want to change the role of '${pendingRoleChange?.userName}' from ${pendingRoleChange?.oldRole?.toUpperCase()} to ${pendingRoleChange?.newRole?.toUpperCase()}?`"
      confirm-label="Change Role"
      @confirm="confirmRoleChange"
      @cancel="cancelRoleChange"
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
      message="Are you sure you want to permanently delete this event? This will also remove saved interests."
      confirm-label="Delete Event"
      @confirm="confirmDeleteEvent"
      @cancel="showEventDeleteModal = false"
    />

    <ConfirmModal
      :show="showRequestStatusConfirmModal"
      title="Change Request Status"
      :message="`Are you sure you want to mark '${pendingRequestStatusChange?.requestName}' as ${pendingRequestStatusChange?.status?.toUpperCase()}?`"
      confirm-label="Change Status"
      @confirm="confirmRequestStatusChange"
      @cancel="cancelRequestStatusChange"
    />

    <ConfirmModal
      :show="showConfirmationStatusConfirmModal"
      title="Change Donation Status"
      :message="`Are you sure you want to update ${pendingConfirmationStatusChange?.donorName || 'this donor'} to ${pendingConfirmationStatusChange?.status?.toUpperCase()}?`"
      confirm-label="Update Status"
      @confirm="confirmConfirmationStatusChange"
      @cancel="cancelConfirmationStatusChange"
    />

    <ConfirmModal
      :show="showCancelConfirmationModal"
      title="Cancel Donation Confirmation"
      :message="`Are you sure you want to cancel the blood donation confirmation for ${pendingCancelConfirmation?.donorName || 'this donor'}?`"
      confirm-label="Cancel Confirmation"
      @confirm="confirmCancelConfirmation"
      @cancel="cancelCancelConfirmation"
    />

    <ConfirmModal
      :show="showRemoveEventParticipantModal"
      title="Remove Event Interest"
      :message="`Are you sure you want to remove ${pendingRemoveEventParticipant?.userName || 'this donor'} from this event?`"
      confirm-label="Remove Interest"
      @confirm="confirmRemoveUserFromEvent"
      @cancel="cancelRemoveUserFromEvent"
    />

    <ConfirmModal
      :show="showSupportChatDeleteModal"
      title="Delete Support Chat"
      message="Are you sure you want to permanently delete this support conversation and its messages?"
      confirm-label="Delete Chat"
      @confirm="confirmDeleteSupportChat"
      @cancel="cancelDeleteSupportChat"
    />
  </div>
</template>

<script setup>
/**
 * DonorDashboard.vue
 * Role-aware donor dashboard with profile summary and quick actions.
 */
import { ref, watch, reactive, computed, onUnmounted, nextTick } from 'vue'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, arrayRemove, increment, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'
import { useGeolocation } from '@/composables/useGeolocation.js'
import { useSupportChat } from '@/composables/useSupportChat.js'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AdminAnalytics from '@/components/AdminAnalytics.vue'
import AdminUserManagement from '@/components/AdminUserManagement.vue'
import AdminRequestManagement from '@/components/AdminRequestManagement.vue'
import AdminEventManagement from '@/components/AdminEventManagement.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import EventForm from '@/components/EventForm.vue'
import RequestForm from '@/components/RequestForm.vue'
import { useConfirmDonation } from '@/composables/useConfirmDonation.js'
import { useEmergencyRequests } from '@/composables/useEmergencyRequests.js'
import { isGuestInterestId, getGuestDisplayCode } from '@/composables/useDonationEvents.js'
import { useToast } from '@/composables/useToast.js'
import { useEligibility } from '@/composables/useEligibility.js'
import mockDonors from '@/data/mockDonors.json'
import {
  normalizeEventRecord,
  normalizeLocationRecord
} from '@/data/vietnamLocations.js'

const userSubTab = ref('registered')

// -----------------------------------------------------------------------------
// SECTION 1: AUTH & ELIGIBILITY STATE
// -----------------------------------------------------------------------------
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
const { deleteRequest: deleteEmergencyRequestCascade } = useEmergencyRequests()

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
  markAdminThreadRead,
  deleteSupportThread
} = useSupportChat()

// -----------------------------------------------------------------------------
// SECTION 2: ADMIN DASHBOARD STATS
// -----------------------------------------------------------------------------
const stats = reactive({
  usersCount: 0,
  activeRequestsCount: 0,
  totalConfirmationsCount: 0,
  eventsCount: 0,
  loading: false
})

function updateAdminStatsFromLists() {
  stats.usersCount = usersList.value.length + mockDonors.length
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
let donorConfirmationsUnsubscribe = null
let donorEventsUnsubscribe = null
let donorHistoryListenToken = 0

function stopDonorHistoryListeners() {
  donorHistoryListenToken += 1
  if (donorConfirmationsUnsubscribe) {
    donorConfirmationsUnsubscribe()
    donorConfirmationsUnsubscribe = null
  }
  if (donorEventsUnsubscribe) {
    donorEventsUnsubscribe()
    donorEventsUnsubscribe = null
  }
}

function listenToDonorHistory() {
  if (!userProfile.value || isAdmin.value) return
  const userId = userProfile.value.uid || userProfile.value.id
  stopDonorHistoryListeners()
  const listenToken = donorHistoryListenToken
  
  confirmationsLoading.value = true
  eventsLoading.value = true

  const qConf = query(
    collection(db, 'confirmations'),
    where('donorId', '==', userId)
  )

  donorConfirmationsUnsubscribe = onSnapshot(qConf, async (snapConf) => {
    const listConf = await Promise.all(snapConf.docs.map(async (docSnap) => {
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
      return normalizeLocationRecord(conf)
    }))

    if (listenToken !== donorHistoryListenToken) return
    listConf.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0
      const timeB = b.createdAt?.seconds || 0
      return timeB - timeA
    })
    confirmations.value = listConf
    confirmationsLoading.value = false
  }, (err) => {
    console.error('Error listening to donor confirmations:', err)
    if (listenToken === donorHistoryListenToken) {
      confirmations.value = []
      confirmationsLoading.value = false
    }
  })

  const qEv = query(
    collection(db, 'events'),
    where('likedBy', 'array-contains', userId)
  )

  donorEventsUnsubscribe = onSnapshot(qEv, (snapEv) => {
    if (listenToken !== donorHistoryListenToken) return
    const listEv = snapEv.docs.map(doc => normalizeEventRecord({ id: doc.id, ...doc.data() }))
    listEv.sort((a, b) => new Date(a.date) - new Date(b.date))
    registeredEvents.value = listEv
    eventsLoading.value = false
  }, (err) => {
    console.error('Error listening to donor events:', err)
    if (listenToken === donorHistoryListenToken) {
      registeredEvents.value = []
      eventsLoading.value = false
    }
  })
}

function loadHistory() {
  if (isAdmin.value) return
  listenToDonorHistory()
}

// System Administration Directory & Management
const activeAdminTab = ref('users')
const usersList = ref([])
const eventsList = ref([])
const allConfirmationsList = ref([])
const usersLoading = ref(false)
const adminEventsLoading = ref(false)
const confirmationsLoadingState = ref(false)

let requestsUnsubscribe = null
let eventsUnsubscribe = null
let confirmationsUnsubscribe = null
let guestConfirmationsUnsubscribe = null

// -----------------------------------------------------------------------------
// SECTION 3: USER MANAGEMENT & PERMISSIONS
// -----------------------------------------------------------------------------
const userSearchQuery = ref('')
const userDisplayLimit = ref(100)

watch(userSearchQuery, () => {
  userDisplayLimit.value = 100
})

const allSystemUsers = computed(() => {
  const list = [
    ...usersList.value.map(u => ({ ...normalizeLocationRecord(u), isMock: false })),
    ...mockDonors.map(m => ({
      id: m.id,
      displayName: m.displayName,
      email: m.email,
      phoneNumber: m.phoneNumber,
      city: normalizeLocationRecord(m).city,
      bloodType: m.bloodType,
      canDonateNow: m.canDonateNow,
      role: 'donor',
      isMock: true
    }))
  ]

  if (!userSearchQuery.value.trim()) {
    return list
  }
  const q = userSearchQuery.value.toLowerCase()
  return list.filter(u =>
    (u.displayName || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.phoneNumber || '').toLowerCase().includes(q) ||
    (u.city || '').toLowerCase().includes(q) ||
    (u.bloodType || '').toLowerCase().includes(q)
  )
})

async function fetchUsers(isSilent = false) {
  if (!isSilent) usersLoading.value = true
  try {
    const snap = await getDocs(collection(db, 'users'))
    usersList.value = snap.docs.map(doc => normalizeLocationRecord({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.error('Error fetching users:', err)
    showToast('Failed to fetch system users.', 'danger')
  } finally {
    if (!isSilent) usersLoading.value = false
  }
}

async function fetchEvents(isSilent = false) {
  if (!isSilent) adminEventsLoading.value = true
  return new Promise((resolve, reject) => {
    if (eventsUnsubscribe) {
      if (!isSilent) adminEventsLoading.value = false
      resolve()
      return
    }

    const q = query(collection(db, 'events'), orderBy('date', 'asc'))
    eventsUnsubscribe = onSnapshot(q, (snap) => {
      eventsList.value = snap.docs.map(docSnap =>
        normalizeEventRecord({ id: docSnap.id, ...docSnap.data() })
      )
      updateAdminStatsFromLists()
      if (!isSilent) adminEventsLoading.value = false
      resolve()
    }, (err) => {
      console.error('Error fetching events:', err)
      showToast('Failed to fetch events.', 'danger')
      if (!isSilent) adminEventsLoading.value = false
      reject(err)
    })
  })
}

async function fetchAllConfirmations(isSilent = false) {
  if (!isSilent) confirmationsLoadingState.value = true
  return new Promise((resolve, reject) => {
    if (confirmationsUnsubscribe || guestConfirmationsUnsubscribe) {
      resolve()
      return
    }
    let donorConfirmations = []
    let guestConfirmations = []
    let donorReady = false
    let guestReady = false
    let resolved = false

    const syncAllConfirmations = () => {
      allConfirmationsList.value = [...donorConfirmations, ...guestConfirmations]
      updateAdminStatsFromLists()
      if (donorReady && guestReady) {
        if (!isSilent) confirmationsLoadingState.value = false
        if (!resolved) {
          resolved = true
          resolve()
        }
      }
    }

    confirmationsUnsubscribe = onSnapshot(collection(db, 'confirmations'), (snap) => {
      donorReady = true
      donorConfirmations = snap.docs.map(doc => normalizeLocationRecord({
        id: doc.id,
        participantType: 'donor',
        ...doc.data()
      }))
      syncAllConfirmations()
    }, (err) => {
      console.error('Error fetching confirmations:', err)
      if (!isSilent) confirmationsLoadingState.value = false
      reject(err)
    })

    guestConfirmationsUnsubscribe = onSnapshot(collection(db, 'guestConfirmations'), (snap) => {
      guestReady = true
      guestConfirmations = snap.docs.map(doc => {
        const data = doc.data()
        return normalizeLocationRecord({
          id: doc.id,
          participantType: 'guest',
          donorName: data.guestName || 'Guest Donor',
          donorPhone: data.guestPhone || 'N/A',
          donorId: data.guestSessionId,
          bloodType: data.bloodType || 'Guest',
          ...data
        })
      })
      syncAllConfirmations()
    }, (err) => {
      console.error('Error fetching guest confirmations:', err)
      if (!isSilent) confirmationsLoadingState.value = false
      reject(err)
    })
  })
}

const showRoleConfirmModal = ref(false)
const pendingRoleChange = ref(null)

function promptRoleChange(u, newRole, event) {
  if (u.role === newRole) return
  pendingRoleChange.value = {
    userId: u.id,
    userName: u.displayName,
    oldRole: u.role,
    newRole,
    selectElement: event.target
  }
  showRoleConfirmModal.value = true
}

function cancelRoleChange() {
  if (pendingRoleChange.value?.selectElement) {
    pendingRoleChange.value.selectElement.value = pendingRoleChange.value.oldRole
  }
  showRoleConfirmModal.value = false
  pendingRoleChange.value = null
}

async function confirmRoleChange() {
  if (!pendingRoleChange.value) return
  const { userId, newRole } = pendingRoleChange.value
  showRoleConfirmModal.value = false
  await updateUserRole(userId, newRole)
  pendingRoleChange.value = null
}

async function updateUserRole(userId, newRole) {
  try {
    const isMockUser = String(userId).startsWith('mock_')
    if (isMockUser) {
      const found = mockDonors.find(m => m.id === userId)
      if (found) found.role = newRole
    } else {
      await updateDoc(doc(db, 'users', userId), { role: newRole })
    }
    showToast(`User role successfully changed to ${newRole.toUpperCase()}.`, 'success')
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
    const userId = userToDelete.value
    if (String(userId).startsWith('mock_')) {
      const idx = mockDonors.findIndex(m => m.id === userId)
      if (idx !== -1) mockDonors.splice(idx, 1)
    } else {
      await deleteDoc(doc(db, 'users', userId))
    }
    showToast('User account deleted successfully.', 'success')
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
const showRequestStatusConfirmModal = ref(false)
const pendingRequestStatusChange = ref(null)
const showConfirmationStatusConfirmModal = ref(false)
const pendingConfirmationStatusChange = ref(null)
const showCancelConfirmationModal = ref(false)
const pendingCancelConfirmation = ref(null)

const requestStatusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Cancelled', value: 'cancelled' }
]

// -----------------------------------------------------------------------------
// SECTION 4: EMERGENCY REQUEST MANAGEMENT
// -----------------------------------------------------------------------------
const filteredAdminRequests = computed(() => {
  if (selectedRequestStatus.value === 'all') return requestList.value
  return requestList.value.filter(req => req.status === selectedRequestStatus.value)
})

async function fetchRequests(isSilent = false) {
  if (!isSilent) requestsLoadingState.value = true
  return new Promise((resolve, reject) => {
    if (requestsUnsubscribe) {
      resolve()
      return
    }
    const q = query(collection(db, 'emergencyRequests'), orderBy('createdAt', 'desc'))
    requestsUnsubscribe = onSnapshot(q, (snap) => {
      requestList.value = snap.docs.map(docSnap =>
        normalizeLocationRecord({ id: docSnap.id, ...docSnap.data() })
      )
      updateAdminStatsFromLists()
      if (!isSilent) requestsLoadingState.value = false
      resolve()
    }, (err) => {
      console.error('Error fetching requests:', err)
      showToast('Failed to fetch emergency requests.', 'danger')
      if (!isSilent) requestsLoadingState.value = false
      reject(err)
    })
  })
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
    const dataToSave = normalizeLocationRecord({ ...formData })
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

function handleRequestStatusSelect(req, status, event) {
  if (req.status === status) return
  pendingRequestStatusChange.value = {
    req,
    requestName: req.hospitalName || 'this request',
    status,
    previousStatus: req.status,
    selectElement: event?.target || null
  }
  showRequestStatusConfirmModal.value = true
}

function cancelRequestStatusChange() {
  if (pendingRequestStatusChange.value?.selectElement) {
    pendingRequestStatusChange.value.selectElement.value =
      pendingRequestStatusChange.value.previousStatus
  }
  pendingRequestStatusChange.value = null
  showRequestStatusConfirmModal.value = false
}

async function confirmRequestStatusChange() {
  if (!pendingRequestStatusChange.value) return
  const { req, status } = pendingRequestStatusChange.value
  showRequestStatusConfirmModal.value = false
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
    cancelRequestStatusChange()
  } finally {
    pendingRequestStatusChange.value = null
  }
}

function handleDeleteRequest(requestId) {
  requestToDeleteId.value = requestId
  showRequestDeleteModal.value = true
}

async function confirmDeleteRequest() {
  if (!requestToDeleteId.value) return
  try {
    await deleteEmergencyRequestCascade(requestToDeleteId.value)
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

function changeConfirmationStatus(conf, newStatus, event) {
  const currentStatus = conf.status || 'confirmed'
  if (currentStatus === newStatus) return
  pendingConfirmationStatusChange.value = {
    confId: conf.id,
    conf,
    donorName: conf.donorName,
    status: newStatus,
    previousStatus: currentStatus,
    selectElement: event?.target || null
  }
  showConfirmationStatusConfirmModal.value = true
}

function cancelConfirmationStatusChange() {
  if (pendingConfirmationStatusChange.value?.selectElement) {
    pendingConfirmationStatusChange.value.selectElement.value =
      pendingConfirmationStatusChange.value.previousStatus
  }
  pendingConfirmationStatusChange.value = null
  showConfirmationStatusConfirmModal.value = false
}

async function confirmConfirmationStatusChange() {
  if (!pendingConfirmationStatusChange.value) return
  const { confId, conf, status } = pendingConfirmationStatusChange.value
  showConfirmationStatusConfirmModal.value = false
  try {
    if (conf?.participantType === 'guest') {
      await updateDoc(doc(db, 'guestConfirmations', confId), {
        status,
        updatedAt: serverTimestamp()
      })
    } else {
      await updateConfirmationStatus(confId, status)
    }
    showToast(`Donation status updated to ${status}.`, 'success')
    await fetchAllConfirmations(true)
    await loadHistory()
  } catch (err) {
    console.error('Error updating status:', err)
    showToast(err.message || 'Failed to update status.', 'danger')
    cancelConfirmationStatusChange()
  } finally {
    pendingConfirmationStatusChange.value = null
  }
}

function getStatusBadgeClass(status) {
    switch (status) {
      case 'arrived': return 'bg-info text-white'
      case 'donated': return 'bg-warning text-dark'
      case 'completed': return 'bg-primary text-white'
      default: return 'bg-success text-white'
    }
}

function handleCancelConfirmation(confOrId, reqId, donorName) {
  if (typeof confOrId === 'object' && confOrId) {
    pendingCancelConfirmation.value = {
      confId: confOrId.id,
      reqId: confOrId.requestId,
      donorName: confOrId.donorName || confOrId.guestName || 'this donor',
      participantType: confOrId.participantType || 'donor'
    }
  } else {
    pendingCancelConfirmation.value = { confId: confOrId, reqId, donorName, participantType: 'donor' }
  }
  showCancelConfirmationModal.value = true
}

async function confirmCancelConfirmation() {
  if (!pendingCancelConfirmation.value) return
  const { confId, reqId, donorName, participantType } = pendingCancelConfirmation.value
  try {
    if (participantType === 'guest') {
      await deleteDoc(doc(db, 'guestConfirmations', confId))
      await updateDoc(doc(db, 'emergencyRequests', reqId), {
        confirmedCount: increment(-1),
        updatedAt: serverTimestamp()
      })
    } else {
      await cancelConfirmation(confId, reqId)
    }
    showToast(`Cancelled blood donation confirmation for donor ${donorName}.`, 'success')
    await fetchAllConfirmations(true)
    await fetchRequests(true)
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error cancelling confirmation:', err)
    showToast(err.message || 'Failed to cancel confirmation.', 'danger')
  } finally {
    showCancelConfirmationModal.value = false
    pendingCancelConfirmation.value = null
  }
}

function cancelCancelConfirmation() {
  showCancelConfirmationModal.value = false
  pendingCancelConfirmation.value = null
}

// Event Management
const showEventForm = ref(false)
const editingEvent = ref(null)
const showEventDeleteModal = ref(false)
const eventToDelete = ref(null)
const showRemoveEventParticipantModal = ref(false)
const pendingRemoveEventParticipant = ref(null)

// -----------------------------------------------------------------------------
// SECTION 5: DONATION EVENT MANAGEMENT
// -----------------------------------------------------------------------------
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
    const dataToSave = normalizeEventRecord(formData)
    if (editingEvent.value) {
      await updateDoc(doc(db, 'events', editingEvent.value.id), {
        ...dataToSave
      })
      showToast('Event updated successfully.', 'success')
    } else {
      await addDoc(collection(db, 'events'), {
        ...dataToSave,
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
    if (isGuestInterestId(uid)) {
      return {
        uid,
        displayName: `Guest #${getGuestDisplayCode(uid)}`,
        email: 'Guest Session'
      }
    }
    const u = usersList.value.find(userItem => userItem.uid === uid || userItem.id === uid)
    return {
      uid,
      displayName: u?.displayName || 'Unknown User',
      email: u?.email || 'N/A'
    }
  })
}

function removeUserFromEvent(eventId, userId, userName) {
  pendingRemoveEventParticipant.value = { eventId, userId, userName }
  showRemoveEventParticipantModal.value = true
}

async function confirmRemoveUserFromEvent() {
  if (!pendingRemoveEventParticipant.value) return
  const { eventId, userId, userName } = pendingRemoveEventParticipant.value
  try {
    const eventRef = doc(db, 'events', eventId)
    await updateDoc(eventRef, {
      likedBy: arrayRemove(userId),
      interestedCount: increment(-1)
    })
    showToast(`Removed interest for ${userName}.`, 'success')
    await loadAdminStats(true)
  } catch (err) {
    console.error('Error removing user from event:', err)
    showToast(err.message || 'Failed to remove user from event.', 'danger')
  } finally {
    showRemoveEventParticipantModal.value = false
    pendingRemoveEventParticipant.value = null
  }
}

function cancelRemoveUserFromEvent() {
  showRemoveEventParticipantModal.value = false
  pendingRemoveEventParticipant.value = null
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

// -----------------------------------------------------------------------------
// SECTION 6: SUPPORT CHAT THREADS MANAGEMENT
// -----------------------------------------------------------------------------
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
        email = defaultGuestEmail
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

function getMessageRole(msg) {
  if (msg?.senderRole) return msg.senderRole
  if (msg?.senderId === 'admin') return 'admin'
  if (msg?.senderId === 'support_bot') return 'support_bot'
  return activeChatThread.value?.participantType || 'user'
}

function getThreadLastSenderLabel(role) {
  if (role === 'admin') return 'Admin'
  if (role === 'support_bot') return 'Bot'
  if (role === 'guest') return 'Guest'
  return 'User'
}

function getThreadRoleBadgeClass(role) {
  if (role === 'admin') return 'll-chat-role-badge--admin'
  if (role === 'support_bot') return 'll-chat-role-badge--bot'
  return 'll-chat-role-badge--user'
}

function getAdminChatSenderLabel(msg) {
  const role = getMessageRole(msg)
  if (role === 'admin') return 'Admin'
  if (role === 'support_bot') return 'Support Bot'
  return msg.senderName || activeChatThread.value?.userDisplayName || 'Donor'
}

function getAdminChatMessageFrameStyle(msg) {
  const role = getMessageRole(msg)
  if (role === 'admin' || role === 'support_bot') {
    return 'align-self: flex-end; align-items: flex-end; max-width: 75%;'
  }
  return 'align-self: flex-start; align-items: flex-start; max-width: 75%;'
}

function getAdminChatBubbleClass(msg) {
  const role = getMessageRole(msg)
  if (role === 'admin') return 'll-admin-chat-bubble--admin'
  if (role === 'support_bot') return 'll-admin-chat-bubble--bot'
  return 'll-admin-chat-bubble--user'
}

function getAdminChatLabelClass(msg) {
  const role = getMessageRole(msg)
  if (role === 'admin') return 'll-admin-chat-message-label--admin'
  if (role === 'support_bot') return 'll-admin-chat-message-label--bot'
  return 'll-admin-chat-message-label--user'
}

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

const showSupportChatDeleteModal = ref(false)
const pendingSupportChatDeleteId = ref(null)

function promptDeleteSupportChat(threadId) {
  pendingSupportChatDeleteId.value = threadId
  showSupportChatDeleteModal.value = true
}

async function confirmDeleteSupportChat() {
  const threadId = pendingSupportChatDeleteId.value
  if (!threadId) return

  try {
    await deleteSupportThread(threadId)
    supportThreads.value = supportThreads.value.filter((thread) => thread.id !== threadId)
    if (activeChatId.value === threadId) {
      activeChatId.value = null
      activeChatMessages.value = []
    }
    showToast('Support chat deleted.', 'success')
  } catch (err) {
    console.error('Error deleting support chat:', err)
    showToast(err.message || 'Could not delete support chat.', 'danger')
  } finally {
    showSupportChatDeleteModal.value = false
    pendingSupportChatDeleteId.value = null
  }
}

function cancelDeleteSupportChat() {
  showSupportChatDeleteModal.value = false
  pendingSupportChatDeleteId.value = null
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
      stopDonorHistoryListeners()
      await loadAdminStats()
      listenToAllSupportMessages()
    } else {
      listenToDonorHistory()
    }
  } else {
    stopDonorHistoryListeners()
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
    if (confirmationsUnsubscribe) {
      confirmationsUnsubscribe()
      confirmationsUnsubscribe = null
    }
    if (eventsUnsubscribe) {
      eventsUnsubscribe()
      eventsUnsubscribe = null
    }
    if (guestConfirmationsUnsubscribe) {
      guestConfirmationsUnsubscribe()
      guestConfirmationsUnsubscribe = null
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
    setTimeout(() => reveal('.reveal-item', 60), 100)
  }
}, { immediate: true })

onUnmounted(() => {
  if (adminChatUnsubscribe) {
    adminChatUnsubscribe()
  }
  if (adminActiveThreadUnsubscribe) {
    adminActiveThreadUnsubscribe()
  }
  if (requestsUnsubscribe) {
    requestsUnsubscribe()
  }
  if (eventsUnsubscribe) {
    eventsUnsubscribe()
  }
  if (confirmationsUnsubscribe) {
    confirmationsUnsubscribe()
  }
  if (guestConfirmationsUnsubscribe) {
    guestConfirmationsUnsubscribe()
  }
  stopDonorHistoryListeners()
})
</script>

<style>
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

.ll-dashboard-view-button {
  height: 34px;
  min-height: 34px;
  flex: 0 0 auto;
  padding: 0 0.75rem;
  border: 1px solid var(--ll-wine-red);
  border-radius: var(--ll-radius-sm);
  background: #ffffff;
  color: var(--ll-wine-red);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition:
    background-color var(--ll-transition-fast),
    color var(--ll-transition-fast),
    border-color var(--ll-transition-fast),
    transform var(--ll-transition-fast);
}

.ll-dashboard-view-button:hover,
.ll-dashboard-view-button:focus {
  background: var(--ll-wine-red);
  border-color: var(--ll-wine-red);
  color: #ffffff;
  transform: translateY(-1px);
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
  font-weight: 700;
  transition: all var(--ll-transition);
}

.ll-tab-button--active {
  border-color: var(--ll-wine-red);
  background: var(--ll-wine-red);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(142, 36, 53, 0.18);
}

.ll-tab-button:hover,
.ll-tab-button:focus {
  border-color: var(--ll-wine-red);
  color: var(--ll-wine-red);
}

.ll-tab-button--active:hover,
.ll-tab-button--active:focus {
  color: #ffffff;
}

.ll-table-card {
  overflow: visible;
}

.ll-table-card {
  border-radius: 16px !important;
  overflow: hidden !important;
  border: 1px solid var(--ll-slate-200) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

.ll-admin-table th {
  color: var(--ll-slate-700);
  font-size: 0.78rem !important;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #F8FAFC !important;
  padding: 0.85rem 0.9rem !important;
  white-space: nowrap;
}

.ll-admin-table td {
  color: var(--ll-slate-700);
  font-size: 0.85rem;
  padding: 0.7rem 0.9rem !important;
  white-space: nowrap;
}

.ll-badge-blood {
  background-color: var(--ll-wine-red) !important;
  color: #fff !important;
  font-size: 0.74rem !important;
  padding: 0 0.5rem !important;
  height: 28px !important;
  min-height: 28px !important;
  max-height: 28px !important;
  line-height: 28px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 4px !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 3px rgba(142, 36, 53, 0.2);
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

.ll-select-button:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: #CBD5E1 !important;
}

/* Custom scrollbar for tables to look elegant and not touch borders */
.ll-table-card .table-responsive {
  overflow-y: auto;
  background: linear-gradient(to bottom, #F8FAFC 0%, #F8FAFC 52px, #E2E8F0 52px, #E2E8F0 53px, transparent 53px, transparent 100%);
}
.ll-table-card .table-responsive::-webkit-scrollbar {
  width: 6px;
}
.ll-table-card .table-responsive::-webkit-scrollbar-track {
  background: transparent;
  margin-top: 53px;
  margin-bottom: 8px;
}
.ll-table-card .table-responsive::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 4px;
}
.ll-table-card .table-responsive::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}

.ll-expanded-row td {
  border-bottom: 1px solid var(--ll-slate-200);
}

.ll-admin-chat-send-button {
  background: var(--ll-wine-red);
  border-color: var(--ll-wine-red);
  color: #ffffff;
}

.ll-admin-chat-send-button:hover,
.ll-admin-chat-send-button:focus {
  background: #a3263d;
  border-color: #a3263d;
  color: #ffffff;
}

.ll-chat-delete-button {
  position: absolute;
  top: 50%;
  right: 0.85rem;
  transform: translateY(-50%);
  width: 1.65rem;
  height: 1.65rem;
  min-width: 1.65rem;
  min-height: 1.65rem;
  padding: 0;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fff5f5;
  color: var(--ll-wine-red);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  line-height: 1;
  z-index: 2;
}

.ll-chat-delete-button .bi {
  display: block;
  font-size: 0.86rem;
  line-height: 1;
}

.ll-chat-delete-button:hover,
.ll-chat-delete-button:focus {
  background: var(--ll-wine-red);
  border-color: var(--ll-wine-red);
  color: #ffffff;
}

.ll-chat-delete-button:focus {
  outline: 2px solid rgba(142, 36, 53, 0.28);
  outline-offset: 2px;
}

.ll-chat-thread-button {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
}

.ll-chat-thread-button:focus {
  outline: none;
}

.ll-chat-thread-header {
  display: block;
  min-height: 1.65rem;
}

.ll-chat-thread-item {
  position: relative;
  padding-right: 3rem !important;
}

.ll-chat-role-badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 0.35rem;
  margin-right: 0.35rem;
  border-radius: 4px;
  font-size: 0.64rem;
  font-weight: 700;
  line-height: 1;
}

.ll-chat-role-badge--user {
  background: #e0f2fe;
  color: #075985;
}

.ll-chat-role-badge--bot {
  background: #fef3c7;
  color: #92400e;
}

.ll-chat-role-badge--admin {
  background: var(--ll-wine-light);
  color: var(--ll-wine-red);
}

.ll-admin-chat-message-label {
  font-size: 0.68rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.ll-admin-chat-message-label--user {
  color: #075985;
}

.ll-admin-chat-message-label--bot {
  color: #92400e;
}

.ll-admin-chat-message-label--admin {
  color: var(--ll-wine-red);
}

.ll-admin-chat-bubble--user {
  background-color: #ffffff;
  color: var(--ll-slate-900);
  border: 1px solid #bae6fd;
  border-bottom-left-radius: 2px;
}

.ll-admin-chat-bubble--bot {
  background-color: #fffbeb;
  color: var(--ll-slate-900);
  border: 1px solid #fde68a;
  border-bottom-right-radius: 2px;
}

.ll-admin-chat-bubble--admin {
  background-color: var(--ll-wine-red);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}
</style>
