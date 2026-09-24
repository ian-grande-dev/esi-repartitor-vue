import { createClient } from '@supabase/supabase-js'

// The URL and the public key come from the .env file (see .env.example).
// The publishable key is safe in the browser: the data is protected
// by the Row Level Security rules in the database.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase config. Copy .env.example to .env and fill in the values.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
