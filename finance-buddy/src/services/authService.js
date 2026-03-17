// All auth-related API calls go here.
// Backend team: define your endpoints and this file will call them.

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function logout() {
  const res = await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' })
  if (!res.ok) throw new Error('Logout failed')
}
