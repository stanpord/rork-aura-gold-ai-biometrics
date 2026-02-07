import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import BiometricScanOverlay from '@/components/BiometricScanOverlay';
import BiometricIntroScan from '@/components/BiometricIntroScan';

const GOLD = Colors.gold || '#F59E0B';

// --- STYLES DEFINED AT TOP (Aura Guard Compliance) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 24, alignItems: 'center' },
  heroSection: { marginTop: 60, marginBottom: 40, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  heroTitleGold: { color: GOLD },
  cameraWrapper: { 
    width: '100%', 
    aspectRatio: 3 / 4, 
    borderRadius: 40, 
    overflow: 'hidden', 
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  camera: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  btnText: { color: GOLD, fontWeight: '900', fontSize: 12, letterSpacing: 2 },
});

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { isLoadingIntro, completeIntro } = useApp();
  
  // Ref to trigger the native camera shutter
  const cameraRef = useRef<CameraView>(null);

  if (isLoadingIntro) return <BiometricIntroScan onComplete={completeIntro} />;

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setIsCameraActive(true);
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true, 
        });
        console.log('Biometric Capture Success:', photo?.uri);
      } catch (error) {
        console.error('Capture failed:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            REVEAL YOUR{'\n'}
            <Text style={styles.heroTitleGold}>AURA INDEX</Text>
          </Text>
        </View>

        <View style={styles.cameraWrapper}>
          {isCameraActive ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front">
              <BiometricScanOverlay onReadyToCapture={handleCapture} />
            </CameraView>
          ) : (
            <TouchableOpacity style={styles.placeholder} onPress={handleStartScan}>
              <LinearGradient colors={[GOLD, '#B8860B']} style={styles.iconCircle}>
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