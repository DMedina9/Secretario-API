import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/services/Database';

// Contexts
import { AnioServicioProvider } from './src/contexts/AnioServicioContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import PublicadoresScreen from './src/screens/PublicadoresScreen';
import AsistenciasScreen from './src/screens/AsistenciasScreen';
import InformesScreen from './src/screens/InformesScreen';
import SecretarioScreen from './src/screens/SecretarioScreen';
import ConfiguracionScreen from './src/screens/ConfiguracionScreen';
import PrecursoresAuxiliaresScreen from './src/screens/PrecursoresAuxiliaresScreen';
import PrecursoresRegularesScreen from './src/screens/PrecursoresRegularesScreen';
import IrregularesScreen from './src/screens/IrregularesScreen';
import ReportesScreen from './src/screens/ReportesScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { navigationTheme } = useTheme();

  return (
    <NavigationContainer theme={navigationTheme}>
      <AnioServicioProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Publicadores" component={PublicadoresScreen} />
          <Stack.Screen name="Asistencias" component={AsistenciasScreen} />
          <Stack.Screen name="Informes" component={InformesScreen} />
          <Stack.Screen name="PrecursoresAuxiliares" component={PrecursoresAuxiliaresScreen} />
          <Stack.Screen name="PrecursoresRegulares" component={PrecursoresRegularesScreen} />
          <Stack.Screen name="Irregulares" component={IrregularesScreen} />
          <Stack.Screen name="Reportes" component={ReportesScreen} />
          <Stack.Screen name="Secretario" component={SecretarioScreen} />
          <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
        </Stack.Navigator>
      </AnioServicioProvider>
    </NavigationContainer>
  );
};

export default function App() {
  React.useEffect(() => {
    initDatabase().then(() => console.log('SQLite Initialized'));
  }, []);

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </ThemeProvider>
  );
}
