<template>
  <div class="row g-4 align-items-center">
    <div class="col-lg-4 text-center reveal-item">
      <!-- Modern Glowing Circular Droplet Badge -->
      <div class="ll-profile-glowing-circle mx-auto">
        <div class="ll-glowing-drop">
          <i class="bi bi-droplet-fill"></i>
          <span class="ll-blood-letter">{{ userProfile.bloodType }}</span>
        </div>
      </div>
      <p class="ll-text-meta mt-3 mb-0 text-uppercase font-weight-700 letter-spacing-1">
        Verified Blood Group
      </p>

      <!-- Cooldown Indicator Card -->
      <div
        class="mt-4 p-3 rounded border text-start animate-fade-in"
        :class="
          eligibleInfo.eligible
            ? 'bg-success-bg border-success-subtle'
            : 'bg-warning-bg border-warning-subtle'
        "
        style="transition: all var(--ll-transition-fast)"
      >
        <div class="d-flex align-items-center gap-2">
          <i
            :class="
              eligibleInfo.eligible
                ? 'bi bi-check-circle-fill text-success'
                : 'bi bi-hourglass-split text-warning'
            "
            style="font-size: 1.25rem"
          ></i>
          <div>
            <strong
              class="text-slate-900 small d-block"
              style="font-size: 0.85rem; font-weight: 700"
              >{{ eligibleInfo.statusTitle }}</strong
            >
            <span
              class="text-slate-500 extra-small"
              style="font-size: 0.75rem; display: block; margin-top: 2px"
              >{{ eligibleInfo.statusBody }}</span
            >
          </div>
        </div>
        <div v-if="!eligibleInfo.eligible" class="mt-2">
          <div
            class="ll-progress"
            style="
              height: 6px;
              background-color: var(--ll-slate-100);
              border-radius: 3px;
              overflow: hidden;
            "
            aria-label="Donation cooldown progress"
          >
            <div
              class="ll-progress-bar bg-warning"
              :style="{
                width: `${eligibleInfo.progressPercent}%`,
                height: '100%',
                transition: 'width 0.4s ease-out'
              }"
            ></div>
          </div>
          <div
            class="d-flex justify-content-between mt-1 text-slate-400 extra-small"
            style="font-size: 0.7rem"
          >
            <span>Last: {{ readableLastDonation }}</span>
            <span>{{ eligibleInfo.daysLeft }} days left</span>
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-8 reveal-item">
      <div class="ll-profile-list-premium">
        <div class="ll-profile-row">
          <span class="ll-profile-label">Name</span>
          <span class="ll-profile-val">{{ userProfile.displayName }}</span>
        </div>
        <div class="ll-profile-row">
          <span class="ll-profile-label">Email</span>
          <span class="ll-profile-val">{{ userProfile.email }}</span>
        </div>
        <div class="ll-profile-row">
          <span class="ll-profile-label">Phone Number</span>
          <span class="ll-profile-val">{{ userProfile.phoneNumber || 'Not recorded' }}</span>
        </div>
        <div class="ll-profile-row">
          <span class="ll-profile-label">Location City</span>
          <span class="ll-profile-val">{{ userProfile.city }}</span>
        </div>
        <div class="ll-profile-row">
          <span class="ll-profile-label">Status</span>
          <span class="ll-profile-val">
            <span
              :class="[
                'll-status-pill',
                userProfile.canDonateNow
                  ? 'll-status-pill--active'
                  : 'll-status-pill--inactive'
              ]"
            >
              <span class="ll-status-dot"></span>
              {{ userProfile.canDonateNow ? 'Ready to Donate' : 'Temporarily Unavailable' }}
            </span>
          </span>
        </div>
        <div class="ll-profile-row">
          <span class="ll-profile-label">Last Blood Donation</span>
          <span class="ll-profile-val">{{ readableLastDonation }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  userProfile: {
    type: Object,
    required: true
  },
  eligibleInfo: {
    type: Object,
    required: true
  },
  readableLastDonation: {
    type: String,
    required: true
  }
})
</script>
