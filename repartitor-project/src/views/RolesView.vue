<script>
import { mapState, mapActions } from 'pinia'
import { useRoleStore } from '../stores/roleStore.js'
import { getTranslators } from '../services/translatorService.js'
import { getEditors } from '../services/editorService.js'

import AppTable from '../components/AppTable.vue'
import AsyncState from '../components/AsyncState.vue'

// Demo page: the user chooses a role to see the app from each point of view.
export default {
  components: { AppTable, AsyncState },

  data() {
    return {
      translators: [],
      editors: [],
      loading: true,
      error: null,
      columns: [
        { key: 'id', label: 'Trigramme', sortable: true, filter: 'text' },
        { key: 'firstname', label: 'Prénom', sortable: true, filter: 'text' },
        { key: 'lastname', label: 'Nom', sortable: true, filter: 'text' },
      ],
    }
  },

  computed: {
    ...mapState(useRoleStore, ['role', 'identity', 'roleLabel']),
  },

  methods: {
    ...mapActions(useRoleStore, ['setRepartitor', 'setTranslator', 'setEditor']),

    // Choose a role, then open the texts page for this role
    choose(action, person) {
      action(person)
      this.$router.push('/texts')
    },
  },

  async created() {
    try {
      // The two lists load at the same time
      ;[this.translators, this.editors] = await Promise.all([getTranslators(), getEditors()])
    } catch {
      this.error = 'Impossible de charger les personnes. Réessayez plus tard.'
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
        <h1>Choisir un rôle</h1>
        <p>Mode démo : changez de rôle pour voir l'application de chaque point de vue.</p>
      </div>
      <div class="current card">
        <span class="muted small">Rôle actuel</span>
        <strong>
          {{ roleLabel }}<template v-if="identity"> · {{ identity.firstname }} {{ identity.lastname }} ({{ identity.id }})</template>
        </strong>
      </div>
    </header>

    <section class="card row between">
      <div>
        <h2>Répartiteur</h2>
        <p class="muted small">Voit tous les textes et les attribue.</p>
      </div>
      <button class="primary" :disabled="role === 'repartitor'" @click="choose(setRepartitor)">
        {{ role === 'repartitor' ? 'Rôle actif' : 'Devenir répartiteur' }}
      </button>
    </section>

    <AsyncState :loading="loading" :error="error">
      <div class="grid-2">
        <section class="stack">
          <h2>Traducteur</h2>
          <AppTable :columns="columns" :rows="translators" @select="choose(setTranslator, $event)" />
        </section>
        <section class="stack">
          <h2>Éditeur</h2>
          <AppTable :columns="columns" :rows="editors" @select="choose(setEditor, $event)" />
        </section>
      </div>
    </AsyncState>
  </div>
</template>

<style scoped>
.current {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}

.between {
  justify-content: space-between;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
