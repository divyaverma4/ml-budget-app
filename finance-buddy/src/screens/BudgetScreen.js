<<<<<<< HEAD
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const BudgetScreen = () => {
  const handleOptimizeBudget = () => {
    console.log('Optimize budget pressed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budget Management</Text>

      <TouchableOpacity style={styles.optimizeButton} onPress={handleOptimizeBudget}>
        <Text style={styles.optimizeButtonText}>Optimize My Budget</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Budget Plan</Text>
        <View style={styles.categoryRow}>
          <Text>Food</Text>
          <Text>$200</Text>
        </View>
        <View style={styles.categoryRow}>
          <Text>Transport</Text>
          <Text>$100</Text>
        </View>
        <View style={styles.categoryRow}>
          <Text>Entertainment</Text>
          <Text>$50</Text>
        </View>
        <View style={styles.categoryRow}>
          <Text>Utilities</Text>
          <Text>$200</Text>
        </View>
        <View style={styles.categoryRow}>
          <Text>Rent</Text>
          <Text>$1000</Text>
        </View>
        <View style={[styles.categoryRow, styles.totalRow]}>
          <Text style={styles.totalText}>Total Budget</Text>
          <Text style={styles.totalText}>$1,550</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Budget Overview</Text>
        <Text style={styles.cardText}>Manual Budget adjustment?</Text>
      </View>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#7d9478',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  optimizeButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  optimizeButtonText: {
    color: '#7d9478',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fffad4',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5f2d',
    marginBottom: 15,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 10,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2c5f2d',
  },

cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5f2d',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default BudgetScreen;
=======
import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useData, CATEGORIES, getStatus } from '../context/DataContext'

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

const TABS = [
  { name: 'Home', initial: 'H' },
  { name: 'Expenses', initial: 'E' },
  { name: 'Budget', initial: 'B' },
  { name: 'Trends', initial: 'T' },
]

const BUDGET_CATEGORIES = ['Food', 'Transportation', 'Rent', 'Groceries']

export default function BudgetScreen() {
  const navigation = useNavigation()
  const { spending, totalIncome, totalSavings, budgetPlan, updateBudget, computeBudgetPlan } = useData()
  const [activeTab, setActiveTab] = useState('Budget')
  const [incomeModal, setIncomeModal] = useState(false)
  const [savingsModal, setSavingsModal] = useState(false)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [savingsAmount, setSavingsAmount] = useState('')

  async function handleAddIncome() {
    const num = parseFloat(incomeAmount)
    if (!incomeAmount || isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    try {
      await updateBudget(totalIncome + num, totalSavings)
      setIncomeAmount('')
      setIncomeModal(false)
    } catch (error) {
      Alert.alert('Error', 'Could not save. Please try again.')
    }
  }

  async function handleAddSavings() {
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
      await updateBudget(totalIncome, totalSavings + num)
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

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
            <Text style={styles.cardTitle}>Income Overview</Text>
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

        {/* Budget Plan with spend progress */}
        <View style={[styles.card, styles.cardAlt]}>
          <Text style={styles.cardTitle}>Budget Plan:</Text>
          {BUDGET_CATEGORIES.map(cat => {
            const budget = budgetPlan[cat] || 0
            const spent = spending[cat] || 0
            const { label, color } = getStatus(spent, budget)
            const progress = budget > 0 ? Math.min(spent / budget, 1) : 0
            return (
              <View key={cat} style={styles.budgetItem}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryCategory}>{cat}</Text>
                  <Text style={styles.summaryAmount}>${budget}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.spentLabel}>
                  Spent: ${spent.toFixed(0)}
                  {budget > 0 ? <Text style={{ color }}> — {label}</Text> : null}
                </Text>
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
    backgroundColor: '#3d4f3a', paddingHorizontal: 14, paddingVertical: 12,
  },
  headerLeft: { minWidth: 40 },
  headerNav: { color: '#fff', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
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
  budgetItem: { marginBottom: 14 },
  progressTrack: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  spentLabel: { fontSize: 12, color: '#888' },
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
>>>>>>> 4eedda9070128e835e3636d79701b2b498d2f11e
