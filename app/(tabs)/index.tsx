import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import {
  Camera,
  RefreshCw,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import AuraScoreGauge from '@/components/AuraScoreGauge';
import BiometricScanOverlay from '@/components/BiometricScanOverlay';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import EmailCaptureModal from '@/components/EmailCaptureModal';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import GuidedCaptureOverlay from '@/components/GuidedCaptureOverlay';
import HealthQuestionnaire from '@/components/HealthQuestionnaire';
import PatientResultsModal from '@/components/PatientResultsModal';
import PatientConsentModal from '@/components/PatientConsentModal';

// This is your new high-end replacement for the old folder
import BiometricIntroScan from '@/components/BiometricIntroScan';

export default function ScanScreen() {
  const { width: windowWidth } = useWindowDimensions();
  
  const {
    currentAnalysis,
    capturedImage,
    setCapturedImage,
    resetScan,
    completeIntro,
    hasCompletedIntro,
    isLoadingIntro,
  } = useApp();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [introPhase, setIntroPhase] = useState<'biomarkers' | 'facescan' | 'complete'>(
    hasCompletedIntro ? 'complete' : 'biomarkers'
  );

  const introCompletedRef = useRef(hasCompletedIntro);

  // Sync intro state with AppContext
  useEffect(() => {
    if (hasCompletedIntro && !introCompletedRef.current) {
      introCompletedRef.current = true;
      setIntroPhase('complete');
    }
  }, [hasCompletedIntro]);

  // --- 1. BOOT LOADER (App Initialization) ---
  if (isLoadingIntro) {
    return <BiometricIntroScan />;
  }

  // --- 2. INTRO SEQUENCE (The High-End Scan Animation) ---
  if (introPhase === 'biomarkers' && !introCompletedRef.current) {
    return (
      <BiometricIntroScan 
        onComplete={() => setIntroPhase('facescan')} 
      />
    );
  }

  // --- 3. INTRO SEQUENCE (Final Handshake) ---
  if (introPhase === 'facescan' && !introCompletedRef.current) {
    return (
      <BiometricIntroScan 
        onComplete={() => {
          introCompletedRef.current = true;
          completeIntro(); // Updates AsyncStorage and Context
          setIntroPhase('complete');
        }} 
      />
    );
  }

  // --- 4. MAIN CAMERA / SCAN UI ---
  const startCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
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
              AI-POWERED BIOMETRIC ANALYSIS & CLINICAL ROADMAP
            </Text>
          </View>

          <View style={styles.cameraContainer}>
            {isCameraActive ? (
              <CameraView style={styles.camera} facing="front">
                <BiometricScanOverlay />
              </CameraView>
            ) : (
              <TouchableOpacity style={styles.capturePlaceholder} onPress={startCamera}>
                <LinearGradient
                  colors={[Colors.gold || '#D4AF37', '#B8860B']}
                  style={styles.captureIconGradient}
                >
                  <Camera size={32} color="#000" />
                </LinearGradient>
                <Text style={styles.captureText}>START BIOMETRIC SCAN</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- 5. RESULTS VIEW ---
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AuraScoreGauge score={currentAnalysis?.auraScore || 0} />
        <TouchableOpacity style={styles.resetButton} onPress={resetScan}>
          <RefreshCw size={20} color={Colors.gold} />
          <Text style={styles.resetButtonText}>NEW ANALYSIS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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
    color: Colors.gold || '#D4AF37',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  camera: {
    flex: 1,
  },
  capturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureText: {
    color: Colors.gold || '#D4AF37',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 20,
  },
  resetButtonText: {
    color: Colors.gold || '#D4AF37',
    marginLeft: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});