import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

// --- 1. CONSTANTS & STYLES AT TOP (Initialization Guard) ---
const FACE_IMAGE = 'https://r2-pub.rork.com/generated-images/475a6908-3419-4157-b237-ce96bff62622.png';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  faceContainer: {
    flex: 1,
  },
  faceImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  faceImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  faceGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scanLinesOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scanLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
  },
  scanLineGradient: {
    flex: 1,
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
});

const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

interface BiometricIntroScanProps {
  onComplete: () => void;
}

// --- 2. COMPONENT LOGIC ---
export default function BiometricIntroScan({ onComplete }: BiometricIntroScanProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [dimensions, setDimensions] = useState(getScreenDimensions());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  const SCREEN_WIDTH = dimensions.width;
  const SCREEN_HEIGHT = dimensions.height;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const faceOutlineScale = useRef(new Animated.Value(0.8)).current;
  const faceOutlineOpacity = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startIntroSequence();
  }, []);

  const startIntroSequence = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setCurrentPhase(1);
      runPhase1();
    }, 500);
  };

  const runPhase1 = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.parallel([
      Animated.timing(gridOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(faceOutlineScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(faceOutlineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      setCurrentPhase(2);
      runPhase2();
    }, 1200);
  };

  const runPhase2 = () => {
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
      }
      if (Platform.OS !== 'web' && progress % 10 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 100);

    setTimeout(() => {
      setCurrentPhase(3);
      runPhase3();
    }, 4200);
  };

  const runPhase3 = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 1000);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: Animated.multiply(fadeAnim, exitAnim),
        },
      ]}
    >
      <View style={styles.faceContainer}>
        <Animated.View
          style={[
            styles.faceImageContainer,
            {
              opacity: faceOutlineOpacity,
              transform: [{ scale: faceOutlineScale }],
            },
          ]}
        >
          <Image
            source={{ uri: FACE_IMAGE }}
            style={styles.faceImage}
            contentFit="cover"
            contentPosition="center"
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.4)', 'rgba(245, 158, 11, 0.05)', 'rgba(0, 0, 0, 0.4)']}
            style={styles.faceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.scanLinesOverlay}>
            {Array.from({ length: 60 }).map((_, i) => (
              <View key={`scan-h-${i}`} style={[styles.scanLineH, { top: `${(i / 60) * 100}%` }]} />
            ))}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [
                {
                  translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SCREEN_HEIGHT],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(245, 158, 11, 0.6)', 'transparent']}
            style={styles.scanLineGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>

      {currentPhase === 3 && (
        <Animated.View style={[styles.completeOverlay, { opacity: exitAnim }]}>
          <View style={styles.completeBadge}>
            <CheckCircle size={24} color={Colors.success || '#10B981'} />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}