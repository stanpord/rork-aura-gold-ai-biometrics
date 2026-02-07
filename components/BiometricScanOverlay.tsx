import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, Brain, Microscope, Dna, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ANALYSIS_STAGES = [
  { icon: Microscope, text: 'Analyzing skin texture...', subtext: 'Detecting pore size' },
  { icon: Brain, text: 'Processing facial geometry...', subtext: 'Mapping landmarks' },
  { icon: Dna, text: 'Evaluating aging markers...', subtext: 'Assessing elasticity' },
  { icon: Activity, text: 'Generating treatment plan...', subtext: 'Matching protocols' },
  { icon: Sparkles, text: 'Finalizing Aura Index...', subtext: 'Computing score' },
];

// CRITICAL: Define shared constants OUTSIDE the StyleSheet
const CORNER_SIZE = 32;
const CORNER_BORDER = 2;
const GOLD = Colors.gold || '#F59E0B';

export default function BiometricScanOverlay() {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    // 1. Scan Line Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // 2. Pulse Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // 3. Progress Bar (12 seconds)
    Animated.timing(progress, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    }).start();

    // 4. Stage Cycling
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % ANALYSIS_STAGES.length);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  const translateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.5],
  });

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const CurrentIcon = ANALYSIS_STAGES[stageIndex].icon;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Moving Scan Line */}
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }], opacity: pulseOpacity }]} />

      {/* Grid Background */}
      <View style={styles.gridOverlay}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: `${(i + 1) * 15}%` }]} />
        ))}
      </View>

      {/* Frame Corners */}
      <View style={[styles.corner, { top: 60, left: 40, borderTopWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER }]} />
      <View style={[styles.corner, { top: 60, right: 40, borderTopWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER }]} />
      <View style={[styles.corner, { bottom: 60, left: 40, borderBottomWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER }]} />
      <View style={[styles.corner, { bottom: 60, right: 40, borderBottomWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER }]} />

      {/* Status Panel */}
      <View style={styles.panel}>
        <CurrentIcon size={32} color={GOLD} strokeWidth={1.5} />
        <Text style={styles.title}>{ANALYSIS_STAGES[stageIndex].text}</Text>
        <Text style={styles.subtitle}>{ANALYSIS_STAGES[stageIndex].subtext}</Text>
        
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  gridLine: { position: 'absolute', width: '100%', height: 1, backgroundColor: GOLD },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: GOLD },
  panel: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    width: '85%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#999', fontSize: 13, marginTop: 4 },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: GOLD },
});
