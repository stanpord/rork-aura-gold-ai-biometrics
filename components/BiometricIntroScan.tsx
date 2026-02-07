import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, Brain, Microscope, Dna, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 1. Move ALL configuration constants to the very top
const GOLD = Colors.gold || '#F59E0B';
const CORNER_SIZE = 32;
const BORDER_W = 2;

const ANALYSIS_STAGES = [
  { icon: Microscope, text: 'Analyzing skin texture...', subtext: 'Detecting pore size' },
  { icon: Brain, text: 'Processing facial geometry...', subtext: 'Mapping landmarks' },
  { icon: Dna, text: 'Evaluating aging markers...', subtext: 'Assessing elasticity' },
  { icon: Activity, text: 'Generating treatment plan...', subtext: 'Matching protocols' },
  { icon: Sparkles, text: 'Finalizing Aura Index...', subtext: 'Computing score' },
];



export default function BiometricScanOverlay() {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    // Animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(progress, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % ANALYSIS_STAGES.length);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  const translateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.5],
  });

  const barWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const CurrentIcon = ANALYSIS_STAGES[stageIndex].icon;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }], opacity: pulseOpacity }]} />

      {/* Frame Corners - Handled by combining styles in the array */}
      <View style={[styles.baseCorner, styles.topL]} />
      <View style={[styles.baseCorner, styles.topR]} />
      <View style={[styles.baseCorner, styles.botL]} />
      <View style={[styles.baseCorner, styles.botR]} />

      <View style={styles.panel}>
        <CurrentIcon size={32} color={GOLD} />
        <Text style={styles.title}>{ANALYSIS_STAGES[stageIndex].text}</Text>
        <Text style={styles.subtitle}>{ANALYSIS_STAGES[stageIndex].subtext}</Text>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}

// 2. The Stylesheet: Notice there are NO '...styles.xxx' spreads here!
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: GOLD,
  },
  baseCorner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: GOLD,
  },
  topL: { top: 60, left: 40, borderTopWidth: BORDER_W, borderLeftWidth: BORDER_W },
  topR: { top: 60, right: 40, borderTopWidth: BORDER_W, borderRightWidth: BORDER_W },
  botL: { bottom: 60, left: 40, borderBottomWidth: BORDER_W, borderLeftWidth: BORDER_W },
  botR: { bottom: 60, right: 40, borderBottomWidth: BORDER_W, borderRightWidth: BORDER_W },
  panel: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    right: 30,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 5 },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
  },
});
