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

// --- CRITICAL: Styles MUST be defined BEFORE the component function ---
const styles = Stylimport React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, Brain, Microscope, Dna, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOLD = Colors.gold || '#F59E0B';

// --- STYLES AT TOP TO PREVENT INITIALIZATION ERROR ---
const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 999 },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: GOLD },
  cornerBase: { position: 'absolute', width: 32, height: 32, borderColor: GOLD },
  panel: { position: 'absolute', bottom: 80, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textContainer: { alignItems: 'center', marginVertical: 15 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4 },
  progressBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: GOLD },
});

export default function BiometricIntroScan({ onComplete }: { onComplete?: () => void }) {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const progressAnim = Animated.timing(progress, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    });

    progressAnim.start(({ finished }) => {
      if (finished && onComplete) onComplete();
    });

    return () => progressAnim.stop();
  }, [onComplete]);

  // ... (rest of animation logic)

  return (
    <View style={styles.container}>
      {/* ... UI structure using styles above ... */}
    </View>
  );
}