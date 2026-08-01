<script setup>
</script>

<template>
  <div class="container py-5" style="max-width: 720px">

    <div class="mb-4">
      <span class="badge bg-danger mb-2">Stage 3 Demo</span>
      <h2 class="fw-bold">Module-Scoped Shared Reactive State</h2>
      <p class="text-muted">
        Two independent components reading the same reactive reference.
        No props. No emitted events.
      </p>
    </div>

    <div class="card shadow-sm mb-4">
      <div class="card-header fw-semibold">
        <i class="bi bi-map me-1"></i> Main Component (Map Interface)
      </div>
      <div class="card-body">
        <button
          class="btn btn-primary"
          @click="handleRequestLocation"
          :disabled="isLoading"
        >
          <span v-if="isLoading">
            <span class="spinner-border spinner-border-sm me-1"></span>
            Locating...
          </span>
          <span v-else>
            <i class="bi bi-geo-alt me-1"></i> Request Location
          </span>
        </button>

        <div v-if="userLocation" class="alert alert-success mt-3 mb-0">
          <strong>Main component:</strong>
          Lat {{ userLocation.latitude.toFixed(4) }},
          Lng {{ userLocation.longitude.toFixed(4) }} —
          accuracy {{ Math.round(userLocation.accuracy) }} m
        </div>

        <div v-if="locationError" class="alert alert-danger mt-3 mb-0">
          {{ locationError }}
        </div>
      </div>
    </div>

    <LocationStatusBadge />

  </div>
</template>
