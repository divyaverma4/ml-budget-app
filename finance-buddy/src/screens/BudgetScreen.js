import { useState, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useAuth } from '../context/AuthContext'
import { useData, getStatus } from '../context/DataContext'

const CX = 80, CY = 80, R = 64, INNER_R = 40

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx, cy, r, startDeg, endDeg) {
  const s = polarToXY(cx, cy, r, startDeg)
  const e = polarToXY(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

function DonutChart({ available, savings, total, cardBg }) {
  const size = CX * 2
  if (total <= 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={CX} cy={CY} r={R} fill="#eee" />
        <Circle cx={CX} cy={CY} r={INNER_R} fill={cardBg} />
      </Svg>
    )
  }
  const availDeg = (available / total) * 360
  const savDeg = (savings / total) * 360

  return (
    <Svg width={size} height={size}>
      {savDeg >= 360 ? (
        <Circle cx={CX} cy={CY} r={R} fill="#a5c49e" />
      ) : availDeg >= 360 ? (
        <Circle cx={CX} cy={CY} r={R} fill="#3d4f3a" />
      ) : (
        <>
          <Path d={slicePath(CX, CY, R, 0, availDeg)} fill="#3d4f3a" />
          <Path d={slicePath(CX, CY, R, availDeg, availDeg + savDeg)} fill="#a5c49e" />
        </>
      )}
      <Circle cx={CX} cy={CY} r={INNER_R} fill={cardBg} />
    </Svg>
  )
}

const BUDGET_CATEGORIES = ['Food', 'Transportation', 'Rent', 'Groceries']

export default function BudgetScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { spending, totalIncome, totalSavings, budgetPlan, saveIncomeSavings, updateBudget } = useData()
  const [incomeModal, setIncomeModal] = useState(false)
  const [savingsModal, setSavingsModal] = useState(false)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [savingsAmount, setSavingsAmount] = useState('')

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current

  useFocusEffect(useCallback(() => {
    fadeAnim.setValue(0)
    slideAnim.setValue(24)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start()
  }, []))

  async function handleAddIncome() {
    if (!user?.uid) {
      Alert.alert('Please wait', 'Your account is still loading. Try again in a moment.')
      return
    }

    const num = parseFloat(incomeAmount)
    if (!incomeAmount || isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    try {
      await saveIncomeSavings(totalIncome + num, totalSavings)
      setIncomeAmount('')
      setIncomeModal(false)
    } catch (error) {
      Alert.alert('Error', 'Could not save. Please try again.')
    }
  }

  async function handleAddSavings() {
    if (!user?.uid) {
      Alert.alert('Please wait', 'Your account is still loading. Try again in a moment.')
      return
    }

    const num = parseFloat(savingsAmount)
    if (!savingsAmount || isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    if (totalSavings + num > totalIncome) {
      Alert.alert('Error', 'Savings cannot exceed total income')
      return
    }
    try {
      await saveIncomeSavings(totalIncome, totalSavings + num)
      setSavingsAmount('')
      setSavingsModal(false)
    } catch (error) {
      Alert.alert('Error', 'Could not save. Please try again.')
    }
  }

  async function handleOptimize() {
    try {
      await updateBudget(totalIncome, totalSavings)
      Alert.alert('Budget Optimized', 'Your budget plan has been recalculated.')
    } catch (error) {
      Alert.alert('Error', 'Could not optimize. Please try again.')
    }
  }

  const available = totalIncome - totalSavings
  const savingsPct = totalIncome > 0 ? totalSavings / totalIncome : 0
  const availablePct = totalIncome > 0 ? available / totalIncome : 0

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

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Add Income */}
        <TouchableOpacity style={styles.card} onPress={() => setIncomeModal(true)} activeOpacity={0.85}>
          <View style={styles.addRow}>
            <View style={styles.addIcon}><Text style={styles.addIconText}>+</Text></View>
            <Text style={styles.addLabel}>Add Income</Text>
          </View>
        </TouchableOpacity>

        {/* Add Savings */}
        <TouchableOpacity style={styles.card} onPress={() => setSavingsModal(true)} activeOpacity={0.85}>
          <View style={styles.addRow}>
            <View style={styles.addIcon}><Text style={styles.addIconText}>+</Text></View>
            <Text style={styles.addLabel}>Add Savings</Text>
          </View>
        </TouchableOpacity>

        {/* Income / Savings summary */}
        {totalIncome > 0 && (
          <View style={[styles.card, styles.cardAlt]}>
            <Text style={styles.cardTitle}>Income Overview:</Text>
            <View style={styles.chartRow}>
              <DonutChart
                available={available}
                savings={totalSavings}
                total={totalIncome}
                cardBg="#FFF5E0"
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3d4f3a' }]} />
                  <View>
                    <Text style={styles.legendLabel}>Available</Text>
                    <Text style={styles.legendValue}>${available.toFixed(0)}</Text>
                    <Text style={styles.legendPct}>{(availablePct * 100).toFixed(0)}%</Text>
                  </View>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#a5c49e' }]} />
                  <View>
                    <Text style={styles.legendLabel}>Savings</Text>
                    <Text style={styles.legendValue}>${totalSavings.toFixed(0)}</Text>
                    <Text style={styles.legendPct}>{(savingsPct * 100).toFixed(0)}%</Text>
                  </View>
                </View>
                <View style={[styles.legendItem, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#e0d5c5', paddingTop: 8 }]}>
                  <View style={[styles.legendDot, { backgroundColor: 'transparent' }]} />
                  <View>
                    <Text style={styles.legendLabel}>Total Income</Text>
                    <Text style={[styles.legendValue, { color: '#3d4f3a' }]}>${totalIncome.toFixed(0)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Optimize button */}
        <TouchableOpacity style={styles.optimizeBtn} onPress={handleOptimize} activeOpacity={0.85}>
          <Text style={styles.optimizeBtnText}>Optimize my budget</Text>
        </TouchableOpacity>

        {/* Proposed Budget Plan */}
        <View style={[styles.card, styles.cardAlt]}>
          <Text style={styles.cardTitle}>Proposed Budget Plan:</Text>
          <Text style={styles.planSubtitle}>Suggested weekly allocation based on your income</Text>
          {BUDGET_CATEGORIES.map((cat, i) => {
            const budget = budgetPlan[cat] || 0
            const pct = available > 0 ? Math.round((budget / available) * 100) : 0
            const ACCENT_COLORS = ['#8B6914', '#5C7A4E', '#C4956A', '#7A9E7E']
            const accent = ACCENT_COLORS[i]
            return (
              <View key={cat} style={styles.proposedItem}>
                <View style={[styles.proposedAccent, { backgroundColor: accent }]} />
                <Text style={styles.proposedCategory}>{cat}</Text>
                <View style={styles.proposedRight}>
                  <Text style={styles.proposedAmount}>${budget}</Text>
                  <View style={[styles.proposedPill, { backgroundColor: accent + '28' }]}>
                    <Text style={[styles.proposedPct, { color: accent }]}>{pct}%</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>

      </Animated.ScrollView>

      {/* Add Income Modal */}
      <Modal visible={incomeModal} transparent animationType="slide" onRequestClose={() => setIncomeModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => { setIncomeModal(false); setIncomeAmount('') }} />
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
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => { setSavingsModal(false); setSavingsAmount('') }} />
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
  safeArea: { flex: 1, backgroundColor: '#7d9478' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#3d4f3a', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flex: 1 },
  headerNav: { color: '#fff', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff', textAlign: 'center' },
  headerRight: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 22,
    shadowColor: '#1a2e1a', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13, shadowRadius: 8, elevation: 5,
  },
  cardAlt: { backgroundColor: '#FFF5E0' },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 4 },
  addIcon: { width: 36, height: 36, borderRadius: 8, borderWidth: 2, borderColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  addIconText: { fontSize: 22, fontWeight: '300', color: '#1a1a1a', lineHeight: 26 },
  addLabel: { fontSize: 18, fontWeight: '500', color: '#1a1a1a' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryCategory: { fontSize: 16, color: '#1a1a1a' },
  summaryAmount: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chartLegend: { flex: 1, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  legendLabel: { fontSize: 13, color: '#555' },
  legendValue: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  legendPct: { fontSize: 12, color: '#888' },
  optimizeBtn: {
    backgroundColor: '#fff', borderRadius: 28, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  optimizeBtnText: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  planSubtitle: { fontSize: 13, color: '#888', marginBottom: 16, marginTop: -6 },
  proposedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e8ddd0',
  },
  proposedAccent: { width: 4, height: 36, borderRadius: 2 },
  proposedCategory: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  proposedRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proposedAmount: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  proposedPill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  proposedPct: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 4 },
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
