// finance-buddy/src/context/DataContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, getDocs, query, where, Timestamp,
  doc, setDoc, getDoc, serverTimestamp
} from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { auth } from '../firebase'
import { getAuth } from 'firebase/auth'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

const DataContext = createContext(null)

export const CATEGORIES = ['Food', 'Transportation', 'Rent', 'Groceries']

export const DEFAULT_BUDGETS = {
  Food: 300,
  Transportation: 150,
  Rent: 1200,
  Groceries: 200,
}

const CATEGORY_WEIGHTS = {
  Food: 0.30,
  Transportation: 0.15,
  Rent: 0.35,
  Groceries: 0.20,
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
        collection(db, 'variable_expenses'),
        where('uid', '==', user.uid),
        where('timestamp', '>=', Timestamp.fromDate(weekStart))
      )

      const snapshot = await getDocs(q)
      setExpenses(snapshot.docs.map(d => d.data()))
      // Read income from users/{uid}
      const userSnap = await getDoc(doc(db, 'users', user.uid))
        if (userSnap.exists()) {
        const userData = userSnap.data()
        const income = userData.monthly_income || 0
        const rate = userData.savings_rate || 0
        setTotalIncome(income)
        setTotalSavings(Math.round(income * rate))
        }

// Read budget plan from budgets/{uid}
      const budgetSnap = await getDoc(doc(db, 'budgets', user.uid))
      if (budgetSnap.exists()) {
          const data = budgetSnap.data()
          const needs = data.needs || 0
          const wants = data.wants || 0
          if (needs > 0 || wants > 0) {
              setBudgetPlan({
                  Rent: Math.round(needs * 0.65),
                  Groceries: Math.round(needs * 0.35),
                  Food: Math.round(wants * 0.60),
                  Transportation: Math.round(wants * 0.40),
              })
          }
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

  function getCurrentUid() {
    let uid = user?.uid
    if (!uid) {
      uid = auth.currentUser?.uid
    }
    if (!uid) {
      throw new Error('User not ready in DataContext')
    }
    return uid
  }

  async function addExpense(category, amount) {
    const uid = getCurrentUid()

    const payload = {
      uid: uid,
      category,
      amount,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    await addDoc(collection(db, "variable_expenses"), payload)
    await fetchAll()
  }

  function computeBudgetPlan(income, savings) {
    const spendable = Math.max(0, Number(income || 0) - Number(savings || 0))
    return CATEGORIES.reduce((acc, category) => {
      const weight = CATEGORY_WEIGHTS[category] || 0
      acc[category] = Math.round(spendable * weight)
      return acc
    }, {})
  }

  async function saveIncomeSavings(income, savings) {
    setTotalIncome(income)
    setTotalSavings(savings)
    if (!user) return
    const savingsRate = income > 0 ? savings / income : 0
    await setDoc(doc(db, 'users', user.uid), {
      monthly_income: income,
      savings_rate: Math.round(savingsRate * 10000) / 10000,
    }, { merge: true })
  }

async function updateBudget() {
    const uid = getCurrentUid()
    if (!uid) return
    try {
      const token = await getAuth().currentUser.getIdToken()
      const res = await fetch(`${API_URL}/api/budget/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error('Optimize failed')
      const data = await res.json()
      const needs = data.needs || 0
      const wants = data.wants || 0
      const plan = {
        Rent: Math.round(needs * 0.65),
        Groceries: Math.round(needs * 0.35),
        Food: Math.round(wants * 0.60),
        Transportation: Math.round(wants * 0.40),
      }
      setBudgetPlan(plan)
      return plan
    } catch (error) {
      console.warn('Backend unavailable, using fallback')
      const plan = computeBudgetPlan(totalIncome, totalSavings)
      setBudgetPlan(plan)
      await fetchAll()
      return plan
    }
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
      saveIncomeSavings,
      updateBudget,
      computeBudgetPlan,
      refresh: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
