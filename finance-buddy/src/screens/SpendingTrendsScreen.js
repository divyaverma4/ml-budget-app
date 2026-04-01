import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SpendingTrendsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spending Trends</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Spending</Text>
        <Text style={styles.cardText}>graphs and spending data</Text>
      </View>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#7d9478',
    paddingBottom: 80, 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
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
    elevation: 3,
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

export default SpendingTrendsScreen;