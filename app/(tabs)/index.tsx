import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import BiometricIntroScan from '@/components/BiometricIntroScan';

// --- STYLES DEFINED AT TOP (Aura Guard Compliance) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#000' },
  loadingContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: Colors.gold, marginTop: 24, fontSize: 12, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  scrollContent: { padding: 24, alignItems: 'center' },
  heroSection: { marginTop: 60, marginBottom: 40, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  heroTitleGold: { color: Colors.gold || '#F59E0B' },
  cameraContainer: { 
    width: '100%', 
    aspectRatio: 0.75, 
    borderRadius: 40, 
    overflow: 'hidden', 
    backgroundColor: '#111', 
    justifyContent: 'center' 
  },
  camera: { flex: 1 },
  optionButton: { alignItems: 'center' },
  optionIconGradient: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  optionText: { color: Colors.gold, marginTop: 12, fontWeight: '900' },
  instructionText: { color: '#888', marginTop: 20, fontSize: 10, letterSpacing: 1 },
  newScanButton: { marginTop: 40, alignSelf: 'center', paddingVertical: 16, paddingHorizontal: 32, backgroundColor: '#1E293B', borderRadius: 20 },
  newScanButtonText: { color: Colors.gold, fontWeight: '800' }
});

// Placeholder component for deleted biomarkers.tsx
const BiomarkerLoadingScreen = ({ onComplete }: { onComplete?: () => void }) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.gold} />
      <Text style={styles.loadingText}>INITIALIZING AURA GOLD</Text>
      {onComplete && (
        <TouchableOpacity onPress={onComplete} style={{ marginTop: 40 }}>
          <Text style={{ color: '#888', fontSize: 10 }}>SKIP INITIALIZATION</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function ScanScreen() {
  const {
    capturedImage,
    setCapturedImage,
    completeIntro,
    hasCompletedIntro,
    isLoadingIntro,
  } = useApp();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [introPhase, setIntroPhase] = useState<'biomarkers' | 'facescan' | 'complete'>(
    hasCompletedIntro ? 'complete' : 'biomarkers'
  );

  // 1. ADDED: Camera Reference to enable capture
  const cameraRef = useRef<CameraView>(null);

  const startCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setIsCameraActive(true);
  };

  // 2. ADDED: The actual capture logic
  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        setCapturedImage(photo.uri);
      } catch (e) {
        console.error("Capture Error:", e);
      }
    }
  };

  // --- HANDSHAKE LOGIC ---
  if (isLoadingIntro) return <BiomarkerLoadingScreen />;

  if (introPhase === 'biomarkers' && !hasCompletedIntro) {
    return <BiomarkerLoadingScreen onComplete={() => setIntroPhase('facescan')} />;
  }

  if (introPhase === 'facescan' && !hasCompletedIntro) {
    return (
      <BiometricIntroScan onComplete={() => {
        completeIntro();
        setIntroPhase('complete');
      }} />
    );
  }

  // --- MAIN UI ---
  if (!capturedImage) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              REVEAL YOUR{'\n'}
              <Text style={styles.heroTitleGold}>AURA INDEX</Text>
            </Text>
          </View>
          
          <View style={styles.cameraContainer}>
            {isCameraActive ? (
              // 3. CONNECTED: cameraRef and onPress trigger
              <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={handleCapture}>
                <CameraView ref={cameraRef} style={styles.camera} facing="front" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.optionButton} onPress={startCamera}>
                <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.optionIconGradient}>
                  <Camera size={28} color="#000" />
                </LinearGradient>
                <Text style={styles.optionText}>TAKE PHOTO</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isCameraActive && (
            <Text style={styles.instructionText}>TAP VIEWFINDER TO SCAN</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => { setCapturedImage(null); setIsCameraActive(false); }} 
        style={styles.newScanButton}
      >
        <Text style={styles.newScanButtonText}>RESET BIOMETRICS</Text>
      </TouchableOpacity>
    </View>
  );
}