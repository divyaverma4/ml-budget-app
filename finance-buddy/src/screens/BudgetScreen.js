import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore'

const db = getFirestore()

const BUDGET_CATEGORIES = ['Food', 'Transportation', 'Rent', 'Groceries']

const DEFAULT_BUDGET = {
  Food: 0,
  Transportation: 0,
  Rent: 0,
  Groceries: 0,
}

export default function BudgetScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Budget')
  const [incomeModal, setIncomeModal] = useState(false)
  const [savingsModal, setSavingsModal] = useState(false)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [savingsAmount, setSavingsAmount] = useState('')
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [budgetPlan, setBudgetPlan] = useState(DEFAULT_BUDGET)

  const fetchBudgetData = useCallback(async () => {
    if (!user) return
    try {
      const docRef = doc(db, 'budgets', user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setTotalIncome(data.totalIncome || 0)
        setTotalSavings(data.totalSavings || 0)
        setBudgetPlan(data.budgetPlan || DEFAULT_BUDGET)
      }
    } catch (error) {
      console.error('Error fetching budget data:', error)
    }
  }, [user])

  useEffect(() => {
    fetchBudgetData()
  }, [fetchBudgetData])

  function computeBudgetPlan(income, savings) {
    const available = income - savings
    if (available <= 0) return DEFAULT_BUDGET
    return {
      Food: Math.round(available * 0.30),
      Transportation: Math.round(available * 0.20),
      Rent: Math.round(available * 0.40),
      Groceries: Math.round(available * 0.10),
    }
  }

  async function saveBudgetDoc(income, savings, plan) {
    if (!user) return
    try {
      await setDoc(doc(db, 'budgets', user.uid), {
        totalIncome: income,
        totalSavings: savings,
        budgetPlan: plan,
      })
    } catch (error) {
      console.error('Error saving budget:', error)
    }
  }

  async function handleAddIncome() {
    const num = parseFloat(incomeAmount)
    if (!incomeAmount || isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    const newIncome = totalIncome + num
    const plan = computeBudgetPlan(newIncome, totalSavings)
    setTotalIncome(newIncome)
    setBudgetPlan(plan)
    await saveBudgetDoc(newIncome, totalSavings, plan)
    setIncomeAmount('')
    setIncomeModal(false)
  }

  async function handleAddSavings() {
    const num = parseFloat(savingsAmount)
    if (!savingsAmount || isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    if (num > totalIncome) {
      Alert.alert('Error', 'Savings cannot exceed total income')
      return
    }
    const newSavings = totalSavings + num
    const plan = computeBudgetPlan(totalIncome, newSavings)
    setTotalSavings(newSavings)
    setBudgetPlan(plan)
    await saveBudgetDoc(totalIncome, newSavings, plan)
    setSavingsAmount('')
    setSavingsModal(false)
  }

  const tabs = [
    { name: 'Home', initial: 'H' },
    { name: 'Expenses', initial: 'E' },
    { name: 'Budget', initial: 'B' },
    { name: 'Trends', initial: 'T' },
  ]

  const available = totalIncome - totalSavings
  const piePercent = totalIncome > 0 ? available / totalIncome : 0

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3d4f3a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerNav}>↺</Text>
        </View>
        <Text style={styles.headerTitle}>Budget</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Add Income */}
        <TouchableOpacity style={styles.card} onPress={() => setIncomeModal(true)} activeOpacity={0.85}>
          <View style={styles.btnRow}>
            <View style={styles.addIcon}>
              <Text style={styles.addIconText}>+</Text>
            </View>
            <Text style={styles.btnLabel}>Add Income</Text>
          </View>
        </TouchableOpacity>

        {/* Add Savings */}
        <TouchableOpacity style={styles.card} onPress={() => setSavingsModal(true)} activeOpacity={0.85}>
          <View style={styles.btnRow}>
            <View style={styles.addIcon}>
              <Text style={styles.addIconText}>+</Text>
            </View>
            <Text style={styles.btnLabel}>Add Savings</Text>
          </View>
        </TouchableOpacity>

        {/* Pie Chart placeholder */}
        <View style={styles.card}>
          <View style={styles.pieContainer}>
            <View style={styles.pieOuter}>
              <View style={[styles.pieFill, {
                borderTopColor: piePercent > 0.25 ? '#3d4f3a' : 'transparent',
                borderRightColor: piePercent > 0.5 ? '#3d4f3a' : 'transparent',
                borderBottomColor: piePercent > 0.75 ? '#3d4f3a' : 'transparent',
                borderLeftColor: piePercent > 0 ? '#3d4f3a' : 'transparent',
              }]} />
            </View>
          </View>
          <View style={styles.pieLegend}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Available: ${available.toFixed(0)}</Text>
            <View style={[styles.legendDot, { backgroundColor: '#d0d0d0', marginLeft: 16 }]} />
            <Text style={styles.legendText}>Savings: ${totalSavings.toFixed(0)}</Text>
          </View>
        </View>

        {/* Optimize button */}
        <TouchableOpacity style={styles.optimizeBtn} activeOpacity={0.85}
          onPress={() => {
            const plan = computeBudgetPlan(totalIncome, totalSavings)
            setBudgetPlan(plan)
            saveBudgetDoc(totalIncome, totalSavings, plan)
            Alert.alert('Budget Optimized', 'Your budget plan has been recalculated.')
          }}>
          <Text style={styles.optimizeBtnText}>Optimize my budget</Text>
        </TouchableOpacity>

        {/* Budget Plan Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget Plan:</Text>
          {BUDGET_CATEGORIES.map(cat => (
            <View key={cat} style={styles.summaryRow}>
              <Text style={styles.summaryCategory}>{cat}</Text>
              <Text style={styles.summaryAmount}>${budgetPlan[cat] || 0}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(({ name, initial }) => (
          <TouchableOpacity
            key={name}
            style={styles.tab}
            onPress={() => {
              setActiveTab(name)
              if (name !== 'Budget') navigation.navigate(name)
            }}
          >
            <View style={[styles.tabIconWrap, activeTab === name && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, activeTab === name && styles.tabIconActive]}>{initial}</Text>
            </View>
            <Text style={[styles.tabLabel, activeTab === name && styles.tabLabelActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Income Modal */}
      <Modal visible={incomeModal} transparent animationType="slide" onRequestClose={() => setIncomeModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIncomeModal(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Income</Text>
            <Text style={styles.modalLabel}>Amount ($)</Text>
            <TextInput
              style={styles.amountInput}
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIncomeModal(false); setIncomeAmount('') }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddIncome}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Savings Modal */}
      <Modal visible={savingsModal} transparent animationType="slide" onRequestClose={() => setSavingsModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSavingsModal(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Savings</Text>
            <Text style={styles.modalLabel}>Amount ($)</Text>
            <TextInput
              style={styles.amountInput}
              value={savingsAmount}
              onChangeText={setSavingsAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSavingsModal(false); setSavingsAmount('') }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddSavings}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7d9478',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3d4f3a',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    minWidth: 40,
  },
  headerNav: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#1a1a1a',
    lineHeight: 26,
  },
  btnLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  pieContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  pieOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: '#d0d0d0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieFill: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 20,
    borderTopColor: '#3d4f3a',
    borderRightColor: '#3d4f3a',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  pieLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3d4f3a',
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
  },
  optimizeBtn: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  optimizeBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryCategory: {
    fontSize: 17,
    color: '#1a1a1a',
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    paddingVertical: 10,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: '#3a6fdf',
  },
  tabIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  tabIconActive: {
    color: '#fff',
  },
  tabLabel: {
    fontSize: 11,
    color: '#555',
  },
  tabLabelActive: {
    color: '#3a6fdf',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  amountInput: {
    borderWidth: 1.5,
    borderColor: '#d4d4d4',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 24,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#3d4f3a',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
})
