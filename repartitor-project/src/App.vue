<script>
import { RouterView, RouterLink } from 'vue-router'
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from './stores/authStore.js'
import { useRoleStore } from './stores/roleStore.js'

export default {
  components: { RouterView, RouterLink },

  computed: {
    ...mapState(useAuthStore, ['user', 'error']),
    ...mapState(useRoleStore, ['role', 'identity', 'roleLabel']),

    // Text shown next to the role, for example "Marie Dupont"
    identityName() {
      return this.identity ? `${this.identity.firstname} ${this.identity.lastname}` : null
    },
  },

  methods: {
    ...mapActions(useAuthStore, ['login', 'logout']),
  },

  watch: {
    // After logout, go back to the home page
    user(newUser) {
      if (!newUser) this.$router.push({ name: 'home' })
    },
  },

  created() {
    useAuthStore().init()
  },
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <RouterLink to="/" class="brand">
        <span class="logo" aria-hidden="true">R</span>
        Répartitor
      </RouterLink>

      <nav v-if="user" aria-label="Menu principal">
        <RouterLink to="/texts">Textes</RouterLink>
        <RouterLink to="/stats">Statistiques</RouterLink>
        <RouterLink to="/roles">Rôles</RouterLink>
      </nav>

      <div class="account">
        <template v-if="user">
          <div class="who">
            <span class="role">{{ roleLabel }}<template v-if="identityName"> · {{ identityName }}</template></span>
            <span class="email">{{ user.email }}</span>
          </div>
          <button class="ghost sm" @click="logout">Se déconnecter</button>
        </template>
        <button v-else class="primary sm" @click="login">Se connecter avec Google</button>
      </div>
    </div>
  </header>

  <main>
    <p v-if="error" class="alert danger" role="alert">{{ error }}</p>
    <RouterView />
  </main>

  <footer>
    Ian Grande · Projet HE2B-ESI · Vue 3, Pinia, Supabase
  </footer>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text);
  font-weight: 600;
  text-decoration: none;
}

.logo {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--text);
  color: var(--bg);
  font-size: 0.85rem;
  font-weight: 700;
}

nav {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
}

nav a {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

nav a:hover {
  color: var(--text);
  background: var(--surface-muted);
}

nav a.router-link-active {
  color: var(--text);
  background: var(--surface-muted);
}

.account {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.who {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}

.role {
  font-size: 0.8rem;
  font-weight: 500;
}

.email {
  font-size: 0.75rem;
  color: var(--text-muted);
}

main {
  max-width: 1200px;
  min-height: calc(100vh - 60px - 64px);
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

main > .alert {
  margin-bottom: 1.5rem;
}

footer {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--border);
  color: var(--text-subtle);
  font-size: 0.8rem;
}

/* Small screens: hide the email to save space */
@media (max-width: 720px) {
  .topbar-inner { gap: 1rem; padding: 0 1rem; }
  .email { display: none; }
  main { padding: 1.5rem 1rem; }
}
</style>
