<script>
import { mapState } from 'pinia'
import { useRoleStore } from '../stores/roleStore.js'
import { getTranslatorById } from '../services/translatorService.js'
import { getEditorById } from '../services/editorService.js'
import {
  getCurrentTranslatorStats, getPastTranslatorStats,
  getCurrentEditorStats, getPastEditorStats,
} from '../services/statsService.js'
import { defaultPeriod, daysBetween, formatLongDate } from '../utils/format.js'

import AsyncState from './AsyncState.vue'
import StatTable from './StatTable.vue'

// Stats of ONE person. The same page works for a translator and for an editor:
// only the queries and some words change.
const KINDS = {
  translator: {
    title: 'Traducteur',
    doneLabel: 'Traduits',
    getPerson: getTranslatorById,
    getCurrent: getCurrentTranslatorStats,
    getPast: getPastTranslatorStats,
  },
  editor: {
    title: 'Éditeur',
    doneLabel: 'Édités',
    getPerson: getEditorById,
    getCurrent: getCurrentEditorStats,
    getPast: getPastEditorStats,
  },
}

export default {
  components: { AsyncState, StatTable },

  props: {
    kind: { type: String, required: true, validator: v => v in KINDS },
    personId: { type: String, required: true },
  },

  data() {
    // If we come from the global stats page, we keep the same period (in the URL)
    const period = defaultPeriod()
    return {
      person: null,
      current: null,
      past: null,
      loading: true,
      loadingPast: false,
      error: null,
      dateFrom: this.$route.query.from ?? period.from,
      dateTo: this.$route.query.to ?? period.to,
    }
  },

  computed: {
    ...mapState(useRoleStore, ['role']),

    config() {
      return KINDS[this.kind]
    },

    periodValid() {
      return this.dateFrom && this.dateTo && new Date(this.dateFrom) <= new Date(this.dateTo)
    },

    currentRows() {
      return [{ label: 'En main', ...this.current }]
    },

    pastRows() {
      return [
        { label: 'Attribués', ...this.past.assigned },
        { label: this.config.doneLabel, ...this.past.done },
        { label: 'dont rendus en retard', ...this.past.late, sub: true },
      ]
    },

    periodText() {
      return `Textes attribués du ${formatLongDate(this.dateFrom)} au ${formatLongDate(this.dateTo)} `
        + `(${daysBetween(this.dateFrom, this.dateTo)} jours).`
    },
  },

  methods: {
    // Past stats are only loaded when the user clicks, to avoid too many queries
    async loadPast() {
      if (!this.periodValid) return
      this.loadingPast = true
      try {
        this.past = await this.config.getPast(this.personId, this.dateFrom, this.dateTo)
      } catch {
        this.error = 'Impossible de charger les statistiques. Réessayez plus tard.'
      } finally {
        this.loadingPast = false
      }
    },
  },

  async created() {
    try {
      // The person and the current stats load at the same time
      ;[this.person, this.current] = await Promise.all([
        this.config.getPerson(this.personId),
        this.config.getCurrent(this.personId),
      ])
      if (!this.person) this.error = 'Cette personne n\'existe pas.'
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
    <RouterLink v-if="role === 'repartitor'" :to="{ name: 'stats-global' }" class="back">
      ← Statistiques globales
    </RouterLink>

    <AsyncState :loading="loading" :error="error">
      <header class="page-header">
        <div>
          <h1>{{ person.firstname }} {{ person.lastname }}</h1>
          <p>{{ config.title }} · {{ person.id }}</p>
        </div>
      </header>

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

        <template v-if="past">
          <p class="muted small">{{ periodText }}</p>
          <StatTable :rows="pastRows" />
        </template>
        <p v-else class="muted small">Choisissez une période puis cliquez sur « Afficher ».</p>
      </section>
    </AsyncState>
  </div>
</template>

<style scoped>
.back {
  font-size: 0.875rem;
  color: var(--text-muted);
}

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
