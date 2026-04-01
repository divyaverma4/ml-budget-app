import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/authService'

export default function LoginScreen() {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn } = useAuth()

  async function handleLogin() {
    try {
      const user = await login(email, password)
      signIn(user)
      console.log("Login successful")
    } catch (error) {
      Alert.alert('Login Failed', error.message)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Log-in</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <Text style={styles.forgot}>Forgot Password ?</Text>

      <TouchableOpacity style={styles.btnLogin} onPress={handleLogin}>
        <Text style={styles.btnLoginText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.noAccount}>Don't have an account?</Text>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Sign Up</Text>
      </TouchableOpacity>

      {/* <View style={styles.socialRow}>
         {/* Facebook */}
        {/* <TouchableOpacity style={styles.socialBtn}>
          <Text style={[styles.socialIcon, { color: '#1877f2' }]}>f</Text>
        </TouchableOpacity>

        {/* Google */}
        {/* <TouchableOpacity style={styles.socialBtn}>
          <Text style={[styles.socialIcon, { color: '#EA4335' }]}>G</Text>
        </TouchableOpacity> */}

        {/* Apple */}
        {/* <TouchableOpacity style={styles.socialBtn}>
          <Text style={[styles.socialIcon, { color: '#000' }]}></Text>
        </TouchableOpacity>
      </View> */} 
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
  },
  forgot: {
    fontSize: 12,
    color: '#333',
    marginTop: -8,
    marginBottom: 28,
  },
  btnLogin: {
    backgroundColor: '#3d4f3a',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  noAccount: {
    textAlign: 'center',
    fontSize: 13,
    color: '#333',
    marginTop: 20,
    marginBottom: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    textAlign: 'center',
    color: '#007bff',
    marginTop: 10,
  },
})