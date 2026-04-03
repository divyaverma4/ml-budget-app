// finance-buddy/src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

function normalizeAuthUser(userData) {
  if (!userData) return null
  if (userData.uid) return userData
  if (userData.user?.uid) return userData.user
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized. Check firebase.js config.')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    // Safety net: if Firebase never responds, unblock the app after 5s
    const timeout = setTimeout(() => setLoading(false), 5000)

    return () => { unsubscribe(); clearTimeout(timeout) }
  }, [])

  function signIn(userData) {
    setUser(normalizeAuthUser(userData))
  }

  function signOut() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}