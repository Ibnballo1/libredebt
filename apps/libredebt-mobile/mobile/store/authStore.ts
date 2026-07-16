/**
 * store/authStore.ts — Zustand auth store
 *
 * Holds the current user and session token. Token is persisted in
 * expo-secure-store; this store is hydrated on app launch.
 */

import { create } from "zustand"
import { storage, TOKEN_KEY } from "@/lib/storage"
import { api } from "@/lib/api"

export type AuthUser = {
  id: string
  name: string
  email: string
  currency: string
  subscriptionTier: "free" | "pro"
  createdAt: string
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser, token: string) => Promise<void>
  clearAuth: () => Promise<void>
  hydrate: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Re-export TOKEN_KEY so other files can import from one place
export { TOKEN_KEY }

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user, token) => {
    await storage.set(TOKEN_KEY, token)
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  clearAuth: async () => {
    await storage.delete(TOKEN_KEY)
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  hydrate: async () => {
    set({ isLoading: true })
    try {
      const token = await storage.get(TOKEN_KEY)
      if (!token) {
        set({ isLoading: false, isAuthenticated: false })
        return
      }
      // Verify token is still valid by fetching the session
      const session = await api.get<{ user: AuthUser }>("/api/auth/get-session")
      if (session?.user) {
        set({ user: session.user, token, isAuthenticated: true })
      } else {
        await storage.delete(TOKEN_KEY)
        set({ isAuthenticated: false })
      }
    } catch {
      await storage.delete(TOKEN_KEY)
      set({ isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  refreshUser: async () => {
    try {
      const session = await api.get<{ user: AuthUser }>("/api/auth/get-session")
      if (session?.user) {
        set({ user: session.user })
      }
    } catch {}
  },
}))
