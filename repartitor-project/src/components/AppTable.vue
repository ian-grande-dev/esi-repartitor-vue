<script>
// AppTable: reusable table with sort and filters.
// Used in almost every page (roles, texts, stats...).
//
// Each column is an object:
//   key           name of the value in the row
//   label         text in the header
//   sortable      true = click on the header to sort
//   sortBy        (optional) other key used to sort, for example a raw date
//   filter        'text' = search box, 'choice' = buttons with fixed values
//   filterOptions values for a 'choice' filter, for example ['Oui', 'Non']
//   align         'right' for numbers
//
// To show something special in a cell, use a slot with the column key:
//   <AppTable ...><template #status="{ row }">...</template></AppTable>
export default {
  props: {
    columns: { type: Array, required: true },
    rows: { type: Array, default: () => [] },
    emptyText: { type: String, default: 'Aucun résultat.' },
  },

  // 'select' is sent when the user clicks on a row. It gives the full row.
  emits: ['select'],

  data() {
    // One filter value for each column that has a filter
    const filters = {}
    for (const col of this.columns) {
      if (col.filter) filters[col.key] = col.filter === 'text' ? '' : null
    }
    return {
      filters,
      sortKey: null, // column used for the sort (null = no sort)
      sortAsc: true, // true = A to Z, false = Z to A
    }
  },

  computed: {
    filterColumns() {
      return this.columns.filter(col => col.filter)
    },

    hasActiveFilter() {
      return Object.values(this.filters).some(v => v)
    },

    // The rows after the filters and the sort
    visibleRows() {
      const result = this.rows.filter(row =>
        // A row stays if it matches ALL the filters
        this.filterColumns.every(col => {
          const filter = this.filters[col.key]
          if (!filter) return true // empty filter = no filter
          const value = String(row[col.key] ?? '')
          return col.filter === 'text'
            ? value.toLowerCase().includes(filter.toLowerCase())
            : value === filter
        }),
      )

      if (!this.sortKey) return result

      const col = this.columns.find(c => c.key === this.sortKey)
      const key = col?.sortBy ?? this.sortKey
      // [...result] makes a copy, so we do not change the original array
      return [...result].sort((a, b) => {
        const diff = compare(a[key], b[key])
        return this.sortAsc ? diff : -diff
      })
    },
  },

  methods: {
    // First click: A to Z. Second click on the same column: Z to A.
    toggleSort(col) {
      if (!col.sortable) return
      if (this.sortKey === col.key) {
        this.sortAsc = !this.sortAsc
      } else {
        this.sortKey = col.key
        this.sortAsc = true
      }
    },

    sortIcon(col) {
      if (this.sortKey !== col.key) return '↕'
      return this.sortAsc ? '↑' : '↓'
    },

    // Click on a choice: select it. Click again: remove it.
    toggleChoice(col, option) {
      this.filters[col.key] = this.filters[col.key] === option ? null : option
    },

    clearFilters() {
      for (const col of this.filterColumns) {
        this.filters[col.key] = col.filter === 'text' ? '' : null
      }
    },

    rowKey(row, index) {
      return row.id ?? index
    },
  },
}

// Compares two values for the sort.
// Numbers are compared as numbers, text with the French alphabet rules.
function compare(a, b) {
  if (a == null || a === '') return 1   // empty values go to the end
  if (b == null || b === '') return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'fr', { numeric: true })
}
</script>

<template>
  <div class="table-wrap">
    <!-- Filters -->
    <div v-if="filterColumns.length" class="toolbar">
      <template v-for="col in filterColumns" :key="col.key">
        <input
          v-if="col.filter === 'text'"
          v-model="filters[col.key]"
          type="text"
          :placeholder="col.label"
          :aria-label="`Filtrer par ${col.label}`"
        />
        <div v-else class="choices" role="group" :aria-label="col.label">
          <span class="choices-label">{{ col.label }}</span>
          <button
            v-for="opt in col.filterOptions"
            :key="opt"
            type="button"
            class="sm"
            :class="{ active: filters[col.key] === opt }"
            :aria-pressed="filters[col.key] === opt"
            @click="toggleChoice(col, opt)"
          >
            {{ opt }}
          </button>
        </div>
      </template>
      <button v-if="hasActiveFilter" type="button" class="ghost sm" @click="clearFilters">
        Effacer les filtres
      </button>
    </div>

    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="{ sortable: col.sortable, right: col.align === 'right' }"
              :aria-sort="sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : undefined"
              @click="toggleSort(col)"
            >
              {{ col.label }}
              <span v-if="col.sortable" class="sort-icon" :class="{ on: sortKey === col.key }">
                {{ sortIcon(col) }}
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, index) in visibleRows"
            :key="rowKey(row, index)"
            tabindex="0"
            @click="$emit('select', row)"
            @keydown.enter="$emit('select', row)"
          >
            <td v-for="col in columns" :key="col.key" :class="{ right: col.align === 'right' }">
              <slot :name="col.key" :row="row">{{ row[col.key] ?? '—' }}</slot>
            </td>
          </tr>

          <tr v-if="!visibleRows.length" class="empty">
            <td :colspan="columns.length">{{ emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
}

/* The search boxes share the width: they stay on one line when there is space */
.toolbar input {
  flex: 1 1 8rem;
  min-width: 0;
  max-width: 14rem;
}

.choices {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.choices-label {
  margin-right: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.choices button.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  padding: 0.65rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  user-select: none;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  color: var(--text);
}

.sort-icon {
  margin-left: 0.25rem;
  opacity: 0.4;
}

.sort-icon.on {
  opacity: 1;
  color: var(--accent);
}

td {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.right {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

tbody tr {
  cursor: pointer;
  transition: background 0.12s;
}

tbody tr:hover,
tbody tr:focus-visible {
  background: var(--surface-muted);
  outline: none;
}

tbody tr:last-child td {
  border-bottom: none;
}

tr.empty {
  cursor: default;
}

tr.empty td {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

tr.empty:hover {
  background: none;
}
</style>
