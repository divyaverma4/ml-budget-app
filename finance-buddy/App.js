import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { DataProvider } from './src/context/DataContext'
import { View, TouchableOpacity, Text, Animated, ActivityIndicator, StyleSheet } from 'react-native'
import StarterScreen from './src/screens/StarterScreen'
import LoginScreen from './src/screens/LoginScreen'
import SignupScreen from './src/screens/SignupScreen'
import HomeScreen from './src/screens/HomeScreen'
import BudgetScreen from './src/screens/BudgetScreen'
import SpendingTrendsScreen from './src/screens/SpendingTrendsScreen'


const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabButton({ route, isFocused, options, navigation }) {
  const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name
  const scaleAnim = new Animated.Value(1)

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.91,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start()
  }

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start()
  }

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name)
    }
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={{
          backgroundColor: isFocused ? '#fff' : '#d6ebd1',
          borderRadius: 25,
          paddingVertical: 10,
          paddingHorizontal: 20,
          minWidth: 80,
          alignItems: 'center',
          shadowColor: '#1a2e1a',
          shadowOffset: { width: 0, height: isFocused ? 4 : 2 },
          shadowOpacity: isFocused ? 0.18 : 0.1,
          shadowRadius: isFocused ? 6 : 3,
          elevation: isFocused ? 6 : 3,
        }}
      >
        <Text style={{
          color: isFocused ? '#3d4f3a' : '#5a7a55',
          fontWeight: isFocused ? '700' : '500',
          fontSize: 14,
        }}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#7d9478',
      paddingVertical: 10,
      paddingHorizontal: 20,
      paddingBottom: 14,
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTopWidth: 0,
      shadowColor: '#1a2e1a',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 8,
    }}>
      {state.routes.map((route, index) => (
        <TabButton
          key={route.key}
          route={route}
          isFocused={state.index === index}
          options={descriptors[route.key].options}
          navigation={navigation}
        />
      ))}
    </View>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Budget',
        }}
      />
      <Tab.Screen
        name="SpendingTrends"
        component={SpendingTrendsScreen}
        options={{
          tabBarLabel: 'Trends',
        }}
      />
    </Tab.Navigator>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3d4f3a" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <NavigationContainer>
      {user ? (
        <TabNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Starter" component={StarterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: '#7d9478', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  )
}