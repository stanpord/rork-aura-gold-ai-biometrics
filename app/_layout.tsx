import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { trpc, trpcClient } from '@/lib/trpc';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from '@/contexts/AppContext';
import BiometricIntroScan from '@/components/BiometricIntroScan';
import Colors from '@/constants/colors';
import BiomarkerLoadingScreen from '@/components/BiomarkerLoadingScreen';

// Prevent splash screen from hiding until we are ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* handle error */
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background || '#000' },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

function AppContent() {
  const { hasCompletedIntro, isLoadingIntro, completeIntro } = useApp();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Lock orientation to portrait for clinical facial scanning accuracy
    const lockOrientation = async () => {
      try {
        if (ScreenOrientation.lockAsync) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (e) {
        console.warn('Orientation lock not supported:', e);
      }
    };
    lockOrientation();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        if (!isLoadingIntro) {
          // Subtle delay to ensure the IntroScan component is mounted
          // before we pull the curtain back on the Splash screen
          if (!hasCompletedIntro) {
            setShowIntro(true);
          }
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.warn('Error preparing app:', error);
        // Still hide splash screen to prevent hanging
        try {
          await SplashScreen.hideAsync();
        } catch (hideError) {
          console.warn('Error hiding splash screen:', hideError);
        }
      }
    }
    prepare();
  }, [isLoadingIntro, hasCompletedIntro]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    completeIntro();
  }, [completeIntro]);

  // While the AppContext is fetching the initial auth/session state
  if (isLoadingIntro) {
    return <BiomarkerLoadingScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      <RootLayoutNav />
      {/* Intro Overlay is rendered on top of the stack 
        to ensure a smooth transition into the Aura Scan 
      */}
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
