import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured, using anonymous mode')
          setLoading(false)
          setIsReady(true)
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
          console.log('Authenticated as:', user.id)
        } else {
          // Try anonymous sign-in for seamless onboarding
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error) {
            // If anonymous sign-in fails, continue without auth (localStorage only mode)
            console.warn('Anonymous auth failed, falling back to localStorage-only mode:', error.message)
            setError('Auth unavailable - using offline mode')
          } else {
            setUser(data.user)
            console.log('Anonymous user created:', data.user.id)
          }
        }
      } catch (err) {
        console.error('Auth init error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
        setIsReady(true)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        setUser(session?.user || null)
        setLoading(false)
      }
    ) || { data: { subscription: { unsubscribe: () => {} } } }

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  const sendMagicLink = async (email) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
    return data
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isSupabaseConfigured: isSupabaseConfigured(),
    isReady,
    userId: user?.id,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
