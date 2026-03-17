import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider } from './src/context/AuthContext'
import StarterScreen from './src/screens/StarterScreen'
import LoginScreen from './src/screens/LoginScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Starter" component={StarterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  )
}
