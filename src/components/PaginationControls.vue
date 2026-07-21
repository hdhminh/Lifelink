<template>
  <nav v-if="totalPages > 1" aria-label="Page navigation">
    <ul class="ll-pagination">
      <li>
        <button
          class="ll-page-button"
          type="button"
          :disabled="currentPage === 1"
          @click="emitPage(currentPage - 1)"
        >
          Previous
        </button>
      </li>
      <li v-for="item in visiblePages" :key="item.key">
        <span v-if="item.ellipsis" class="ll-page-ellipsis">…</span>
        <button
          v-else
          class="ll-page-button"
          type="button"
          :class="{ 'll-page-button--active': item.page === currentPage }"
          @click="emitPage(item.page)"
        >
          {{ item.page }}
        </button>
      </li>
      <li>
        <button
          class="ll-page-button"
          type="button"
          :disabled="currentPage === totalPages"
          @click="emitPage(currentPage + 1)"
        >
          Next
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * PaginationControls.vue
 * Reusable pagination component with ellipsis for long page ranges.
 */
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

const emit = defineEmits(['page-change'])

const visiblePages = computed(() => {
  if (props.totalPages <= 7) {
    return Array.from({ length: props.totalPages }, (_, index) => ({
      key: `page-${index + 1}`,
      page: index + 1
    }))
  }

  const pages = [{ key: 'page-1', page: 1 }]
  const start = Math.max(2, props.currentPage - 1)
  const end = Math.min(props.totalPages - 1, props.currentPage + 1)

  if (start > 2) pages.push({ key: 'ellipsis-start', ellipsis: true })
  for (let page = start; page <= end; page += 1) {
    pages.push({ key: `page-${page}`, page })
  }
  if (end < props.totalPages - 1) pages.push({ key: 'ellipsis-end', ellipsis: true })
  pages.push({ key: `page-${props.totalPages}`, page: props.totalPages })
  return pages
})

/**
 * Emits a valid page-change request.
 * @param {number} page - Target page.
 */
function emitPage(page) {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}
</script>

<style scoped>
.ll-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  list-style: none;
  padding: 0;
  margin: 2rem 0 0;
  flex-wrap: wrap;
}

.ll-page-button {
  border: 1px solid var(--ll-slate-300);
  background: var(--ll-surface);
  color: var(--ll-slate-700);
  border-radius: var(--ll-radius-sm);
  padding: 0.4rem 0.7rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.ll-page-button:hover:not(:disabled),
.ll-page-button--active {
  background: var(--ll-wine-red);
  border-color: var(--ll-wine-red);
  color: #fff;
}

.ll-page-button:disabled {
  color: var(--ll-slate-400);
  cursor: not-allowed;
}

.ll-page-ellipsis {
  color: var(--ll-slate-500);
  padding: 0 0.25rem;
}
</style>
