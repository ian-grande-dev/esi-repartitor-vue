import { defineStore } from 'pinia'
import { supabase } from '../supabase.js'
import { useRoleStore } from './roleStore.js'

// Store for the logged-in user.
// Any component can use it with useAuthStore().
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,        // the logged-in user, or null
    ready: null,       // Promise: done when we know if a session exists
    error: null,       // last login error, shown in the header
  }),

  actions: {
    // Start the Google login (Supabase OAuth).
    // After login, Google sends the user back to this app.
    async login() {
      this.error = null
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) this.error = 'Connexion impossible pour le moment. Réessayez plus tard.'
    },

    // Log out and clean the local data.
    async logout() {
      await supabase.auth.signOut()
      this.user = null
      // Reset the role too, so the next user does not get the old role
      useRoleStore().reset()
    },

    // Check the session when the app starts.
    // The router waits for this before it checks the pages that need login.
    init() {
      this.ready ??= (async () => {
        // Is there already a session? (for example after a page refresh)
        const { data } = await supabase.auth.getSession()
        this.user = data.session?.user ?? null

        // Keep this.user up to date (login, logout, token refresh)
        supabase.auth.onAuthStateChange((_event, session) => {
          this.user = session?.user ?? null
        })
      })()
      return this.ready
    },
  },
})
