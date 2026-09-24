<script>
import { mapState } from 'pinia'
import { useRoleStore } from '../../stores/roleStore.js'
import { getTextById, setTranslationFinished } from '../../services/textService.js'
import { formatLongDate, formatDuration, formatNumber } from '../../utils/format.js'

import AsyncState from '../../components/AsyncState.vue'
import StatusBadge from '../../components/StatusBadge.vue'

// Translator page: details of one of my texts.
export default {
  components: { AsyncState, StatusBadge },

  data() {
    return {
      text: null,
      loading: true,
      error: null,
      saving: false,
    }
  },

  computed: {
    ...mapState(useRoleStore, ['identity']),

    // My translation for this text (a text can have more than one translator)
    myTranslation() {
      return this.text?.translation?.find(t => t.translator === this.identity.id) ?? null
    },

    // Time left before MY deadline
    remaining() {
      if (!this.myTranslation) return ''
      return formatDuration(new Date(this.myTranslation.deadline) - new Date())
    },

    isLate() {
      return !this.myTranslation?.finished && new Date(this.myTranslation?.deadline) < new Date()
    },
  },

  methods: {
    formatLongDate,
    formatNumber,

    async markFinished() {
      this.saving = true
      try {
        await setTranslationFinished(this.text.id, this.identity.id, true)
        this.$router.push({ name: 'traduction' })
      } catch {
        this.error = 'La modification n\'a pas été enregistrée. Réessayez.'
        this.saving = false
      }
    },
  },

  async created() {
    try {
      this.text = await getTextById(this.$route.params.id)
      // The text does not exist, or it is not given to me
      if (!this.myTranslation) this.error = 'Ce texte n\'existe pas ou ne vous est pas attribué.'
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
    <RouterLink :to="{ name: 'traduction' }" class="back">← Mes textes</RouterLink>

    <AsyncState :loading="loading" :error="error">
      <header class="page-header">
        <div>
          <h1>{{ text.title }}</h1>
          <p>{{ text.cote }} · {{ formatNumber(text.wordcount) }} mots</p>
        </div>
        <button class="primary" :disabled="!!myTranslation.finished || saving" @click="markFinished">
          {{ myTranslation.finished ? '✓ Déjà terminé' : 'Marquer comme terminé' }}
        </button>
      </header>

      <section class="card">
        <h2>Ma traduction</h2>
        <dl class="details">
          <dt>Statut</dt>
          <dd>
            <StatusBadge v-if="myTranslation.finished" tone="success">Terminé</StatusBadge>
            <StatusBadge v-else-if="isLate" tone="danger">En retard</StatusBadge>
            <StatusBadge v-else tone="warning">En cours</StatusBadge>
          </dd>
          <dt>Attribué le</dt>
          <dd>{{ formatLongDate(myTranslation.attributed) }}</dd>
          <dt>Mon délai</dt>
          <dd>
            {{ formatLongDate(myTranslation.deadline) }}
            <span v-if="!myTranslation.finished" class="muted">(reste {{ remaining }})</span>
          </dd>
          <template v-if="text.precedent">
            <dt>Texte précédent</dt>
            <dd>n° {{ text.precedent }}</dd>
          </template>
        </dl>
      </section>
    </AsyncState>
  </div>
</template>

<style scoped>
.back {
  font-size: 0.875rem;
  color: var(--text-muted);
}
</style>
