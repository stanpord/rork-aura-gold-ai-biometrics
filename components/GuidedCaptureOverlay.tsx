import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle,
  Sun,
  SunDim,
  Camera,
  Move,
  Timer,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

// --- CONSTANTS ---
const OVAL_WIDTH = 240;
const OVAL_HEIGHT = 320;
const STABILITY_DURATION = 2000;
const MIN_BRIGHTNESS = 20;
const MAX_BRIGHTNESS = 92;

// --- 1. STYLES AT TOP (Initialization Guard) ---
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalGuide: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  countdownContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 64,
    fontWeight: '300' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  statusBar: {
    position: 'absolute',
    top: 50,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusPillReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusPillWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statusTextReady: {
    color: Colors.success || '#10B981',
  },
  statusTextWarning: {
    color: Colors.error || '#EF4444',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 140,
    left: 60,
    right: 60,
  },
  progressBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  statusDotPassed: {
    backgroundColor: Colors.success || '#10B981',
  },
});

// --- 2. TYPES ---
type LightingStatus = 'checking' | 'too_dark' | 'too_bright' | 'good';

interface ValidationCheck {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  passed: boolean;
}

interface GuidedCaptureOverlayProps {
  onReadyToCapture: () => void;
  isActive: boolean;
  brightnessLevel?: number;
  onLightingStatusChange?: (isAcceptable: boolean) => void;
}

// --- 3. COMPONENT ---
export default function GuidedCaptureOverlay({ 
  onReadyToCapture, 
  isActive,
  brightnessLevel = 50,
  onLightingStatusChange,
}: GuidedCaptureOverlayProps) {
  const [validationChecks, setValidationChecks] = useState<ValidationCheck[]>([
    { id: 'position', label: 'Face centered', icon: Move, passed: false },
    { id: 'lighting', label: 'Good lighting', icon: Sun, passed: false },
    { id: 'stability', label: 'Hold steady', icon: Timer, passed: false },
  ]);
  
  const [currentInstruction, setCurrentInstruction] = useState('Position your face in the oval');
  const [isReady, setIsReady] = useState(false);
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const [lightingStatus, setLightingStatus] = useState<LightingStatus>('checking');
  const [lightingWarning, setLightingWarning] = useState<string | null>(null);
  const [positionValidated, setPositionValidated] = useState(false);
  
  const hasCapturedRef = useRef(false);
  const lightingStableCountRef = useRef(0);
  const lastBrightnessRef = useRef(brightnessLevel);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const lightingWarningAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScales = useRef(validationChecks.map(() => new Animated.Value(0))).current;

  const stabilityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stableBrightnessTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getLightingStatus = useCallback((brightness: number): LightingStatus => {
    if (brightness < MIN_BRIGHTNESS) return 'too_dark';
    if (brightness > MAX_BRIGHTNESS) return 'too_bright';
    return 'good';
  }, []);

  const getLightingMessage = useCallback((status: LightingStatus): string => {
    switch (status) {
      case 'too_dark': return 'Too dark - move to brighter area';
      case 'too_bright': return 'Too bright - avoid direct sunlight';
      case 'good': return 'Lighting is good';
      default: return 'Checking lighting...';
    }
  }, []);

  const updateCheck = useCallback((id: string, passed: boolean, index: number) => {
    setValidationChecks(prev => 
      prev.map(check => check.id === id ? { ...check, passed } : check)
    );

    if (passed && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(checkmarkScales[index], {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [checkmarkScales]);

  const startCaptureCountdown = useCallback(() => {
    if (hasCapturedRef.current) return;
    
    setCaptureCountdown(3);
    let count = 3;
    
    countdownTimerRef.current = setInterval(() => {
      if (hasCapturedRef.current) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        return;
      }
      
      count -= 1;
      setCaptureCountdown(count);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (count <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        hasCapturedRef.current = true;
        
        if (stabilityTimerRef.current) clearInterval(stabilityTimerRef.current);
        if (stableBrightnessTimerRef.current) clearInterval(stableBrightnessTimerRef.current);
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        
        onReadyToCapture();
      }
    }, 1000);
  }, [onReadyToCapture]);

  const startStabilityCheck = useCallback(() => {
    if (stabilityTimerRef.current) clearInterval(stabilityTimerRef.current);

    let progress = 0;
    const interval = 50;
    const steps = STABILITY_DURATION / interval;
    const increment = 100 / steps;

    stabilityTimerRef.current = setInterval(() => {
      const currentStatus = getLightingStatus(brightnessLevel);
      if (currentStatus !== 'good') {
        if (stabilityTimerRef.current) clearInterval(stabilityTimerRef.current);
        setStabilityProgress(0);
        progressAnim.setValue(0);
        return;
      }

      progress += increment;
      setStabilityProgress(Math.min(progress, 100));

      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: interval,
        useNativeDriver: false,
      }).start();

      if (progress >= 100) {
        if (stabilityTimerRef.current) clearInterval(stabilityTimerRef.current);
        updateCheck('stability', true, 2);
        setCurrentInstruction('Ready! Capturing in...');
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setIsReady(true);
        startCaptureCountdown();
      }
    }, interval);
  }, [updateCheck, progressAnim, startCaptureCountdown, getLightingStatus, brightnessLevel]);

  useEffect(() => {
    if (!isActive) {
      hasCapturedRef.current = false;
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
      ])
    ).start();

    const scanLine = Animated.loop(
      Animated.timing(scanLineAnim, { toValue: 1, duration: 2500, useNativeDriver: true })
    ).start();

    // Reset and start position check
    setTimeout(() => {
      updateCheck('position', true, 0);
      setPositionValidated(true);
      setCurrentInstruction('Checking lighting...');
    }, 1200);

    return () => {
      if (stabilityTimerRef.current) clearInterval(stabilityTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isActive, updateCheck]);

  useEffect(() => {
    if (!isActive || !positionValidated) return;

    const checkLighting = () => {
      const status = getLightingStatus(brightnessLevel);
      setLightingStatus(status);
      onLightingStatusChange?.(status === 'good');

      if (status === 'good') {
        lightingStableCountRef.current += 1;
        setLightingWarning(null);
        if (lightingStableCountRef.current >= 3) {
          const lightingCheck = validationChecks.find(c => c.id === 'lighting');
          if (lightingCheck && !lightingCheck.passed) {
            updateCheck('lighting', true, 1);
            setCurrentInstruction('Hold still for scan...');
            startStabilityCheck();
          }
        }
      } else {
        lightingStableCountRef.current = 0;
        setLightingWarning(getLightingMessage(status));
        
        const lightingCheck = validationChecks.find(c => c.id === 'lighting');
        if (lightingCheck?.passed) {
          updateCheck('lighting', false, 1);
          if (stabilityTimerRef.current) clearInterval(stabilityTimerRef.current);
          setStabilityProgress(0);
          progressAnim.setValue(0);
          updateCheck('stability', false, 2);
        }
      }
    };

    stableBrightnessTimerRef.current = setInterval(checkLighting, 300);
    return () => {
      if (stableBrightnessTimerRef.current) clearInterval(stableBrightnessTimerRef.current);
    };
  }, [brightnessLevel, isActive, positionValidated, updateCheck, startStabilityCheck, getLightingStatus]);

  // Interpolations
  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-OVAL_HEIGHT / 2, OVAL_HEIGHT / 2],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      
      <View style={styles.ovalContainer}>
        <Animated.View style={[styles.ovalGuide, { transform: [{ scale: pulseAnim }], borderColor: isReady ? Colors.success : lightingWarning ? Colors.error : 'rgba(255, 255, 255, 0.6)' }]}>
          {!isReady && <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]} />}
        </Animated.View>
        {captureCountdown !== null && captureCountdown > 0 && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{captureCountdown}</Text>
          </View>
        )}
      </View>

      <View style={styles.statusBar}>
        <View style={[styles.statusPill, isReady && styles.statusPillReady, lightingWarning && styles.statusPillWarning]}>
          <Camera size={16} color="#FFF" />
          <Text style={[styles.statusText, isReady && styles.statusTextReady, lightingWarning && styles.statusTextWarning]}>
            {lightingWarning || currentInstruction}
          </Text>
        </View>
      </View>

      {stabilityProgress > 0 && stabilityProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        </View>
      )}

      <View style={styles.dotsContainer}>
        {validationChecks.map((check, index) => (
          <Animated.View key={check.id} style={[styles.statusDot, check.passed && styles.statusDotPassed, { transform: [{ scale: check.passed ? checkmarkScales[index] : 1 }] }]} />
        ))}
      </View>
    </View>
  );
}