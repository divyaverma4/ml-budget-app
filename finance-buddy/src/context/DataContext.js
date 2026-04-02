import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'

const db = getFirestore()
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
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [budgetPlan, setBudgetPlan] = useState(DEFAULT_BUDGETS)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      // Fetch weekly expenses
      const weekStart = getWeekStart()
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        where('date', '>=', Timestamp.fromDate(weekStart))
      )
      const snapshot = await getDocs(q)
      setExpenses(snapshot.docs.map(d => d.data()))

      // Fetch budget doc
      const budgetSnap = await getDoc(doc(db, 'budgets', user.uid))
      if (budgetSnap.exists()) {
        const data = budgetSnap.data()
        setTotalIncome(data.totalIncome || 0)
        setTotalSavings(data.totalSavings || 0)
        setBudgetPlan(data.budgetPlan || DEFAULT_BUDGETS)
      }
    } catch (error) {
      console.error('DataContext fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addExpense(category, amount) {
    if (!user) return
    const expenseData = {
      userId: user.uid,
      category,
      amount,
      date: Timestamp.now(),
    }
    setExpenses(prev => [...prev, expenseData])
    try {
      await addDoc(collection(db, 'expenses'), expenseData)
    } catch (error) {
      setExpenses(prev => prev.filter(e => e !== expenseData))
      throw error
    }
  }

  function computeBudgetPlan(income, savings) {
    const available = income - savings
    if (available <= 0) return DEFAULT_BUDGETS
    return {
      Food: Math.round(available * 0.30),
      Transportation: Math.round(available * 0.20),
      Rent: Math.round(available * 0.40),
      Groceries: Math.round(available * 0.10),
    }
  }

  async function saveIncomeSavings(income, savings) {
    setTotalIncome(income)
    setTotalSavings(savings)
    if (!user) return
    await setDoc(doc(db, 'budgets', user.uid), {
      totalIncome: income,
      totalSavings: savings,
      budgetPlan,
    })
  }

  async function updateBudget(income, savings) {
    const plan = computeBudgetPlan(income, savings)
    setTotalIncome(income)
    setTotalSavings(savings)
    setBudgetPlan(plan)
    if (!user) return
    await setDoc(doc(db, 'budgets', user.uid), {
      totalIncome: income,
      totalSavings: savings,
      budgetPlan: plan,
    })
    return plan
  }

  // Weekly spending per category
  const spending = {}
  expenses.forEach(exp => {
    spending[exp.category] = (spending[exp.category] || 0) + exp.amount
  })

  return (
    <DataContext.Provider value={{
      expenses, spending, totalIncome, totalSavings, budgetPlan,
      loading, addExpense, saveIncomeSavings, updateBudget, computeBudgetPlan, refresh: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
