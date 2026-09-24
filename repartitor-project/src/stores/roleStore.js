import { defineStore } from 'pinia'

// The app has 3 roles: repartitor, translator and editor.
// For this school project, the user can choose a role on the "Rôles" page
// to test each point of view. The choice is saved in the browser (localStorage).

const STORAGE_KEY = 'repartitor-role'
const DEFAULT_STATE = { role: 'repartitor', identity: null }

// Read the saved role when the page opens (so it stays after F5).
function loadFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    // A translator or an editor must have an identity. If not, the data is broken.
    if (saved?.role === 'repartitor') return { ...DEFAULT_STATE }
    if (['translator', 'editor'].includes(saved?.role) && saved.identity?.id) return saved
  } catch {
    // Broken JSON: we use the default role
  }
  return { ...DEFAULT_STATE }
}

export const useRoleStore = defineStore('role', {
  state: () => loadFromStorage(),

  getters: {
    // Name of the role in French, for the interface
    roleLabel: state => ({
      repartitor: 'Répartiteur',
      translator: 'Traducteur',
      editor: 'Éditeur',
    })[state.role],
  },

  actions: {
    setRepartitor() {
      this.role = 'repartitor'
      this.identity = null // the repartitor is not a specific person
      this.save()
    },

    // translator = { id, firstname, lastname, expectedthroughput }
    setTranslator(translator) {
      this.role = 'translator'
      this.identity = translator
      this.save()
    },

    // editor = { id, firstname, lastname }
    setEditor(editor) {
      this.role = 'editor'
      this.identity = editor
      this.save()
    },

    // Go back to the default role (used on logout)
    reset() {
      this.$patch({ ...DEFAULT_STATE })
      localStorage.removeItem(STORAGE_KEY)
    },

    // Save the role in the browser
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        role: this.role,
        identity: this.identity,
      }))
    },
  },
})
