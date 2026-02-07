import React, { useState, useRef } from 'react'; // Added useRef
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import BiometricScanOverlay from '@/components/BiometricScanOverlay';
import BiometricIntroScan from '@/components/BiometricIntroScan';

const GOLD = Colors.gold || '#F59E0B';

// --- STYLES AT TOP ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 24, alignItems: 'center' },
  heroSection: { marginTop: 60, marginBottom: 40, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  heroTitleGold: { color: GOLD },
  cameraWrapper: { width: '100%', aspectRatio: 3/4, borderRadius: 40, overflow: 'hidden', backgroundColor: '#111' },
  camera: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  btnText: { color: GOLD, fontWeight: '900', fontSize: 12, letterSpacing: 2 },
});

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { isLoadingIntro, completeIntro } = useApp();
  
  // 1. ADD THIS: Create the reference to the camera
  const cameraRef = useRef<CameraView>(null);

  // 2. ADD THIS: Function to actually take the photo
  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true, // Speeds up Android captures
        });
        console.log('Aura Index Photo Captured:', photo.uri);
        // Add your logic here to process the scan result
      } catch (error) {
        console.error('Failed to capture biometric data:', error);
      }
    }
  };

  if (isLoadingIntro) return <BiometricIntroScan onComplete={completeIntro} />;

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setIsCameraActive(true);
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
            // 3. ADD THIS: Connect the ref and the capture trigger
            <CameraView 
              ref={cameraRef} 
              style={styles.camera} 
              facing="front"
            >
              <BiometricScanOverlay onReadyToCapture={takePhoto} />
            </CameraView>
          ) : (
            <TouchableOpacity style={styles.placeholder} onPress={handleStartScan}>
              <View style={[styles.iconCircle, { backgroundColor: GOLD }]}>
                <Camera size={32} color="#000" />
              </View>
              <Text style={styles.btnText}>START BIOMETRIC SCAN</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}