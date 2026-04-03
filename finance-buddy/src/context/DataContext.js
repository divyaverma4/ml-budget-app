// finance-buddy/src/context/DataContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, getDocs, query, where, Timestamp,
  doc, setDoc, getDoc, serverTimestamp
} from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { auth } from '../firebase'

const DataContext = createContext(null)

export const CATEGORIES = ['Food', 'Transportation', 'Rent', 'Groceries']

export const DEFAULT_BUDGETS = {
  Food: 300,
  Transportation: 150,
  Rent: 375,
  Groceries: 200,
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getStatus(spent, budget) {
  if (spent > budget) return { label: 'Overspent', color: '#e03c31' }
  if (spent >= budget * 0.85) return { label: 'Limit Reached', color: '#c07800' }
  return { label: 'On Track', color: '#2e7d32' }
}

export function DataProvider({ children }) {
  const { user, loading: authLoading } = useAuth()

  // Hooks ALWAYS run
  const [expenses, setExpenses] = useState([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [budgetPlan, setBudgetPlan] = useState(DEFAULT_BUDGETS)
  const [loading, setLoading] = useState(true)

  // If auth is still loading, do NOT fetch, do NOT throw, do NOT write
  const fetchAll = useCallback(async () => {
    if (authLoading) return

    if (!user) {
      setExpenses([])
      setTotalIncome(0)
      setTotalSavings(0)
      setBudgetPlan(DEFAULT_BUDGETS)
      setLoading(false)
      return
    }

    try {
      const weekStart = getWeekStart()

      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        where('date', '>=', Timestamp.fromDate(weekStart))
      )

      const snapshot = await getDocs(q)
      setExpenses(snapshot.docs.map(d => d.data()))

      const budgetSnap = await getDoc(doc(db, 'budgets', user.uid))
      if (budgetSnap.exists()) {
        const data = budgetSnap.data()
        setTotalIncome(data.totalIncome || 0)
        setTotalSavings(data.totalSavings || 0)
        setBudgetPlan(data.budgetPlan || DEFAULT_BUDGETS)
      }
    } catch (err) {
      console.error('DataContext fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [authLoading, user?.uid])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function addExpense(category, amount) {
    // 1. Prefer AuthContext user
    let uid = user?.uid

    // 2. Fallback to Firebase Auth instance
    if (!uid) {
      uid = auth.currentUser?.uid
    }

    // 3. If still missing, block the write
    if (!uid) {
      throw new Error("User not ready in DataContext")
    }

    const payload = {
      userId: uid,
      category,
      amount,
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    await addDoc(collection(db, "expenses"), payload)
    await fetchAll()
  }


  const spending = {}
  expenses.forEach(exp => {
    spending[exp.category] = (spending[exp.category] || 0) + exp.amount
  })

  return (
    <DataContext.Provider value={{
      expenses,
      spending,
      totalIncome,
      totalSavings,
      budgetPlan,
      loading,
      addExpense,
      refresh: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}