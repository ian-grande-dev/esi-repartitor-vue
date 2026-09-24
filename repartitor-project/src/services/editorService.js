import { supabase } from '../supabase.js'

// Get all editors, sorted by trigram.
export async function getEditors() {
  const { data, error } = await supabase
    .from('editor')
    .select('*')
    .order('id')
  if (error) throw error
  return data ?? []
}

// Get one editor by trigram (3 letters, for example "ABC").
export async function getEditorById(id) {
  const { data, error } = await supabase
    .from('editor')
    .select('*')
    .eq('id', id)
    .maybeSingle() // returns null (not an error) when nobody has this id
  if (error) throw error
  return data
}
