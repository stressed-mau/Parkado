import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/** Evitar error "Unable to activate keep awake" en Web: activar solo en nativo y capturar fallos en dev */}
      <KeepAwakeGuard />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function KeepAwakeGuard() {
  useEffect(() => {
    if (!__DEV__) return;
    if (Platform.OS === 'web') return; // No activar en Web para evitar errores del Wake Lock
    // Cargar perezosamente y capturar cualquier error para que no rompa la app
    (async () => {
      try {
        const mod = await import('expo-keep-awake');
        // Comprobar disponibilidad antes de activar
        if (typeof mod.isAvailableAsync === 'function') {
          const ok = await mod.isAvailableAsync();
          if (!ok) return;
        }
        if (typeof mod.activateKeepAwakeAsync === 'function') {
          await mod.activateKeepAwakeAsync();
        }
      } catch {
        // Silenciar: en algunos entornos puede fallar activar el wake lock
      }
    })();
  }, []);
  return null;
}
