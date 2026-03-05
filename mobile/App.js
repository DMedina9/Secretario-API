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
import AsistenciasScreen from './src/screens/AsistenciasScreen';
import InformesScreen from './src/screens/InformesScreen';
import SecretarioScreen from './src/screens/SecretarioScreen';
import ConfiguracionScreen from './src/screens/ConfiguracionScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userProfile, loading } = useUser();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userProfile ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Publicadores" component={PublicadoresScreen} />
            <Stack.Screen name="Asistencias" component={AsistenciasScreen} />
            <Stack.Screen name="Informes" component={InformesScreen} />
            <Stack.Screen name="Secretario" component={SecretarioScreen} />
            <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
          </>
        ) : (
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
