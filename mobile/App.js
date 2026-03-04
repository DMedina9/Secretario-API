import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Contexts
import { UserProvider, useUser } from './src/contexts/UserContext';

// Screens
import RegistrationScreen from './src/screens/RegistrationScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PublicadoresScreen from './src/screens/PublicadoresScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userProfile, loading } = useUser();

  if (loading) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userProfile ? (
          // Main App Flow
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Publicadores" component={PublicadoresScreen} />
          </>
        ) : (
          // Registration Flow
          <Stack.Screen name="Registration" component={RegistrationScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <UserProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </UserProvider>
  );
}
