import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { trpc, trpcClient } from '@/lib/trpc';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from '@/contexts/AppContext';
import BiometricIntroScan from '@/components/BiometricIntroScan';
import Colors from '@/constants/colors';
import BiomarkerLoadingScreen from '@/components/BiomarkerLoadingScreen';

SplashScreen.preventAutoHideAsync();

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
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!isLoadingIntro) {
      SplashScreen.hideAsync();
      if (!hasCompletedIntro) {
        setShowIntro(true);
      }
    }
  }, [isLoadingIntro, hasCompletedIntro]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    completeIntro();
  };

  if (isLoadingIntro) {
    return <BiomarkerLoadingScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      <RootLayoutNav />
      {showIntro && <BiometricIntroScan onComplete={handleIntroComplete} />}
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


