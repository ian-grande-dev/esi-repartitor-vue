import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import { useRoleStore } from '../stores/roleStore.js'

// Pages are loaded only when the user opens them (lazy loading).
// meta.requiresAuth = the user must be logged in
// meta.role         = only this role can open the page
const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },

  {
    path: '/roles',
    name: 'roles',
    component: () => import('../views/RolesView.vue'),
    meta: { requiresAuth: true },
  },

  // ---- Texts ----
  // TextsView only shows <RouterView />. The router chooses the right child
  // page for the current role (see beforeEach below).
  {
    path: '/texts',
    name: 'texts',
    component: () => import('../views/TextsView.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'repartition',          name: 'repartition',       component: () => import('../views/texts/RepartitionView.vue'),      meta: { role: 'repartitor' } },
      { path: 'repartition/text/:id', name: 'text-detail',       component: () => import('../views/texts/TextDetailView.vue'),       meta: { role: 'repartitor' } },
      { path: 'traduction',           name: 'traduction',        component: () => import('../views/texts/TraductionView.vue'),       meta: { role: 'translator' } },
      { path: 'traduction/text/:id',  name: 'traduction-detail', component: () => import('../views/texts/TraductionDetailView.vue'), meta: { role: 'translator' } },
      { path: 'edition',              name: 'edition',           component: () => import('../views/texts/EditionView.vue'),          meta: { role: 'editor' } },
      { path: 'edition/text/:id',     name: 'edition-detail',    component: () => import('../views/texts/EditionDetailView.vue'),    meta: { role: 'editor' } },
    ],
  },

  // ---- Statistics ----
  {
    path: '/stats',
    name: 'stats',
    component: () => import('../views/StatsView.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'global',         name: 'stats-global',     component: () => import('../views/stats/StatsGlobalView.vue') },
      { path: 'translator/:id', name: 'stats-translator', component: () => import('../views/stats/StatsTranslatorView.vue') },
      { path: 'editor/:id',     name: 'stats-editor',     component: () => import('../views/stats/StatsEditorView.vue') },
    ],
  },

  // Unknown URL -> home page
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // clean URLs, without #
  routes,
})

// The text list page for each role
const TEXTS_HOME = {
  repartitor: 'repartition',
  translator: 'traduction',
  editor: 'edition',
}

// Runs before each page change: checks login and role.
// Note: this only changes what the user SEES. The real data protection
// is done in the database with Row Level Security.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const { role, identity } = useRoleStore()

  // Wait until we know if a session exists (important after a page refresh)
  await auth.init()

  // 1. Page needs login, but the user is not logged in
  if (to.matched.some(r => r.meta.requiresAuth) && !auth.user) {
    return { name: 'home' }
  }

  // 2. Texts: each role has its own pages
  if (to.name === 'texts' || (to.meta.role && to.meta.role !== role)) {
    return { name: TEXTS_HOME[role] }
  }

  // 3. Stats: translators and editors can only see their own page
  const ownStats = { translator: 'stats-translator', editor: 'stats-editor' }[role]
  if (to.path.startsWith('/stats')) {
    if (ownStats && (to.name !== ownStats || to.params.id !== identity?.id)) {
      return { name: ownStats, params: { id: identity.id } }
    }
    if (role === 'repartitor' && to.name === 'stats') {
      return { name: 'stats-global' }
    }
  }
  // No return = the navigation continues
})

export default router
