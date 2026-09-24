<script>
// Shows "loading" or an error message while the data is not ready.
// When everything is OK, it shows the default slot.
export default {
  props: {
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
  },
}
</script>

<template>
  <div v-if="loading" class="state" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    Chargement…
  </div>
  <div v-else-if="error" class="alert danger" role="alert">{{ error }}</div>
  <slot v-else />
</template>

<style scoped>
.state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
