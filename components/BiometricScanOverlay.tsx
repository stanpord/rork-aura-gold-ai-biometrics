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

// 1. Define shared styles OUTSIDE the StyleSheet to avoid initialization errors
const CORNER_BASE = {
  position: 'absolute' as const,
  width: 32,
  height: 32,
  borderColor: Colors.gold || '#F59E0B',
};

export default function BiometricScanOverlay() {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const dotAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const [stageIndex, setStageIndex] = useState(0);
  const CurrentIcon = ANALYSIS_STAGES[stageIndex].icon;

  useEffect(() => {
    // Scan line animation
    const scanAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );

    // Pulsing effect
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );

    // Progress bar
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

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{ translateY: scanLineTranslateY }],
            opacity: pulseOpacity,
          },
        ]}
      />

      <View style={styles.gridOverlay}>
        {[...Array(8)].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 12.5}%` }]} />
        ))}
      </View>

      {/* Using the array pattern to combine base and specific styles */}
      <View style={[styles.cornerBase, styles.cornerTL]} />
      <View style={[styles.cornerBase, styles.cornerTR]} />
      <View style={[styles.cornerBase, styles.cornerBL]} />
      <View style={[styles.cornerBase, styles.cornerBR]} />

      <View style={styles.targetEllipse} />

      <View style={styles.statusPanel}>
        <View style={styles.iconWrapper}>
          <CurrentIcon size={28} color={Colors.gold || '#F59E0B'} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.mainText}>{ANALYSIS_STAGES[stageIndex].text}</Text>
          <Text style={styles.subText}>{ANALYSIS_STAGES[stageIndex].subtext}</Text>
        </View>

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
    backgroundColor: Colors.gold || '#F59E0B',
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
    backgroundColor: Colors.gold || '#F59E0B',
  },
  cornerBase: CORNER_BASE,
  cornerTL: { top: 40, left: 40, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 40, right: 40, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 40, left: 40, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 40, right: 40, borderBottomWidth: 2, borderRightWidth: 2 },
  targetEllipse: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 280,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderStyle: 'dashed',
  },
  statusPanel: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  iconWrapper: {
    marginBottom: 10,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 15,
  },
  mainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subText: {
    color: '#999',
    fontSize: 12,
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
    backgroundColor: Colors.gold || '#F59E0B',
  },
});
