<script>
import {
  getTextById,
  assignTranslator,
  assignEditor,
  getTranslatorWorkload,
  getEditorWorkload,
} from '../../services/textService.js'
import { getTranslators } from '../../services/translatorService.js'
import { getEditors } from '../../services/editorService.js'
import { formatLongDate, formatDuration, formatDays, formatNumber } from '../../utils/format.js'

import AppTable from '../../components/AppTable.vue'
import AsyncState from '../../components/AsyncState.vue'
import StatusBadge from '../../components/StatusBadge.vue'

// Repartitor page: give one text to a translator and to an editor.
export default {
  components: { AppTable, AsyncState, StatusBadge },

  data() {
    return {
      text: null,
      translators: [],
      editors: [],
      translatorWorkload: [], // from the SQL view translator_workload
      editorWorkload: {},     // { editorId: { ready, waiting } }

      loading: true,
      error: null,       // error when the page loads
      saveError: null,   // error when we save an attribution
      saving: false,

      // Show or hide the tables to choose a person
      showTranslators: false,
      showEditors: false,

      selectedTranslator: null,
      translatorDeadline: '', // value of the <input type="datetime-local">
      selectedEditor: null,

      translatorColumns: [
        { key: 'id', label: 'Trigramme', sortable: true, filter: 'text' },
        { key: 'firstname', label: 'Prénom', sortable: true, filter: 'text' },
        { key: 'lastname', label: 'Nom', sortable: true, filter: 'text' },
        { key: 'load', label: 'Charge (jours)', sortable: true, align: 'right' },
      ],
      editorColumns: [
        { key: 'id', label: 'Trigramme', sortable: true, filter: 'text' },
        { key: 'firstname', label: 'Prénom', sortable: true, filter: 'text' },
        { key: 'lastname', label: 'Nom', sortable: true, filter: 'text' },
        { key: 'ready', label: 'À traiter', sortable: true, align: 'right' },
        { key: 'waiting', label: 'En attente', sortable: true, align: 'right' },
      ],
    }
  },

  computed: {
    textId() {
      return this.$route.params.id
    },

    // [0] = newest translation / edition (see textService.js)
    currentTranslation() {
      return this.text?.translation?.[0] ?? null
    },
    currentEdition() {
      return this.text?.edition?.[0] ?? null
    },

    // Time left before the final deadline of the text
    remainingTime() {
      return formatDuration(new Date(this.text.deadline) - new Date())
    },

    // The translator deadline is in the past
    deadlineInPast() {
      return !!this.translatorDeadline && new Date(this.translatorDeadline) <= new Date()
    },

    // The translator deadline is after the final deadline of the text
    deadlineTooLate() {
      return !!this.translatorDeadline && new Date(this.translatorDeadline) > new Date(this.text.deadline)
    },

    canAssignTranslator() {
      return this.selectedTranslator && this.translatorDeadline && !this.deadlineInPast && !this.saving
    },

    // Translators with their current workload (in work days)
    translatorsWithLoad() {
      return this.translators.map(translator => {
        const workload = this.translatorWorkload.find(w => w.translator === translator.id)
        const busyDays = workload?.busydays ?? 0
        return {
          ...translator,
          load: Math.round(busyDays * 10) / 10, // 1 decimal
          busyDays,
        }
      })
    },

    // Editors with their workload
    editorsWithLoad() {
      return this.editors.map(editor => ({
        ...editor,
        ...(this.editorWorkload[editor.id] ?? { ready: 0, waiting: 0 }),
      }))
    },

    // Summary shown before the translator is saved.
    // ETP = "équivalent temps plein" (full-time work days).
    translatorSummary() {
      if (!this.selectedTranslator || !this.translatorDeadline) return null

      const deadline = new Date(this.translatorDeadline)
      const wordsPerDay = this.selectedTranslator.expectedthroughput || 1000 // 1000 = default in the database
      const textDays = this.text.wordcount / wordsPerDay
      const busyDays = this.selectedTranslator.busyDays

      return {
        deadline: formatLongDate(deadline),
        delay: formatDuration(deadline - new Date()),
        textDays: formatDays(textDays),
        wordsPerDay: formatNumber(wordsPerDay),
        busy: formatDays(busyDays),
        newTotal: formatDays(busyDays + textDays),
      }
    },
  },

  methods: {
    formatLongDate,
    formatNumber,

    // Load everything at the same time (faster than one after the other)
    async loadAll() {
      ;[this.text, this.translators, this.editors, this.translatorWorkload, this.editorWorkload] =
        await Promise.all([
          getTextById(this.textId),
          getTranslators(),
          getEditors(),
          getTranslatorWorkload(),
          getEditorWorkload(),
        ])
      if (!this.text) this.error = 'Ce texte n\'existe pas.'
    },

    selectTranslator(row) {
      this.selectedTranslator = row
      this.showTranslators = false
    },

    clearTranslator() {
      this.selectedTranslator = null
      this.translatorDeadline = ''
    },

    selectEditor(row) {
      this.selectedEditor = row
      this.showEditors = false
    },

    // Runs a save action. It shows an error if Supabase fails,
    // then reloads the data so the page is up to date.
    async save(action) {
      this.saving = true
      this.saveError = null
      try {
        await action()
        await this.loadAll()
      } catch {
        this.saveError = 'L\'attribution n\'a pas été enregistrée. Réessayez.'
      } finally {
        this.saving = false
      }
    },

    doAssignTranslator() {
      if (!this.canAssignTranslator) return
      return this.save(async () => {
        await assignTranslator(this.text.id, this.selectedTranslator.id, this.translatorDeadline)
        this.clearTranslator()
      })
    },

    // translated_by = the current translator, to link the edition to the right translation
    doAssignEditor() {
      if (!this.selectedEditor) return
      return this.save(async () => {
        await assignEditor(this.text.id, this.selectedEditor.id, this.currentTranslation?.translator ?? null)
        this.selectedEditor = null
      })
    },
  },

  // When we go to the previous text, the page stays the same but the id changes
  watch: {
    textId() {
      this.loading = true
      this.error = null
      this.loadAll()
        .catch(() => { this.error = 'Impossible de charger le texte. Réessayez plus tard.' })
        .finally(() => { this.loading = false })
    },
  },

  async created() {
    try {
      await this.loadAll()
    } catch {
      this.error = 'Impossible de charger le texte. Réessayez plus tard.'
    } finally {
      this.loading = false
    }
  },
}
</script>

<template>
  <div class="page">
    <div class="row">
      <RouterLink :to="{ name: 'repartition' }" class="back">← Tous les textes</RouterLink>
      <RouterLink
        v-if="text?.precedent"
        :to="{ name: 'text-detail', params: { id: text.precedent } }"
        class="back"
      >
        Texte précédent
      </RouterLink>
    </div>

    <AsyncState :loading="loading" :error="error">
      <header class="page-header">
        <div>
          <h1>{{ text.title }}</h1>
          <p>{{ text.cote }} · {{ formatNumber(text.wordcount) }} mots</p>
        </div>
      </header>

      <p v-if="saveError" class="alert danger" role="alert">{{ saveError }}</p>

      <!-- Deadlines -->
      <section class="card">
        <h2>Échéances</h2>
        <dl class="details">
          <dt>Reçu le</dt>
          <dd>{{ formatLongDate(text.received) }}</dd>
          <dt>À rendre pour le</dt>
          <dd>
            {{ formatLongDate(text.deadline) }}
            <span class="muted">(reste {{ remainingTime }})</span>
          </dd>
        </dl>
      </section>

      <!-- Translation -->
      <section class="card stack">
        <div class="section-head">
          <h2>Traduction</h2>
          <span v-if="currentTranslation" class="current">
            <strong>{{ currentTranslation.translator }}</strong>
            <StatusBadge :tone="currentTranslation.finished ? 'success' : 'warning'">
              {{ currentTranslation.finished ? 'Terminé' : 'En cours' }}
            </StatusBadge>
          </span>
          <span v-else class="muted small">Pas encore attribué</span>
        </div>

        <div v-if="selectedTranslator" class="selection">
          <div class="row">
            <span>
              Traducteur choisi :
              <strong>{{ selectedTranslator.firstname }} {{ selectedTranslator.lastname }} ({{ selectedTranslator.id }})</strong>
            </span>
            <button class="ghost icon" aria-label="Retirer" @click="clearTranslator">✕</button>
          </div>

          <label class="field">
            Délai du traducteur
            <input v-model="translatorDeadline" type="datetime-local" />
          </label>

          <p v-if="deadlineInPast" class="alert danger">Le délai doit être dans le futur.</p>
          <p v-else-if="deadlineTooLate" class="alert warning">
            Attention : ce délai est après la date limite finale du texte.
          </p>

          <div v-if="translatorSummary && !deadlineInPast" class="summary">
            <p>
              Attribuer à <strong>{{ selectedTranslator.firstname }} {{ selectedTranslator.lastname }}</strong>
              pour le {{ translatorSummary.deadline }}, soit un délai de {{ translatorSummary.delay }}
              pour {{ formatNumber(text.wordcount) }} mots
              ({{ translatorSummary.textDays }} ETP à {{ translatorSummary.wordsPerDay }} mots par jour).
            </p>
            <p class="muted">
              Charge actuelle : {{ translatorSummary.busy }} ETP.
              Après attribution : {{ translatorSummary.newTotal }}.
            </p>
          </div>

          <div class="row">
            <button class="primary" :disabled="!canAssignTranslator" @click="doAssignTranslator">
              Valider l'attribution
            </button>
          </div>
        </div>

        <div>
          <button @click="showTranslators = !showTranslators">
            {{ showTranslators ? 'Masquer la liste' : (currentTranslation ? 'Changer de traducteur' : 'Choisir un traducteur') }}
          </button>
        </div>
        <AppTable
          v-if="showTranslators"
          :columns="translatorColumns"
          :rows="translatorsWithLoad"
          @select="selectTranslator"
        />
      </section>

      <!-- Edition -->
      <section class="card stack">
        <div class="section-head">
          <h2>Édition</h2>
          <span v-if="currentEdition" class="current">
            <strong>{{ currentEdition.editor }}</strong>
            <StatusBadge :tone="currentEdition.finished ? 'success' : 'warning'">
              {{ currentEdition.finished ? 'Terminé' : 'En cours' }}
            </StatusBadge>
          </span>
          <span v-else class="muted small">Pas encore attribué</span>
        </div>

        <div v-if="selectedEditor" class="selection">
          <div class="row">
            <span>
              Éditeur choisi :
              <strong>{{ selectedEditor.firstname }} {{ selectedEditor.lastname }} ({{ selectedEditor.id }})</strong>
            </span>
            <button class="ghost icon" aria-label="Retirer" @click="selectedEditor = null">✕</button>
          </div>
          <div class="row">
            <button class="primary" :disabled="saving" @click="doAssignEditor">Valider l'attribution</button>
          </div>
        </div>

        <div>
          <button @click="showEditors = !showEditors">
            {{ showEditors ? 'Masquer la liste' : (currentEdition ? 'Changer d\'éditeur' : 'Choisir un éditeur') }}
          </button>
        </div>
        <AppTable v-if="showEditors" :columns="editorColumns" :rows="editorsWithLoad" @select="selectEditor" />
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

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.current {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.selection {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
}

.field {
  max-width: 260px;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}
</style>
