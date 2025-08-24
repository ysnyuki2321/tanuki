"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { AuthService, type AuthState } from "@/lib/auth"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const authService = AuthService.getInstance()

  useEffect(() => {
    // Check for existing session on mount
    const user = authService.getCurrentUser()
    setState({
      user,
      isLoading: false,
      isAuthenticated: !!user,
    })
  }, [])

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    const { user, error } = await authService.signIn(email, password)

    if (user) {
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
      return { success: true }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }))
      return { success: false, error: error || "Sign in failed" }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setState((prev) => ({ ...prev, isLoading: true }))

    const { user, error } = await authService.signUp(email, password, name)

    if (user) {
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
      return { success: true }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }))
      return { success: false, error: error || "Sign up failed" }
    }
  }

  const signOut = async () => {
    await authService.signOut()
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  return <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
