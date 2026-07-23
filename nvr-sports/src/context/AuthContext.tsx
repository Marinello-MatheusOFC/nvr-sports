import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types/database'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (data: SignUpData) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ error?: string }>
}

interface SignUpData {
  name: string
  email: string
  cpf: string
  phone: string
  birth_date: string
  gender: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchOrCreateProfile(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Promise<User | null> {
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (selErr) console.error('[Auth] profile select error:', selErr.code, selErr.message)
  if (existing) {
    console.log('[Auth] profile found:', existing.id)
    return existing as User
  }

  const name = (authUser.user_metadata?.name as string) || authUser.email?.split('@')[0] || 'Usuário'

  const { data: created, error: insErr } = await supabase
    .from('profiles')
    .upsert({ id: authUser.id, name }, { onConflict: 'id' })
    .select()
    .single()

  if (insErr) {
    console.error('[Auth] profile upsert error:', insErr.code, insErr.message)
    return { id: authUser.id, name, email: authUser.email || '' } as User
  }

  console.log('[Auth] profile created:', created?.id)
  return (created as User) || null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[Auth] loadSession user:', session?.user?.id ?? 'none')
    if (session?.user) {
      const profile = await fetchOrCreateProfile(session.user)
      console.log('[Auth] loadSession profile:', profile)
      setUser(profile)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[Auth] onAuthStateChange:', _event, session?.user?.id ?? 'no user')
        if (session?.user) {
          const profile = await fetchOrCreateProfile(session.user)
          console.log('[Auth] onAuthStateChange profile:', profile)
          setUser(profile)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadSession])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('[Auth] signIn error:', error.message)
      if (error.message.includes('Invalid login')) {
        return { error: 'E-mail ou senha incorretos' }
      }
      return { error: error.message }
    }
    console.log('[Auth] signIn success, user:', data.user?.id)
    if (data.user) {
      const profile = await fetchOrCreateProfile(data.user)
      console.log('[Auth] signIn profile:', profile)
      setUser(profile)
    }
    return {}
  }

  const signUp = async (data: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'E-mail já cadastrado' }
      }
      return { error: 'Erro ao criar conta: ' + error.message }
    }

    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)

    if (error) return { error: error.message }

    setUser({ ...user, ...data })
    return {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
