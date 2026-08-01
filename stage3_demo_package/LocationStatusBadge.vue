<script setup>
import { useLiveLocation } from '@/composables/useLiveLocation'

const { userLocation } = useLiveLocation()
</script>

<template>
  <div class="p-4 border rounded-3 bg-light">
    <h5 class="fw-bold mb-3">
      <span class="badge bg-secondary me-2">Independent Component</span>
      LocationStatusBadge
    </h5>

    <p v-if="!userLocation" class="text-muted mb-0">
      <i class="bi bi-hourglass-split me-1"></i>
      Waiting for location... (no props received)
    </p>

    <p v-else class="text-success fw-bold mb-1">
      <i class="bi bi-geo-alt-fill me-1"></i>
      Shared location active
    </p>
    <ul v-if="userLocation" class="list-unstyled mb-0 ms-3 text-secondary small">
      <li>Latitude: {{ userLocation.latitude.toFixed(6) }}</li>
      <li>Longitude: {{ userLocation.longitude.toFixed(6) }}</li>
      <li>Accuracy: {{ Math.round(userLocation.accuracy) }} m</li>
    </ul>
  </div>
</template>
