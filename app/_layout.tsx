import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { trpc, trpcClient } from '@/lib/trpc';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/contexts/AppContext';
import BiometricIntroScan from '@/components/BiometricIntroScan';
import BiomarkerLoadingScreen from '@/components/BiomarkerLoadingScreen';
import Colors from '@/constants/colors';

// Prevent auto-hide
SplashScreen.preventAutoHideAsync();

// Lock orientation (silent catch)
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      {/* Removed unused modal screen – add back only when you create app/modal.tsx */}
      {/* <Stack.Screen name="modal" options={{ presentation: 'modal' }} /> */}
    </Stack>
  );
}

function AppContent() {
  const { hasCompletedIntro, isLoadingIntro, completeIntro } = useApp();

  useEffect(() => {
    if (!isLoadingIntro) {
      SplashScreen.hideAsync().catch((e) => console.warn('Splash hide failed:', e));
    }
  }, [isLoadingIntro]);

  if (isLoadingIntro) {
    return <BiomarkerLoadingScreen />;
  }

  if (!hasCompletedIntro) {
    return <BiometricIntroScan onComplete={completeIntro} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <RootLayoutNav />
    </>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
