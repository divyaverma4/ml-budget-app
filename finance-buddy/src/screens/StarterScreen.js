import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export default function StarterScreen() {
  const navigation = useNavigation()

  return (
    <View style={styles.wrapper}>
      <View style={styles.center}>
        <LogoIcon />
        <Text style={styles.brand}>
          <Text style={styles.bold}>Finance</Text>Buddy
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnCreate} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.btnCreateText}>Create a new account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnLogin}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function LogoIcon() {
  return (
    <View style={logo.wrapper}>
      <View style={[logo.petal, { transform: [{ rotate: '0deg' }] }]} />
      <View style={[logo.petal, { transform: [{ rotate: '90deg' }] }]} />
      <View style={[logo.petal, { transform: [{ rotate: '180deg' }] }]} />
      <View style={[logo.petal, { transform: [{ rotate: '270deg' }] }]} />
      <View style={logo.center} />
    </View>
  )
}

const logo = StyleSheet.create({
  wrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  petal: {
    position: 'absolute',
    width: 18,
    height: 28,
    borderRadius: 12,
    backgroundColor: '#c2785a',
    opacity: 0.85,
  },
  center: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#a05a3e',
  },
})

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#7d9478',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: 34,
    color: '#fff',
    fontWeight: '400',
  },
  bold: {
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  btnCreate: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnCreateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  btnLogin: {
    color: '#fff',
    fontSize: 15,
  },
})
