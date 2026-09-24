<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '../stores/authStore.js'

export default {
  computed: {
    ...mapState(useAuthStore, ['user']),
  },
  methods: {
    ...mapActions(useAuthStore, ['login']),
  },
}
</script>

<template>
  <div class="page home">
    <section class="hero">
      <h1>Répartir les textes à traduire, simplement.</h1>
      <p>
        Répartitor aide une équipe de traduction à donner chaque texte à la bonne personne,
        à suivre l'avancement et à respecter les délais.
      </p>
      <div class="row">
        <button v-if="!user" class="primary" @click="login">Se connecter avec Google</button>
        <template v-else>
          <RouterLink to="/texts" class="btn primary-link">Voir les textes</RouterLink>
          <RouterLink to="/stats" class="btn">Statistiques</RouterLink>
        </template>
      </div>
    </section>

    <section class="features">
      <article class="card">
        <h3>Répartiteur</h3>
        <p class="muted">Attribue chaque texte à un traducteur puis à un éditeur, en voyant la charge de travail de chacun.</p>
      </article>
      <article class="card">
        <h3>Traducteur</h3>
        <p class="muted">Voit ses textes, ses délais personnels et marque une traduction comme terminée.</p>
      </article>
      <article class="card">
        <h3>Éditeur</h3>
        <p class="muted">Relit les textes dès que la traduction est prête et suit ses retards.</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.hero {
  max-width: 640px;
  padding: 3rem 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero h1 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  letter-spacing: -0.03em;
}

.hero p {
  font-size: 1.05rem;
  color: var(--text-muted);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.features h3 {
  margin-bottom: 0.4rem;
}

.btn {
  color: var(--text);
  text-decoration: none;
}

.btn.primary-link {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.btn.primary-link:hover {
  background: var(--accent-hover);
}
</style>
