<script>
import { getTranslators } from '../../services/translatorService.js'
import { getEditors } from '../../services/editorService.js'
import { getCurrentGlobalStats, getPastGlobalStats } from '../../services/statsService.js'
import { defaultPeriod } from '../../utils/format.js'

import AppTable from '../../components/AppTable.vue'
import AsyncState from '../../components/AsyncState.vue'
import StatTable from '../../components/StatTable.vue'

// Repartitor page: stats of the whole team, and links to the stats of each person.
export default {
  components: { AppTable, AsyncState, StatTable },

  data() {
    const period = defaultPeriod()
    return {
      tab: 'global', // 'global' | 'translator' | 'editor'
      tabs: [
        { id: 'global', label: 'Vue globale' },
        { id: 'translator', label: 'Par traducteur' },
        { id: 'editor', label: 'Par éditeur' },
      ],

      current: null,
      past: null,
      translators: [],
      editors: [],

      loading: true,
      loadingPast: false,
      error: null,

      dateFrom: period.from,
      dateTo: period.to,

      personColumns: [
        { key: 'id', label: 'Trigramme', sortable: true, filter: 'text' },
        { key: 'firstname', label: 'Prénom', sortable: true, filter: 'text' },
        { key: 'lastname', label: 'Nom', sortable: true, filter: 'text' },
      ],
    }
  },

  computed: {
    periodValid() {
      return this.dateFrom && this.dateTo && new Date(this.dateFrom) <= new Date(this.dateTo)
    },

    currentRows() {
      const c = this.current
      return [
        { label: 'Textes en cours', ...c.inProgress },
        { label: 'Traduction non attribuée', ...c.translationUnassigned, sub: true },
        { label: 'En cours de traduction', ...c.translationInProgress, sub: true },
        { label: 'Édition non attribuée', ...c.editionUnassigned, sub: true },
        { label: 'En cours d\'édition', ...c.editionInProgress, sub: true },
      ]
    },

    pastRows() {
      const p = this.past
      return [
        { label: 'Traductions terminées', ...p.translationsDone },
        { label: 'dont rendues en retard', ...p.translationsLate, sub: true },
        { label: 'Éditions terminées', ...p.editionsDone },
        { label: 'dont rendues en retard', ...p.editionsLate, sub: true },
      ]
    },
  },

  methods: {
    // Past stats are only loaded when the user clicks, to avoid too many queries
    async loadPast() {
      if (!this.periodValid) return
      this.loadingPast = true
      try {
        this.past = await getPastGlobalStats(this.dateFrom, this.dateTo)
      } catch {
        this.error = 'Impossible de charger les statistiques. Réessayez plus tard.'
      } finally {
        this.loadingPast = false
      }
    },

    // Open the stats of one person, with the same period in the URL
    openPerson(name, row) {
      this.$router.push({
        name,
        params: { id: row.id },
        query: { from: this.dateFrom, to: this.dateTo },
      })
    },
  },

  async created() {
    try {
      ;[this.current, this.translators, this.editors] = await Promise.all([
        getCurrentGlobalStats(),
        getTranslators(),
        getEditors(),
      ])
    } catch {
      this.error = 'Impossible de charger les statistiques. Réessayez plus tard.'
    } finally {
      this.loading = false
    }
  },
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Statistiques</h1>
        <p>Suivi de l'activité de l'équipe.</p>
      </div>
      <div class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          role="tab"
          :aria-selected="tab === t.id"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>
    </header>

    <AsyncState :loading="loading" :error="error">
      <!-- Global -->
      <div v-if="tab === 'global'" class="grid-2">
        <section class="card">
          <h2>En ce moment</h2>
          <StatTable :rows="currentRows" />
        </section>

        <section class="card stack">
          <h2>Historique</h2>
          <div class="row period">
            <label class="field">Du <input v-model="dateFrom" type="datetime-local" /></label>
            <label class="field">Au <input v-model="dateTo" type="datetime-local" /></label>
            <button class="primary" :disabled="!periodValid || loadingPast" @click="loadPast">
              {{ loadingPast ? 'Chargement…' : 'Afficher' }}
            </button>
          </div>
          <p v-if="!periodValid" class="alert warning">La date de début doit être avant la date de fin.</p>
          <StatTable v-if="past" :rows="pastRows" />
          <p v-else class="muted small">Choisissez une période puis cliquez sur « Afficher ».</p>
        </section>
      </div>

      <!-- By translator -->
      <section v-else-if="tab === 'translator'" class="stack">
        <p class="muted">Cliquez sur un traducteur pour voir ses statistiques.</p>
        <AppTable :columns="personColumns" :rows="translators" @select="openPerson('stats-translator', $event)" />
      </section>

      <!-- By editor -->
      <section v-else class="stack">
        <p class="muted">Cliquez sur un éditeur pour voir ses statistiques.</p>
        <AppTable :columns="personColumns" :rows="editors" @select="openPerson('stats-editor', $event)" />
      </section>
    </AsyncState>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card.stack > h2 {
  margin-bottom: 0;
}

.period {
  align-items: flex-end;
}
</style>
