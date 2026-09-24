<script>
import { mapState } from 'pinia'
import { useRoleStore } from '../../stores/roleStore.js'
import { getTranslationsOf, setTranslationFinished } from '../../services/textService.js'
import { formatShortDate, formatNumber } from '../../utils/format.js'

import AppTable from '../../components/AppTable.vue'
import AsyncState from '../../components/AsyncState.vue'

// Translator page: the texts given to me.
export default {
  components: { AppTable, AsyncState },

  data() {
    return {
      translations: [],
      loading: true,
      error: null,
      busyId: null, // id of the text we are saving (to disable its button)
      columns: [
        { key: 'cote', label: 'Cote', sortable: true, filter: 'text' },
        { key: 'title', label: 'Titre', sortable: true, filter: 'text' },
        { key: 'words', label: 'Mots', sortable: true, sortBy: 'wordcount', align: 'right' },
        { key: 'deadline', label: 'Mon délai', sortable: true, sortBy: 'deadlineRaw' },
        { key: 'finished', label: 'Statut', filter: 'choice', filterOptions: ['Terminé', 'En cours'] },
      ],
    }
  },

  computed: {
    ...mapState(useRoleStore, ['identity']),

    rows() {
      return this.translations.map(item => ({
        id: item.text.id,
        cote: item.text.cote,
        title: item.text.title,
        wordcount: item.text.wordcount,
        words: formatNumber(item.text.wordcount),
        // This is MY deadline (given by the repartitor), not the final deadline of the text
        deadline: formatShortDate(item.deadline),
        deadlineRaw: item.deadline,
        finished: item.finished ? 'Terminé' : 'En cours',
        isFinished: !!item.finished,
      }))
    },
  },

  methods: {
    goToDetail(row) {
      this.$router.push({ name: 'traduction-detail', params: { id: row.id } })
    },

    // Mark as finished, or undo it (in case of a mistake)
    async toggleFinished(row) {
      this.busyId = row.id
      try {
        await setTranslationFinished(row.id, this.identity.id, !row.isFinished)
        await this.load()
      } catch {
        this.error = 'La modification n\'a pas été enregistrée. Réessayez.'
      } finally {
        this.busyId = null
      }
    },

    async load() {
      this.translations = await getTranslationsOf(this.identity.id)
    },
  },

  async created() {
    try {
      await this.load()
    } catch {
      this.error = 'Impossible de charger vos textes. Réessayez plus tard.'
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
        <h1>Mes textes à traduire</h1>
        <p>{{ identity.firstname }} {{ identity.lastname }} · {{ translations.length }} texte(s)</p>
      </div>
    </header>

    <AsyncState :loading="loading" :error="error">
      <AppTable :columns="columns" :rows="rows" empty-text="Aucun texte pour le moment." @select="goToDetail">
        <template #finished="{ row }">
          <!-- .stop: the click on the button must not open the detail page -->
          <button
            class="sm"
            :class="row.isFinished ? 'ghost' : 'primary'"
            :disabled="busyId === row.id"
            :title="row.isFinished ? 'Annuler : remettre en cours' : ''"
            @click.stop="toggleFinished(row)"
          >
            {{ row.isFinished ? '✓ Terminé' : 'Marquer terminé' }}
          </button>
        </template>
      </AppTable>
    </AsyncState>
  </div>
</template>
