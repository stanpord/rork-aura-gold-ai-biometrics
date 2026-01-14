import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
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

// Beautiful model with biometric scanning overlay - ideal for medspa diagnostic
const FACE_IMAGE = 'https://r2-pub.rork.com/generated-images/475a6908-3419-4157-b237-ce96bff62622.png';

const { height } = Dimensions.get('window');

interface BiometricIntroScanProps {
  onComplete: () => void;
}



export default function BiometricIntroScan({ onComplete }: BiometricIntroScanProps) {
  const [currentPhase, setCurrentPhase] = useState(0);

  const [progressPercent, setProgressPercent] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const faceOutlineScale = useRef(new Animated.Value(0.8)).current;
  const faceOutlineOpacity = useRef(new Animated.Value(0)).current;

  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startIntroSequence();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startIntroSequence = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setCurrentPhase(1);
      runPhase1();
    }, 200);
  };

  const runPhase1 = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.parallel([
      Animated.timing(gridOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(faceOutlineScale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(faceOutlineOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      setCurrentPhase(2);
      runPhase2();
    }, 400);
  };

  const runPhase2 = () => {
    // Start scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
      }
      setProgressPercent(progress);
      
      if (Platform.OS !== 'web' && progress % 20 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 50);

    setTimeout(() => {
      setCurrentPhase(3);
      runPhase3();
    }, 1800);
  };

  const runPhase3 = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 400);
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
      {/* Face-only centered image */}
      <View style={styles.faceContainer}>
        <Animated.View
          style={[
            styles.faceImageContainer,
            {
              opacity: faceOutlineOpacity,
              transform: [
                { scale: faceOutlineScale },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: FACE_IMAGE }}
            style={styles.faceImage}
            contentFit="cover"
            contentPosition="center"
          />
          {/* Subtle scan overlay */}
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



        {/* Scan line */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [
                {
                  translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height],
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

        {/* Minimal progress indicator at bottom */}
        <View style={styles.progressOverlay}>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>
      </View>

      {currentPhase === 3 && (
        <Animated.View style={[styles.completeOverlay, { opacity: exitAnim }]}>
          <View style={styles.completeBadge}>
            <CheckCircle size={24} color={Colors.success} />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1000,
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
  progressOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
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
