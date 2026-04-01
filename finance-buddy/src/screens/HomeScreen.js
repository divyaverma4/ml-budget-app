import { useState } from 'react'

import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { useData, CATEGORIES, getStatus } from '../context/DataContext'
import { logout } from '../services/authService'

const TABS = [
  { name: 'Home', initial: 'H' },
  { name: 'Expenses', initial: 'E' },
  { name: 'Budget', initial: 'B' },
  { name: 'Trends', initial: 'T' },
]

const SUMMARY_CATEGORIES = ['Food', 'Transportation', 'Rent', 'Groceries']

export default function HomeScreen() {
  const navigation = useNavigation()
  const { signOut } = useAuth()
  const { spending, budgetPlan, addExpense } = useData()
  const [activeTab, setActiveTab] = useState('Home')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [amount, setAmount] = useState('')

  async function handleLogout() {
    try {
      await logout()
      signOut()
    } catch (error) {
      Alert.alert('Logout Failed', error.message)
    }
  }

  async function handleAddExpense() {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category')
      return
    }
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    try {
      await addExpense(selectedCategory, num)
      setModalVisible(false)
      setSelectedCategory('')
      setAmount('')
    } catch (error) {
      console.error('Error adding expense:', error)
      Alert.alert('Error', 'Could not save expense. Please try again.')
    }
  }

  function closeModal() {
    setModalVisible(false)
    setSelectedCategory('')
    setAmount('')
  }

  // Generate insights: categories over 85% of budget
  const insights = SUMMARY_CATEGORIES
    .map(cat => {
      const spent = spending[cat] || 0
      const budget = budgetPlan[cat] || 0
      const { label, color } = getStatus(spent, budget)
      return { cat, spent, budget, label, color }
    })
    .filter(item => item.label !== 'On Track' && item.budget > 0)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3d4f3a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerNav}>↺</Text>
        </View>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>⊕ Logout</Text>
          </TouchableOpacity>
          <Text style={styles.headerGear}>⚙</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Add Expense Card */}
        <TouchableOpacity style={styles.card} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <View style={styles.addExpenseRow}>
            <View style={styles.addIcon}>
              <Text style={styles.addIconText}>+</Text>
            </View>
            <Text style={styles.addExpenseLabel}>Add expense</Text>
          </View>
        </TouchableOpacity>

        {/* This Week's Insight Card */}
        <View style={[styles.card, styles.cardAlt]}>
          <Text style={styles.cardTitle}>This Week's Insight:</Text>
          {insights.length === 0 ? (
            <Text style={styles.insightDefault}>
              {Object.keys(spending).length === 0
                ? 'No expenses recorded this week yet.'
                : 'You\'re on track with all categories this week!'}
            </Text>
          ) : (
            insights.map(({ cat, spent, budget, label, color }) => (
              <View key={cat} style={styles.insightRow}>
                <Text style={styles.insightCat}>{cat}</Text>
                <Text style={[styles.insightLabel, { color }]}>
                  ${spent.toFixed(0)} / ${budget} — {label}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Budget Summary Card */}
        <View style={[styles.card, styles.cardAlt]}>
          <Text style={styles.cardTitle}>Budget Summary:</Text>
          {SUMMARY_CATEGORIES.map(cat => {
            const spent = spending[cat] || 0
            const budget = budgetPlan[cat] || 0
            const { label, color } = getStatus(spent, budget)
            const progress = budget > 0 ? Math.min(spent / budget, 1) : 0
            return (
              <View key={cat} style={styles.summaryItem}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryCategory}>{cat}</Text>
                  <Text style={[styles.summaryStatus, { color }]}>{label}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.summaryAmounts}>${spent.toFixed(0)} of ${budget}</Text>
              </View>
            )
          })}
        </View>

      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ name, initial }) => (
          <TouchableOpacity
            key={name}
            style={styles.tab}
            onPress={() => {
              setActiveTab(name)
              if (name !== 'Home') navigation.navigate(name)
            }}
          >
            <View style={[styles.tabIconWrap, activeTab === name && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, activeTab === name && styles.tabIconActive]}>{initial}</Text>
            </View>
            <Text style={[styles.tabLabel, activeTab === name && styles.tabLabelActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Amount ($)</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddExpense}>
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
  safeArea: { flex: 1, backgroundColor: '#7d9478' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#3d4f3a', paddingHorizontal: 14, paddingVertical: 12,
  },
  headerLeft: { minWidth: 40 },
  headerNav: { color: '#fff', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 80, justifyContent: 'flex-end' },
  logoutBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  headerGear: { color: '#fff', fontSize: 18 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardAlt: { backgroundColor: '#FFF5E0' },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  addExpenseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 4 },
  addIcon: { width: 36, height: 36, borderRadius: 8, borderWidth: 2, borderColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  addIconText: { fontSize: 22, fontWeight: '300', color: '#1a1a1a', lineHeight: 26 },
  addExpenseLabel: { fontSize: 18, fontWeight: '500', color: '#1a1a1a' },
  insightDefault: { fontSize: 15, color: '#555' },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  insightCat: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  insightLabel: { fontSize: 14, fontWeight: '500' },
  summaryItem: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  summaryCategory: { fontSize: 16, color: '#1a1a1a' },
  summaryStatus: { fontSize: 15, fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  summaryAmounts: { fontSize: 12, color: '#888', marginTop: 2 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#e8e8e8',
    paddingVertical: 10, paddingBottom: 16, paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: '#3a6fdf' },
  tabIcon: { fontSize: 14, fontWeight: '700', color: '#333' },
  tabIconActive: { color: '#fff' },
  tabLabel: { fontSize: 11, color: '#555' },
  tabLabelActive: { color: '#3a6fdf', fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1.5, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipSelected: { backgroundColor: '#3d4f3a', borderColor: '#3d4f3a' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  amountInput: {
    borderWidth: 1.5, borderColor: '#d4d4d4', borderRadius: 10,
    padding: 14, fontSize: 18, color: '#1a1a1a', marginBottom: 24, backgroundColor: '#fafafa',
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 28, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, color: '#555', fontWeight: '500' },
  confirmBtn: { flex: 1, backgroundColor: '#3d4f3a', borderRadius: 28, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: 16, color: '#fff', fontWeight: '600' },
})
