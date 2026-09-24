<script>
import { formatNumber } from '../utils/format.js'

// Simple table for statistics: one line = a label, a number of texts and words.
// rows = [{ label, texts, words, sub? }]  (sub = true for a sub-line like "late")
export default {
  props: {
    rows: { type: Array, required: true },
  },
  methods: { formatNumber },
}
</script>

<template>
  <table class="stat-table">
    <thead>
      <tr>
        <th></th>
        <th class="num">Textes</th>
        <th class="num">Mots</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.label" :class="{ sub: row.sub }">
        <td>{{ row.label }}</td>
        <td class="num">{{ formatNumber(row.texts) }}</td>
        <td class="num">{{ formatNumber(row.words) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.stat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th {
  padding: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  text-align: left;
}

td {
  padding: 0.55rem 0;
  border-top: 1px solid var(--border);
}

.num {
  width: 6rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

td.num {
  font-weight: 600;
}

/* Sub-line: a bit smaller and moved to the right */
.sub td {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.sub td:first-child {
  padding-left: 1rem;
}

.sub td.num {
  font-weight: 500;
}
</style>
