/**
 * lib/api.ts — Authenticated fetch wrapper
 *
 * All API calls go through this. Reads the session token from
 * secure store and attaches it as a Bearer token on every request.
 */

import * as SecureStore from "expo-secure-store"

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? ""
export const TOKEN_KEY = "libredebt_session_token"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    throw new ApiError(401, "Session expired. Please sign in again.")
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.error ?? body.message ?? message
    } catch {}
    throw new ApiError(res.status, message)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
}
