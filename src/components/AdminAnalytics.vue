<template>
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
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
})
</script>
