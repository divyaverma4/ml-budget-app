import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { DataProvider } from './src/context/DataContext'
import { View, TouchableOpacity, Text } from 'react-native'
import StarterScreen from './src/screens/StarterScreen'
import LoginScreen from './src/screens/LoginScreen'
import SignupScreen from './src/screens/SignupScreen'
import HomeScreen from './src/screens/HomeScreen'
import BudgetScreen from './src/screens/BudgetScreen'
import SpendingTrendsScreen from './src/screens/SpendingTrendsScreen'


const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#7d9478',
      paddingVertical: 10,
      paddingHorizontal: 20,
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              backgroundColor: isFocused ? '#fff' : '#d6ebd1',
              borderRadius: 25,
              paddingVertical: 10,
              paddingHorizontal: 20,
              minWidth: 80,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Text style={{
              color: isFocused ? '#7d9478' : '#666',
              fontWeight: 'bold',
              fontSize: 14,
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
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
    return null 
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

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  )
}