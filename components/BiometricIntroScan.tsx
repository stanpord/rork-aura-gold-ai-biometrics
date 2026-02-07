
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, Brain, Microscope, Dna, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOLD = Colors.gold || '#F59E0B';
const CORNER_SIZE = 32;
const CORNER_THICKNESS = 2;

const ANALYSIS_STAGES = [
  { icon: Microscope, text: 'Analyzing skin texture...', subtext: 'Detecting pore size' },
  { icon: Brain, text: 'Processing facial geometry...', subtext: 'Mapping landmarks' },
  { icon: Dna, text: 'Evaluating aging markers...', subtext: 'Assessing elasticity' },
  { icon: Activity, text: 'Generating treatment plan...', subtext: 'Matching protocols' },
  { icon: Sparkles, text: 'Finalizing Aura Index...', subtext: 'Computing score' },
];

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 999 },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: GOLD },
  cornerBase: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: GOLD },
  panel: { position: 'absolute', bottom: 80, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textContainer: { alignItems: 'center', marginVertical: 15 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4 },
  progressBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: GOLD },
});

// RENAME: Match the call in index.tsx
export default function BiometricIntroScan({ onComplete }: { onComplete?: () => void }) {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );

    const progressAnim = Animated.timing(progress, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    });

    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % ANALYSIS_STAGES.length);
    }, 2400);

    scanLoop.start();
    pulseLoop.start();
    progressAnim.start(({ finished }) => {
      if (finished && onComplete) onComplete();
    });

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
      progressAnim.stop();
      clearInterval(timer);
    };
  }, []);

  const translateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.55],
  });

  const barWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const CurrentIcon = ANALYSIS_STAGES[stageIndex].icon;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }], opacity: pulseOpacity }]} />
      <View style={[styles.cornerBase, { top: 60, left: 40, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS }]} />
      <View style={[styles.cornerBase, { top: 60, right: 40, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS }]} />
      <View style={[styles.cornerBase, { bottom: 60, left: 40, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS }]} />
      <View style={[styles.cornerBase, { bottom: 60, right: 40, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS }]} />
      <View style={styles.panel}>
        <CurrentIcon size={32} color={GOLD} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{ANALYSIS_STAGES[stageIndex].text}</Text>
          <Text style={styles.subtitle}>{ANALYSIS_STAGES[stageIndex].subtext}</Text>
        </View>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}