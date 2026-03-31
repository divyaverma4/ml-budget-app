import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker'
const HomeScreen = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!expenseType || !amount) {
      Alert.alert('Error', 'Please select expense type and enter amount');
      return;
    }
    Alert.alert('Success', `Added ${expenseType} expense of $${amount}`);
    setExpenseType('');
    setAmount('');
    setModalVisible(false);
  };

  const handleLogout = () => {
    signOut();
    navigation.navigate('Starter');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Expense</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expense Type:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={expenseType}
                  onValueChange={(itemValue) => setExpenseType(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select expense type" value="" />
                  <Picker.Item label="Food" value="Food" />
                  <Picker.Item label="Transport" value="Transport" />
                  <Picker.Item label="Entertainment" value="Entertainment" />
                  <Picker.Item label="Utilities" value="Utilities" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount ($):</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.card}>
        <Text>This week's insight</Text>
      </View>

      <View style={styles.card}>
        <Text>Budget Summary</Text>
        <View style={styles.categoryRow}>
          <Text>Food</Text>
          <Text>On Budget</Text>
        </View>
        <View style={styles.categoryRow}>
          <Text>Transport</Text>
          <Text>Overspent</Text>
        </View>
        <View style={styles.categoryRow}>
          <Text>Entertainment</Text>
          <Text>On Budget</Text>
        </View>
        <View style={styles.categoryRow}>
          <Text>Utilities</Text>
          <Text>Overspent</Text>
        </View>
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
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#7d9478',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#d6ebd1',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,    marginTop: 70,    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fffad4',
    padding: 25,
    borderRadius: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5f2d',
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 50,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    width: '100%',
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#518253',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fffad4',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
});

export default HomeScreen;