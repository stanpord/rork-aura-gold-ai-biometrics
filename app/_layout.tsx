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
import BiomarkerLoadingScreen from '@/components/BiomarkerLoadingScreen'; // ← ADD THIS
import Colors from '@/constants/colors';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync();

// Lock to portrait (optional, catch silently)
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {
  console.log('Screen orientation lock not supported on this platform');
});

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
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

function AppContent() {
  const { hasCompletedIntro, isLoadingIntro, completeIntro } = useApp();

  useEffect(() => {
    // Hide splash once we're ready (intro loaded or skipped)
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Splash hide failed:', e);
      }
    };

    if (!isLoadingIntro) {
      hideSplash();
    }
  }, [isLoadingIntro]);

  // If still loading intro data → show loading screen
  if (isLoadingIntro) {
    return <BiomarkerLoadingScreen />;
  }

  // If intro not completed → show intro screen
  if (!hasCompletedIntro) {
    return <BiometricIntroScan onComplete={completeIntro} />;
  }

  // Normal app flow
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
