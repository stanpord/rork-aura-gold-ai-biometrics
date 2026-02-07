import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, RefreshCw } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import AuraScoreGauge from '@/components/AuraScoreGauge';
import BiometricScanOverlay from '@/components/BiometricScanOverlay';
import BiometricIntroScan from '@/components/BiometricIntroScan';

const GOLD = Colors.gold || '#F59E0B';

// --- STYLES DEFINED AT TOP TO PREVENT INITIALIZATION ERROR ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  heroSection: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  heroTitleGold: {
    color: GOLD,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  camera: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  btnText: {
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 20,
  },
  resetBtnText: {
    color: GOLD,
    marginLeft: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default function ScanScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [introPhase, setIntroPhase] = useState<'biomarkers' | 'facescan' | 'complete'>('biomarkers');

  const {
    currentAnalysis,
    capturedImage,
    resetScan,
    completeIntro,
    hasCompletedIntro,
    isLoadingIntro,
  } = useApp();

  const introCompletedRef = useRef(hasCompletedIntro);

  // Sync intro state with persistence
  useEffect(() => {
    if (hasCompletedIntro) {
      introCompletedRef.current = true;
      setIntroPhase('complete');
    }
  }, [hasCompletedIntro]);

  // 1. APP BOOT LOADER
  if (isLoadingIntro) {
    return <BiometricIntroScan />;
  }

  // 2. BIOMARKER ANALYSIS PHASE (12s Animation)
  if (introPhase === 'biomarkers' && !introCompletedRef.current) {
    return (
      <BiometricIntroScan onComplete={() => setIntroPhase('facescan')} />
    );
  }

  // 3. FACIAL GEOMETRY PHASE (Final Handshake)
  if (introPhase === 'facescan' && !introCompletedRef.current) {
    return (
      <BiometricIntroScan
        onComplete={() => {
          introCompletedRef.current = true;
          completeIntro();
          setIntroPhase('complete');
        }}
      />
    );
  }

  // 4. MAIN CAMERA LOGIC
  const handleStartScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setIsCameraActive(true);
  };

  if (!capturedImage) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              REVEAL YOUR{'\n'}
              <Text style={styles.heroTitleGold}>AURA INDEX</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              AI-POWERED BIOMETRIC ANALYSIS
            </Text>
          </View>

          <View style={styles.cameraWrapper}>
            {isCameraActive ? (
              <CameraView style={styles.camera} facing="front">
                <BiometricScanOverlay />
              </CameraView>
            ) : (
              <TouchableOpacity style={styles.placeholder} onPress={handleStartScan}>
                <LinearGradient
                  colors={[GOLD, '#B8860B']}
                  style={styles.iconCircle}
                >
                  <Camera size={32} color="#000" />
                </LinearGradient>
                <Text style={styles.btnText}>START BIOMETRIC SCAN</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // 5. RESULTS DISPLAY
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AuraScoreGauge score={currentAnalysis?.auraScore || 0} />
        <TouchableOpacity style={styles.resetBtn} onPress={resetScan}>
          <RefreshCw size={20} color={GOLD} />
          <Text style={styles.resetBtnText}>NEW ANALYSIS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}