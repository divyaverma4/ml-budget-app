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