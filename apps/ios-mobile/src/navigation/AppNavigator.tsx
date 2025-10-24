import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ChatHistoryScreen from '../screens/ChatHistory/ChatHistoryScreen';
import GuardrailsScreen from '../screens/Guardrails/GuardrailsScreen';
import DeviceScreen from '../screens/Device/DeviceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="History"
        component={ChatHistoryScreen}
        options={{ title: 'Chat History' }}
      />
      <Tab.Screen
        name="Guardrails"
        component={GuardrailsScreen}
        options={{ title: 'Safety' }}
      />
      <Tab.Screen
        name="Device"
        component={DeviceScreen}
        options={{ title: 'Device' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
