import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from './src/services/Database';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Contexts
import { AnioServicioProvider } from './src/contexts/AnioServicioContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import PublicadoresScreen from './src/screens/PublicadoresScreen';
import AsistenciasScreen from './src/screens/AsistenciasScreen';
import InformesScreen from './src/screens/InformesScreen';
import InformesFaltantesScreen from './src/screens/InformesFaltantesScreen';
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
          <Stack.Screen name="InformesFaltantes" component={InformesFaltantesScreen} />
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
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        console.log('SQLite Initialized');
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </ThemeProvider>
  );
}
