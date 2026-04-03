import { View, Text, StyleSheet, ScrollView, StatusBar, Animated } from 'react-native'
import { useRef, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useData } from '../context/DataContext'

const CX = 90, CY = 90, R = 75, INNER_R = 46
const NEUTRAL_COLORS = ['#8B6914', '#5C7A4E', '#C4956A', '#7A9E7E']
const CATEGORIES_ORDER = ['Food', 'Transportation', 'Rent', 'Groceries']

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

function ExpensePieChart({ spending, total, cardBg }) {
  const size = CX * 2
  if (total <= 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={CX} cy={CY} r={R} fill="#d5d5d5" />
        <Circle cx={CX} cy={CY} r={INNER_R} fill={cardBg} />
      </Svg>
    )
  }
  let currentDeg = 0
  const slices = CATEGORIES_ORDER.map((cat, i) => {
    const amt = spending[cat] || 0
    const deg = (amt / total) * 360
    const startDeg = currentDeg
    currentDeg += deg
    return { cat, amt, deg, startDeg, color: NEUTRAL_COLORS[i] }
  }).filter(s => s.deg > 0)

  return (
    <Svg width={size} height={size}>
      {slices.map(s =>
        s.deg >= 360 ? (
          <Circle key={s.cat} cx={CX} cy={CY} r={R} fill={s.color} />
        ) : (
          <Path key={s.cat} d={slicePath(CX, CY, R, s.startDeg, s.startDeg + s.deg)} fill={s.color} />
        )
      )}
      <Circle cx={CX} cy={CY} r={INNER_R} fill={cardBg} />
    </Svg>
  )
}

export default function SpendingTrendsScreen() {
  const { totalIncome, totalSavings, spending } = useData()

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

  const totalExpenses = Object.values(spending).reduce((sum, v) => sum + v, 0)
  const balance = totalIncome - totalSavings - totalExpenses
  const cardBg = '#f5ebe0'

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3d4f3a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Spending Trends</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
      >

        {/* 2x2 Summary Grid */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#e8f0e8' }]}>
            <Text style={styles.summaryAmount}>${totalIncome.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Income</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF5E0' }]}>
            <Text style={styles.summaryAmount}>${totalSavings.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Savings</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#f5ebe0' }]}>
            <Text style={styles.summaryAmount}>${totalExpenses.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Expenses</Text>
          </View>
          <View style={[styles.summaryCard, balance < 0 ? { backgroundColor: '#fde8e8' } : { backgroundColor: '#e8ede8' }]}>
            <Text style={[styles.summaryAmount, balance < 0 && { color: '#c0392b' }]}>
              {balance < 0 ? `-$${Math.abs(balance).toLocaleString()}` : `$${balance.toLocaleString()}`}
            </Text>
            <Text style={styles.summaryLabel}>Balance</Text>
          </View>
        </View>

        {/* Total Expenses Breakdown Card */}
        <View style={[styles.card, { backgroundColor: '#f5ebe0' }]}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Total Expenses</Text>

          <View style={styles.chartContainer}>
            <ExpensePieChart spending={spending} total={totalExpenses} cardBg={cardBg} />
          </View>

          {/* Category table */}
          <View style={styles.table}>
            {CATEGORIES_ORDER.map((cat, i) => {
              const amt = spending[cat] || 0
              const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0
              return (
                <View key={cat} style={styles.tableRow}>
                  <View style={[styles.tableColorDot, { backgroundColor: NEUTRAL_COLORS[i] }]} />
                  <Text style={styles.tableCategory}>{cat}</Text>
                  <Text style={styles.tableAmount}>${amt.toFixed(0)}</Text>
                  <Text style={styles.tablePct}>{pct}%</Text>
                </View>
              )
            })}
          </View>

          <Text style={styles.footnote}>*percentages are approximate</Text>
        </View>

      </Animated.ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff', textAlign: 'center' },
  headerRight: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 100 },

  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  summaryCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    shadowColor: '#1a2e1a', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13, shadowRadius: 8, elevation: 5,
  },
  summaryAmount: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: '#777', fontWeight: '400' },

  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 22,
    shadowColor: '#1a2e1a', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13, shadowRadius: 8, elevation: 5,
  },
  cardAlt: { backgroundColor: '#FFF5E0' },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },

  chartContainer: { alignItems: 'center', marginVertical: 8 },

  table: { marginTop: 16, gap: 12 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  tableColorDot: { width: 10, height: 10, borderRadius: 5 },
  tableCategory: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  tableAmount: { fontSize: 15, color: '#444', marginRight: 8, minWidth: 40, textAlign: 'right' },
  tablePct: { fontSize: 15, color: '#666', minWidth: 36, textAlign: 'right' },

  footnote: { fontSize: 11, color: '#999', marginTop: 16, fontStyle: 'italic' },
})
