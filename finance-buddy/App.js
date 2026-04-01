import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider } from './src/context/AuthContext'
import { DataProvider } from './src/context/DataContext'
import StarterScreen from './src/screens/StarterScreen'
import LoginScreen from './src/screens/LoginScreen'
import SignupScreen from './src/screens/SignupScreen'
import HomeScreen from './src/screens/HomeScreen'
import BudgetScreen from './src/screens/BudgetScreen'

const Stack = createNativeStackNavigator()

function AppScreens() {
  return (
    <DataProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Starter" component={StarterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Budget" component={BudgetScreen} />
      </Stack.Navigator>
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppScreens />
      </NavigationContainer>
    </AuthProvider>
  )
}