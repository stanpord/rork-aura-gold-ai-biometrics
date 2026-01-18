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
  Move,
  Timer,
  Scan,
  AlertCircle,
  SunDim,
  CloudSun,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

type LightingStatus = 'checking' | 'too_dark' | 'too_bright' | 'good';

const MIN_BRIGHTNESS = 20;
const MAX_BRIGHTNESS = 92;
const OPTIMAL_MIN = 30;
const OPTIMAL_MAX = 80;



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

const OVAL_WIDTH = 260;
const OVAL_HEIGHT = 360;
const STABILITY_DURATION = 2000;

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
  
  const lightingCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lightingStableCountRef = useRef(0);
  const lastBrightnessRef = useRef(brightnessLevel);
  const stableBrightnessTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lightingWarningAnim = useRef(new Animated.Value(0)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScales = useRef(
    validationChecks.map(() => new Animated.Value(0))
  ).current;

  const stabilityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getLightingStatus = useCallback((brightness: number): LightingStatus => {
    if (brightness < MIN_BRIGHTNESS) return 'too_dark';
    if (brightness > MAX_BRIGHTNESS) return 'too_bright';
    return 'good';
  }, []);

  const getLightingQuality = useCallback((brightness: number): 'poor' | 'acceptable' | 'optimal' => {
    if (brightness < MIN_BRIGHTNESS || brightness > MAX_BRIGHTNESS) return 'poor';
    if (brightness >= OPTIMAL_MIN && brightness <= OPTIMAL_MAX) return 'optimal';
    return 'acceptable';
  }, []);

  const getLightingMessage = useCallback((status: LightingStatus): string => {
    switch (status) {
      case 'too_dark':
        return 'Too dark - move to brighter area';
      case 'too_bright':
        return 'Too bright - avoid direct sunlight';
      case 'good':
        return 'Lighting is good';
      default:
        return 'Checking lighting...';
    }
  }, []);

  const updateCheck = useCallback((id: string, passed: boolean, index: number) => {
    setValidationChecks(prev => 
      prev.map(check => check.id === id ? { ...check, passed } : check)
    );

    if (passed) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      Animated.spring(checkmarkScales[index], {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [checkmarkScales]);

  const startPositionCheck = useCallback(() => {
    setTimeout(() => {
      updateCheck('position', true, 0);
      setPositionValidated(true);
      setCurrentInstruction('Checking lighting conditions...');
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 1200);
  }, [updateCheck]);

  const startCaptureCountdown = useCallback(() => {
    setCaptureCountdown(3);
    
    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      setCaptureCountdown(count);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (count <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        
        onReadyToCapture();
      }
    }, 1000);
  }, [onReadyToCapture]);

  const startStabilityCheck = useCallback(() => {
    if (stabilityTimerRef.current) {
      clearInterval(stabilityTimerRef.current);
    }

    let progress = 0;
    const interval = 50;
    const steps = STABILITY_DURATION / interval;
    const increment = 100 / steps;

    stabilityTimerRef.current = setInterval(() => {
      const currentStatus = getLightingStatus(brightnessLevel);
      if (currentStatus !== 'good') {
        if (stabilityTimerRef.current) {
          clearInterval(stabilityTimerRef.current);
          stabilityTimerRef.current = null;
        }
        progress = 0;
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
        if (stabilityTimerRef.current) {
          clearInterval(stabilityTimerRef.current);
        }
        
        updateCheck('stability', true, 2);
        setCurrentInstruction('Ready! Capturing in...');
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();

        setIsReady(true);
        startCaptureCountdown();
      }
    }, interval);
  }, [updateCheck, progressAnim, glowAnim, startCaptureCountdown, getLightingStatus, brightnessLevel]);

  useEffect(() => {
    if (!isActive) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const scanLine = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    scanLine.start();

    startPositionCheck();

    const currentLightingInterval = lightingCheckIntervalRef.current;
    const currentStabilityTimer = stabilityTimerRef.current;
    const currentCountdownTimer = countdownTimerRef.current;

    return () => {
      pulse.stop();
      scanLine.stop();
      if (currentStabilityTimer) clearInterval(currentStabilityTimer);
      if (currentCountdownTimer) clearInterval(currentCountdownTimer);
      if (currentLightingInterval) clearInterval(currentLightingInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !positionValidated) return;

    const checkLighting = () => {
      const status = getLightingStatus(brightnessLevel);
      setLightingStatus(status);

      onLightingStatusChange?.(status === 'good');

      if (status === 'good') {
        lightingStableCountRef.current += 1;
        setLightingWarning(null);
        
        Animated.timing(lightingWarningAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();

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
        
        Animated.timing(lightingWarningAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const lightingCheck = validationChecks.find(c => c.id === 'lighting');
        if (lightingCheck?.passed) {
          updateCheck('lighting', false, 1);
          if (stabilityTimerRef.current) {
            clearInterval(stabilityTimerRef.current);
            stabilityTimerRef.current = null;
          }
          setStabilityProgress(0);
          progressAnim.setValue(0);
          updateCheck('stability', false, 2);
          setCurrentInstruction(getLightingMessage(status));
        }
      }
    };

    // Run check immediately
    checkLighting();

    // Also run on interval to handle stable brightness values
    if (stableBrightnessTimerRef.current) {
      clearInterval(stableBrightnessTimerRef.current);
    }
    stableBrightnessTimerRef.current = setInterval(() => {
      const lightingCheck = validationChecks.find(c => c.id === 'lighting');
      if (!lightingCheck?.passed) {
        checkLighting();
      }
    }, 300);

    lastBrightnessRef.current = brightnessLevel;

    return () => {
      if (stableBrightnessTimerRef.current) {
        clearInterval(stableBrightnessTimerRef.current);
      }
    };
  }, [brightnessLevel, isActive, positionValidated, getLightingStatus, getLightingMessage, validationChecks, updateCheck, startStabilityCheck, lightingWarningAnim, progressAnim, onLightingStatusChange]);

  const getLightingIndicatorColor = useCallback(() => {
    const quality = getLightingQuality(brightnessLevel);
    switch (quality) {
      case 'optimal': return Colors.success;
      case 'acceptable': return Colors.gold;
      default: return Colors.error;
    }
  }, [brightnessLevel, getLightingQuality]);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-OVAL_HEIGHT / 2, OVAL_HEIGHT / 2],
  });

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(245, 158, 11, 0.4)', 'rgba(16, 185, 129, 0.8)'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.ovalContainer}>
        <Animated.View
          style={[
            styles.ovalGuide,
            {
              transform: [{ scale: pulseAnim }],
              borderColor: glowColor,
              shadowColor: isReady ? Colors.success : Colors.gold,
            },
          ]}
        >
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          {!isReady && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: scanLineTranslateY }],
                },
              ]}
            />
          )}

          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />
        </Animated.View>

        {captureCountdown !== null && captureCountdown > 0 && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{captureCountdown}</Text>
          </View>
        )}
      </View>

      <View style={styles.instructionContainer}>
        <View style={styles.instructionBox}>
          {isReady ? (
            <CheckCircle size={18} color={Colors.success} />
          ) : (
            <Scan size={18} color={Colors.gold} />
          )}
          <Text style={[styles.instructionText, isReady && styles.instructionReady]}>
            {currentInstruction}
          </Text>
        </View>
      </View>

      {lightingWarning && (
        <Animated.View 
          style={[
            styles.lightingWarningContainer,
            { opacity: lightingWarningAnim }
          ]}
        >
          <View style={styles.lightingWarningBox}>
            {lightingStatus === 'too_dark' ? (
              <SunDim size={20} color={Colors.error} />
            ) : (
              <Sun size={20} color={Colors.error} />
            )}
            <Text style={styles.lightingWarningText}>{lightingWarning}</Text>
          </View>
          <View style={styles.lightingTipBox}>
            {lightingStatus === 'too_dark' ? (
              <Text style={styles.lightingTipText}>
                💡 Turn on more lights or move near a window
              </Text>
            ) : (
              <Text style={styles.lightingTipText}>
                🌤️ Move away from direct light source or window
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {positionValidated && (
        <View style={styles.lightingMeterContainer}>
          <View style={styles.lightingMeterLabel}>
            <CloudSun size={14} color={Colors.textMuted} />
            <Text style={styles.lightingMeterText}>Lighting</Text>
          </View>
          <View style={styles.lightingMeterBarBg}>
            <View 
              style={[
                styles.lightingMeterBarFill,
                { 
                  width: `${Math.min(100, Math.max(0, brightnessLevel))}%`,
                  backgroundColor: getLightingIndicatorColor()
                }
              ]} 
            />
            <View style={[styles.lightingThreshold, styles.lightingThresholdMin]} />
            <View style={[styles.lightingThreshold, styles.lightingThresholdMax]} />
          </View>
          <Text style={[styles.lightingStatusText, { color: getLightingIndicatorColor() }]}>
            {getLightingQuality(brightnessLevel) === 'optimal' ? 'Optimal' : 
             getLightingQuality(brightnessLevel) === 'acceptable' ? 'OK' : 'Poor'}
          </Text>
        </View>
      )}

      <View style={styles.checksContainer}>
        {validationChecks.map((check, index) => {
          const IconComponent = check.icon;
          return (
            <View key={check.id} style={styles.checkItem}>
              <Animated.View
                style={[
                  styles.checkIconContainer,
                  check.passed && styles.checkIconPassed,
                  {
                    transform: [
                      {
                        scale: check.passed
                          ? checkmarkScales[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            })
                          : 1,
                      },
                    ],
                  },
                ]}
              >
                {check.passed ? (
                  <CheckCircle size={16} color={Colors.success} />
                ) : (
                  <IconComponent size={16} color={Colors.textMuted} />
                )}
              </Animated.View>
              <Text
                style={[styles.checkLabel, check.passed && styles.checkLabelPassed]}
              >
                {check.label}
              </Text>
            </View>
          );
        })}
      </View>

      {stabilityProgress > 0 && stabilityProgress < 100 && (
        <View style={styles.stabilityContainer}>
          <View style={styles.stabilityBarBackground}>
            <Animated.View
              style={[styles.stabilityBarFill, { width: progressWidth }]}
            />
          </View>
          <Text style={styles.stabilityText}>
            {Math.round(stabilityProgress)}% stable
          </Text>
        </View>
      )}

      <View style={styles.tipsContainer}>
        <View style={styles.tipItem}>
          <AlertCircle size={12} color={Colors.textMuted} />
          <Text style={styles.tipText}>Remove glasses for best results</Text>
        </View>
        <View style={styles.tipItem}>
          <Sun size={12} color={Colors.textMuted} />
          <Text style={styles.tipText}>Face natural light source</Text>
        </View>
      </View>
    </View>
  );
}

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
    borderWidth: 3,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  cornerTL: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.gold,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.gold,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.gold,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.gold,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  crosshairH: {
    position: 'absolute',
    top: '50%',
    left: '25%',
    right: '25%',
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  crosshairV: {
    position: 'absolute',
    left: '50%',
    top: '25%',
    bottom: '25%',
    width: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  countdownContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '900' as const,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  instructionContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  instructionReady: {
    color: Colors.success,
  },
  checksContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  checkItem: {
    alignItems: 'center',
    gap: 6,
  },
  checkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  checkIconPassed: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  checkLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  checkLabelPassed: {
    color: Colors.success,
  },
  stabilityContainer: {
    position: 'absolute',
    bottom: 215,
    left: 40,
    right: 40,
    alignItems: 'center',
    gap: 6,
  },
  stabilityBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stabilityBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  stabilityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  tipsContainer: {
    position: 'absolute',
    bottom: 55,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  lightingWarningContainer: {
    position: 'absolute',
    top: 95,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 6,
  },
  lightingWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  lightingWarningText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  lightingTipBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lightingTipText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '500' as const,
  },
  lightingMeterContainer: {
    position: 'absolute',
    bottom: 185,
    left: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lightingMeterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 70,
  },
  lightingMeterText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  lightingMeterBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  lightingMeterBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  lightingThreshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  lightingThresholdMin: {
    left: `${MIN_BRIGHTNESS}%`,
  },
  lightingThresholdMax: {
    left: `${MAX_BRIGHTNESS}%`,
  },
  lightingStatusText: {
    fontSize: 10,
    fontWeight: '700' as const,
    width: 45,
    textAlign: 'right' as const,
  },
});
