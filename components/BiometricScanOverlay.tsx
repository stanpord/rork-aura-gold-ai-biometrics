import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, Brain, Microscope, Dna, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ANALYSIS_STAGES = [
  { icon: Microscope, text: 'Analyzing skin texture...', subtext: 'Detecting pore size and surface quality' },
  { icon: Brain, text: 'Processing facial geometry...', subtext: 'Mapping structural landmarks' },
  { icon: Dna, text: 'Evaluating aging markers...', subtext: 'Assessing volume and elasticity' },
  { icon: Activity, text: 'Generating treatment plan...', subtext: 'Matching clinical protocols' },
  { icon: Sparkles, text: 'Finalizing your Aura Index...', subtext: 'Computing personalized score' },
];

export default function BiometricScanOverlay() {
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const textFadeAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLinePosition, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLinePosition, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const iconPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const dotsAnimation = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotAnim1, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ])
    );

    scanAnimation.start();
    pulseAnimation.start();
    iconPulse.start();
    dotsAnimation.start();

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    }).start();

    const stageInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentStage(prev => (prev + 1) % ANALYSIS_STAGES.length);
    }, 2400);

    return () => {
      scanAnimation.stop();
      pulseAnimation.stop();
      iconPulse.stop();
      dotsAnimation.stop();
      clearInterval(stageInterval);
    };
  }, [scanLinePosition, pulseAnim, textFadeAnim, iconScaleAnim, progressAnim, dotAnim1, dotAnim2, dotAnim3]);

  const translateY = scanLinePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.6],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const CurrentIcon = ANALYSIS_STAGES[currentStage].icon;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{ translateY }],
            opacity: pulseAnim,
          },
        ]}
      />
      <View style={styles.gridOverlay}>
        {[...Array(8)].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 12}%` }]} />
        ))}
        {[...Array(6)].map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 16}%` }]} />
        ))}
      </View>
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />
      <Animated.View style={[styles.targetCircle, { opacity: pulseAnim }]} />
      
      <View style={styles.statusContainer}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScaleAnim }] }]}>
          <CurrentIcon size={28} color={Colors.gold} />
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
          <View style={styles.textRow}>
            <Text style={styles.statusText}>{ANALYSIS_STAGES[currentStage].text}</Text>
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
            </View>
          </View>
          <Text style={styles.subtextText}>{ANALYSIS_STAGES[currentStage].subtext}</Text>
        </Animated.View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.stageIndicators}>
            {ANALYSIS_STAGES.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.stageIndicator,
                  index <= currentStage && styles.stageIndicatorActive
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.gold,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.gold,
  },
  cornerTL: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.gold,
  },
  cornerTR: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.gold,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.gold,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.gold,
  },
  targetCircle: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    marginLeft: -60,
    marginTop: -80,
    width: 120,
    height: 160,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 4,
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  subtextText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  stageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stageIndicatorActive: {
    backgroundColor: Colors.gold,
  },
});
