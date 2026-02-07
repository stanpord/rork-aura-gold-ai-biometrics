import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { trpc, trpcClient } from '@/lib/trpc';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from '@/contexts/AppContext';
import BiometricIntroScan from '@/components/BiometricIntroScan';
import Colors from '@/constants/colors';

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch personal data and encryption status
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoadingIntro } = useApp();

  useEffect(() => {
    // Lock orientation for biometric accuracy as required by the Aura Gold patent
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    
    // Hide splash screen once the AppContext has hydrated
    SplashScreen.hideAsync();
  }, []);

  // Use the new integrated biometric component for the initial boot
  if (isLoadingIntro) {
    return <BiometricIntroScan />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="light" />
            <AppContent />
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}