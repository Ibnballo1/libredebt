/**
 * store/preferencesStore.ts — App preferences (non-sensitive)
 */

import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"

type PreferencesState = {
  currency: string
  notificationsEnabled: boolean
  biometricEnabled: boolean
  setCurrency: (currency: string) => void
  setNotificationsEnabled: (v: boolean) => void
  setBiometricEnabled: (v: boolean) => void
  load: () => Promise<void>
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  currency: "NGN",
  notificationsEnabled: true,
  biometricEnabled: false,

  setCurrency: (currency) => {
    set({ currency })
    AsyncStorage.setItem("pref_currency", currency)
  },

  setNotificationsEnabled: (v) => {
    set({ notificationsEnabled: v })
    AsyncStorage.setItem("pref_notifications", String(v))
  },

  setBiometricEnabled: (v) => {
    set({ biometricEnabled: v })
    AsyncStorage.setItem("pref_biometric", String(v))
  },

  load: async () => {
    const [currency, notifs, biometric] = await Promise.all([
      AsyncStorage.getItem("pref_currency"),
      AsyncStorage.getItem("pref_notifications"),
      AsyncStorage.getItem("pref_biometric"),
    ])
    set({
      currency: currency ?? "NGN",
      notificationsEnabled: notifs !== "false",
      biometricEnabled: biometric === "true",
    })
  },
}))
