import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured, using localStorage only')
          setLoading(false)
          setIsReady(true)
          return
        }

        // No auth needed - just mark as ready
        setLoading(false)
        setIsReady(true)
      } catch (err) {
        console.error('Init error:', err)
        setError(err.message)
        setLoading(false)
        setIsReady(true)
      }
    }

    init()
  }, [])

  const value = {
    user: null,
    loading,
    error,
    isAuthenticated: false,
    isSupabaseConfigured: isSupabaseConfigured(),
    isReady,
    userId: null,
    signIn: () => Promise.reject('Auth not supported'),
    signUp: () => Promise.reject('Auth not supported'),
    signOut: () => Promise.reject('Auth not supported'),
    sendMagicLink: () => Promise.reject('Auth not supported'),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
