import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

const FACE_IMAGE = 'https://r2-pub.rork.com/generated-images/475a6908-3419-4157-b237-ce96bff62622.png';

// --- STYLES AT TOP (Initialization Guard) ---
const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 100 },
  faceContainer: { flex: 1 },
  faceImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 3 },
  completeOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  completeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.5)'
  },
});

export default function BiometricIntroScan({ onComplete }: { onComplete: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Start Intro
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // Scan Animation
    Animated.loop(
      Animated.timing(scanLineAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();

    // Auto-complete intro sequence after 4 seconds
    const timer = setTimeout(() => {
      setPhase(3);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.timing(exitAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => onComplete());
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Dimensions.get('window').height]
  });

  return (
    <Animated.View style={[styles.container, { opacity: Animated.multiply(fadeAnim, exitAnim) }]}>
      
      <View style={styles.faceContainer}>
        <Image source={{ uri: FACE_IMAGE }} style={styles.faceImage} contentFit="cover" />
        <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
          <LinearGradient colors={['transparent', Colors.gold || '#F59E0B', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={{flex: 1}} />
        </Animated.View>
      </View>
      {phase === 3 && (
        <View style={styles.completeOverlay}>
          <View style={styles.completeBadge}><CheckCircle size={32} color="#10B981" /></View>
        </View>
      )}
    </Animated.View>
  );
}