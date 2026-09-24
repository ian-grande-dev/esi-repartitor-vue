import { supabase } from '../supabase.js'

// Get all translators, sorted by trigram.
export async function getTranslators() {
  const { data, error } = await supabase
    .from('translator')
    .select('*')
    .order('id')
  if (error) throw error
  return data ?? []
}

// Get one translator by trigram (3 letters, for example "ABC").
export async function getTranslatorById(id) {
  const { data, error } = await supabase
    .from('translator')
    .select('*')
    .eq('id', id)
    .maybeSingle() // returns null (not an error) when nobody has this id
  if (error) throw error
  return data
}
