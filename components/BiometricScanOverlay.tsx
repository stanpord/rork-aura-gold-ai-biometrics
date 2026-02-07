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

// 1. Define shared constants OUTSIDE to avoid 'styles' initialization issues
const CORNER_SIZE = 32;
const CORNER_THICKNESS = 2;

export default function BiometricScanOverlay() {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const scanAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );

    Animated.timing(progress, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    }).start();

    const stageTimer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % ANALYSIS_STAGES.length);
    }, 2400);

    scanAnim.start();
    pulseAnim.start();

    return () => {
      scanAnim.stop();
      pulseAnim.stop();
      clearInterval(stageTimer);
    };
  }, []);

  const scanLineTranslateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.62],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const CurrentIcon = ANALYSIS_STAGES[stageIndex].icon;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }], opacity: pulseOpacity }]} />

      <View style={styles.gridOverlay}>
        {[...Array(8)].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 12.5}%` }]} />
        ))}
      </View>

      {/* 2. Merge styles in the prop rather than the StyleSheet object */}
      <View style={[styles.cornerBase, { top: 40, left: 40, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS }]} />
      <View style={[styles.cornerBase, { top: 40, right: 40, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS }]} />
      <View style={[styles.cornerBase, { bottom: 40, left: 40, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS }]} />
      <View style={[styles.cornerBase, { bottom: 40, right: 40, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS }]} />

      <View style={styles.statusPanel}>
        <CurrentIcon size={28} color={Colors.gold} style={{ marginBottom: 10 }} />
        <Text style={styles.mainText}>{ANALYSIS_STAGES[stageIndex].text}</Text>
        <Text style={styles.subText}>{ANALYSIS_STAGES[stageIndex].subtext}</Text>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
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
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.gold,
  },
  cornerBase: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.gold,
  },
  statusPanel: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  mainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subText: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
});
