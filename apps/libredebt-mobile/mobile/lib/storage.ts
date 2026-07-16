/**
 * lib/storage.ts — expo-secure-store wrappers
 */

import * as SecureStore from "expo-secure-store"

export const storage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
}
