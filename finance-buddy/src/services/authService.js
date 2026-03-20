// All auth-related API calls go here.
// Backend team: define your endpoints and this file will call them.
// i changed it to using firebase auth instead of the endpoints bc i think thats what we talked abouti n the meeting?

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../firebase'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000' 

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user }  
  } catch (error) {
    throw new Error('Login failed')
  }
}

export async function signup(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user }  
  } catch (error) {
    throw new Error('Signup failed')
  }
}

export async function logout() {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    throw new Error('Logout failed')
  }
}
