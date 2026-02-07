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

    const iconAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );

    const dotsAnim = Animated.loop(
      Animated.stagger(200, dotAnims.map(anim => 
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ))
    );

    Animated.timing(progress, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    }).start();

    const stageTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(textOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      setStageIndex((prev) => (prev + 1) % ANALYSIS_STAGES.length);
    }, 2400);

    scanAnim.start();
    pulseAnim.start();
    iconAnim.start();
    dotsAnim.start();

    return () => {
      scanAnim.stop();
      pulseAnim.stop();
      iconAnim.stop();
      dotsAnim.stop();
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
        {[...Array(6)].map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 16.7}%` }]} />
        ))}
      </View>

      {/* Brackets now use the fixed styles */}
      <View style={[styles.cornerBase, styles.cornerTL]} />
      <View style={[styles.cornerBase, styles.cornerTR]} />
      <View style={[styles.cornerBase, styles.cornerBL]} />
      <View style={[styles.cornerBase, styles.cornerBR]} />

      <View style={styles.targetEllipse} />

      <View style={styles.statusPanel}>
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: iconScale }] }]}>
          <CurrentIcon size={28} color={Colors.gold} />
        </Animated.View>

        <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
          <View style={styles.textRow}>
            <Text style={styles.mainText}>{ANALYSIS_STAGES[stageIndex].text}</Text>
            <div style={{ flexDirection: 'row', marginLeft: 6 }}>
              {dotAnims.map((anim, i) => (
                <Animated.View key={i} style={[styles.dot, { opacity: anim, marginLeft: 4 }]} />
              ))}
            </div>
          </View>
          <Text style={styles.subText}>{ANALYSIS_STAGES[stageIndex].subtext}</Text>
        </Animated.View>

        <View style={styles.progressSection}>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.stageDots}>
            {ANALYSIS_STAGES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.stageDot,
                  idx <= stageIndex && styles.stageDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// Separate base styles to avoid circular reference
const cornerBase = {
  position: 'absolute' as const,
  width: 32,
  height: 32,
  borderColor: Colors.gold,
};

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
    opacity: 0.11,
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
  cornerBase,
  cornerTL: { top: 40, left: 40, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 40, right: 40, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 40, left: 40, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 40, right: 40, borderBottomWidth: 2, borderRightWidth: 2 },
  targetEllipse: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    marginLeft: -60,
    marginTop: -80,
    width: 120,
    height: 160,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusPanel: {
    position: 'absolute',
    bottom: 64,
    left: 24,
    right: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.28)',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245,158,11,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.38)',
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.gold,
  },
  subText: {
    fontSize: 12,
    color: '#9CA3AF', // Colors.textMuted
    marginTop: 4,
  },
  progressSection: {
    width: '100%',
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  stageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 4,
  },
  stageDotActive: {
    backgroundColor: Colors.gold,
  },
});
