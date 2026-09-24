<script>
import AppTable from '../../components/AppTable.vue'
import AsyncState from '../../components/AsyncState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { getTexts } from '../../services/textService.js'
import { formatShortDate, formatNumber } from '../../utils/format.js'

// Repartitor page: the list of all texts and who works on them.
export default {
  components: { AppTable, AsyncState, StatusBadge },

  data() {
    return {
      texts: [],
      loading: true,
      error: null,
      columns: [
        { key: 'cote', label: 'Cote', sortable: true, filter: 'text' },
        { key: 'title', label: 'Titre', sortable: true, filter: 'text' },
        { key: 'words', label: 'Mots', sortable: true, sortBy: 'wordcount', align: 'right' },
        { key: 'deadline', label: 'Limite', sortable: true, sortBy: 'deadlineRaw' },
        { key: 'translator', label: 'Traducteur', sortable: true, filter: 'text' },
        { key: 'translated', label: 'Traduit', filter: 'choice', filterOptions: ['Oui', 'Non'] },
        { key: 'editor', label: 'Éditeur', sortable: true, filter: 'text' },
        { key: 'finished', label: 'Terminé', filter: 'choice', filterOptions: ['Oui', 'Non'] },
      ],
    }
  },

  computed: {
    // Make the rows for the table from the Supabase data.
    // [0] is the newest translation / edition (see textService.js).
    rows() {
      return this.texts.map(text => ({
        id: text.id,
        cote: text.cote,
        title: text.title,
        wordcount: text.wordcount,
        words: formatNumber(text.wordcount),
        deadline: formatShortDate(text.deadline),
        deadlineRaw: text.deadline, // ISO date: good for the sort
        translator: text.translation?.[0]?.translator ?? null,
        translated: text.translation?.[0]?.finished ? 'Oui' : 'Non',
        editor: text.edition?.[0]?.editor ?? null,
        finished: text.edition?.[0]?.finished ? 'Oui' : 'Non',
      }))
    },
  },

  methods: {
    // Open the page to give the text to a translator and an editor
    goToText(row) {
      this.$router.push({ name: 'text-detail', params: { id: row.id } })
    },
  },

  async created() {
    try {
      this.texts = await getTexts()
    } catch {
      this.error = 'Impossible de charger les textes. Réessayez plus tard.'
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
        <h1>Textes</h1>
        <p>Cliquez sur un texte pour choisir le traducteur et l'éditeur.</p>
      </div>
    </header>

    <AsyncState :loading="loading" :error="error">
      <AppTable :columns="columns" :rows="rows" empty-text="Aucun texte." @select="goToText">
        <template #translated="{ row }">
          <StatusBadge :tone="row.translated === 'Oui' ? 'success' : 'neutral'">{{ row.translated }}</StatusBadge>
        </template>
        <template #finished="{ row }">
          <StatusBadge :tone="row.finished === 'Oui' ? 'success' : 'neutral'">{{ row.finished }}</StatusBadge>
        </template>
      </AppTable>
    </AsyncState>
  </div>
</template>
