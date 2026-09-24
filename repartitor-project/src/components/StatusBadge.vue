<script>
// Small colored label to show a status.
// tone: 'success' (green), 'warning' (orange), 'danger' (red) or 'neutral' (grey)
export default {
  props: {
    tone: { type: String, default: 'neutral' },
  },
}
</script>

<template>
  <span class="badge" :class="tone"><slot /></span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  background: var(--surface-muted);
  color: var(--text-muted);
}

/* Small dot before the text */
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.success { background: var(--success-soft); color: var(--success); }
.warning { background: var(--warning-soft); color: var(--warning); }
.danger  { background: var(--danger-soft);  color: var(--danger); }
</style>
