import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Contexts
import { UserProvider, useUser } from './src/contexts/UserContext';
import { AnioServicioProvider } from './src/contexts/AnioServicioContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PublicadoresScreen from './src/screens/PublicadoresScreen';
import AsistenciasScreen from './src/screens/AsistenciasScreen';
import InformesScreen from './src/screens/InformesScreen';
import SecretarioScreen from './src/screens/SecretarioScreen';
import ConfiguracionScreen from './src/screens/ConfiguracionScreen';
import PrecursoresAuxiliaresScreen from './src/screens/PrecursoresAuxiliaresScreen';
import ReportesScreen from './src/screens/ReportesScreen';
import PDFViewerScreen from './src/screens/PDFViewerScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userProfile, loading } = useUser();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <AnioServicioProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userProfile ? (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Publicadores" component={PublicadoresScreen} />
              <Stack.Screen name="Asistencias" component={AsistenciasScreen} />
              <Stack.Screen name="Informes" component={InformesScreen} />
              <Stack.Screen name="PrecursoresAuxiliares" component={PrecursoresAuxiliaresScreen} />
              <Stack.Screen name="Reportes" component={ReportesScreen} />
              <Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
              <Stack.Screen name="Secretario" component={SecretarioScreen} />
              <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </AnioServicioProvider>
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
