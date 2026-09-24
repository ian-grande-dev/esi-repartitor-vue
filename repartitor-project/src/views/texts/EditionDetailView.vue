<script>
import { mapState } from 'pinia'
import { useRoleStore } from '../../stores/roleStore.js'
import { getTextById, setEditionFinished } from '../../services/textService.js'
import { formatLongDate, formatNumber } from '../../utils/format.js'

import AsyncState from '../../components/AsyncState.vue'
import StatusBadge from '../../components/StatusBadge.vue'

// Editor page: details of one of my texts.
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

    // My edition for this text
    myEdition() {
      return this.text?.edition?.find(e => e.editor === this.identity.id) ?? null
    },

    // The translation linked to my edition. The editor can only work when it is finished.
    translationDone() {
      const translation = this.text?.translation?.find(t => t.translator === this.myEdition?.translated_by)
        ?? this.text?.translation?.[0]
      return !!translation?.finished
    },

    canFinish() {
      return this.translationDone && !this.myEdition?.finished
    },
  },

  methods: {
    formatLongDate,
    formatNumber,

    async markFinished() {
      this.saving = true
      try {
        await setEditionFinished(this.text.id, this.identity.id, true)
        this.$router.push({ name: 'edition' })
      } catch {
        this.error = 'La modification n\'a pas été enregistrée. Réessayez.'
        this.saving = false
      }
    },
  },

  async created() {
    try {
      this.text = await getTextById(this.$route.params.id)
      if (!this.myEdition) this.error = 'Ce texte n\'existe pas ou ne vous est pas attribué.'
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
    <RouterLink :to="{ name: 'edition' }" class="back">← Mes textes</RouterLink>

    <AsyncState :loading="loading" :error="error">
      <header class="page-header">
        <div>
          <h1>{{ text.title }}</h1>
          <p>{{ text.cote }} · {{ formatNumber(text.wordcount) }} mots</p>
        </div>
        <button class="primary" :disabled="!canFinish || saving" @click="markFinished">
          {{ myEdition.finished ? '✓ Déjà terminé' : 'Marquer comme terminé' }}
        </button>
      </header>

      <p v-if="!translationDone" class="alert warning">
        La traduction n'est pas encore terminée. Vous pourrez finir l'édition après.
      </p>

      <section class="card">
        <h2>Mon édition</h2>
        <dl class="details">
          <dt>Statut</dt>
          <dd>
            <StatusBadge v-if="myEdition.finished" tone="success">Terminé</StatusBadge>
            <StatusBadge v-else tone="warning">En cours</StatusBadge>
          </dd>
          <dt>Traduction</dt>
          <dd>
            <StatusBadge :tone="translationDone ? 'success' : 'neutral'">
              {{ translationDone ? 'Prête' : 'En attente' }}
            </StatusBadge>
          </dd>
          <dt>Attribué le</dt>
          <dd>{{ formatLongDate(myEdition.attributed) }}</dd>
          <dt>Limite finale</dt>
          <dd>{{ formatLongDate(text.deadline) }}</dd>
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
