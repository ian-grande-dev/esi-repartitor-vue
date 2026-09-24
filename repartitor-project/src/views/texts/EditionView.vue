<script>
import { mapState } from 'pinia'
import { useRoleStore } from '../../stores/roleStore.js'
import { getEditionsOf, setEditionFinished } from '../../services/textService.js'
import { formatShortDate, formatNumber } from '../../utils/format.js'

import AppTable from '../../components/AppTable.vue'
import AsyncState from '../../components/AsyncState.vue'
import StatusBadge from '../../components/StatusBadge.vue'

// Editor page: the texts given to me.
// I can only finish an edition when the translation is done.
export default {
  components: { AppTable, AsyncState, StatusBadge },

  data() {
    return {
      editions: [],
      loading: true,
      error: null,
      busyId: null,
      columns: [
        { key: 'cote', label: 'Cote', sortable: true, filter: 'text' },
        { key: 'title', label: 'Titre', sortable: true, filter: 'text' },
        { key: 'words', label: 'Mots', sortable: true, sortBy: 'wordcount', align: 'right' },
        { key: 'available', label: 'Traduction', filter: 'choice', filterOptions: ['Prête', 'En attente'] },
        { key: 'deadline', label: 'Limite', sortable: true, sortBy: 'deadlineRaw' },
        { key: 'finished', label: 'Statut', filter: 'choice', filterOptions: ['Terminé', 'En cours'] },
      ],
    }
  },

  computed: {
    ...mapState(useRoleStore, ['identity']),

    rows() {
      return this.editions.map(item => {
        // The translation linked to this edition (column translated_by)
        const translation = item.text.translation?.find(t => t.translator === item.translated_by)
          ?? item.text.translation?.[0]
        const isAvailable = !!translation?.finished
        return {
          id: item.text.id,
          cote: item.text.cote,
          title: item.text.title,
          wordcount: item.text.wordcount,
          words: formatNumber(item.text.wordcount),
          available: isAvailable ? 'Prête' : 'En attente',
          deadline: formatShortDate(item.text.deadline),
          deadlineRaw: item.text.deadline,
          finished: item.finished ? 'Terminé' : 'En cours',
          isAvailable,
          isFinished: !!item.finished,
        }
      })
    },
  },

  methods: {
    goToDetail(row) {
      this.$router.push({ name: 'edition-detail', params: { id: row.id } })
    },

    // Mark as finished, or undo it (in case of a mistake)
    async toggleFinished(row) {
      this.busyId = row.id
      try {
        await setEditionFinished(row.id, this.identity.id, !row.isFinished)
        await this.load()
      } catch {
        this.error = 'La modification n\'a pas été enregistrée. Réessayez.'
      } finally {
        this.busyId = null
      }
    },

    async load() {
      this.editions = await getEditionsOf(this.identity.id)
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
        <h1>Mes textes à éditer</h1>
        <p>{{ identity.firstname }} {{ identity.lastname }} · {{ editions.length }} texte(s)</p>
      </div>
    </header>

    <AsyncState :loading="loading" :error="error">
      <AppTable :columns="columns" :rows="rows" empty-text="Aucun texte pour le moment." @select="goToDetail">
        <template #available="{ row }">
          <StatusBadge :tone="row.isAvailable ? 'success' : 'warning'">{{ row.available }}</StatusBadge>
        </template>
        <template #finished="{ row }">
          <span v-if="!row.isAvailable" class="muted small">—</span>
          <!-- .stop: the click on the button must not open the detail page -->
          <button
            v-else
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
