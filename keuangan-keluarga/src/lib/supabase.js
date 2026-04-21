import { createClient } from '@supabase/supabase-js'

const normalizeSupabaseUrl = (rawUrl) => {
  if (!rawUrl) return rawUrl
  return rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.replace(/^\s+|\s+$/g, '')

let supabase
if (supabaseUrl && supabaseAnonKey) {
  console.log('🔧 Initializing Supabase with URL:', supabaseUrl)
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
} else {
  console.warn('⚠️ Supabase credentials missing. Running in offline-only mode.')
  console.warn('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✓ set' : '✗ missing')
  console.warn('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ set' : '✗ missing')
  supabase = null
}

export { supabase }
export const isSupabaseConfigured = () => !!supabase

export const getCurrentUser = async () => {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getAuthHeaders = async () => {
  if (!supabase) return { 'Authorization': '', 'apikey': '' }
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'apikey': supabaseAnonKey
  }
}
