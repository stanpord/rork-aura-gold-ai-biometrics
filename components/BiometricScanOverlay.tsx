import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ScrollView } from 'react-native';
import { Sparkles, Brain, Microscope, Dna, Activity, Check, Loader } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BIOMARKERS = [
  { id: 'elasticity', name: 'Skin Elasticity', unit: '%', range: [65, 95] },
  { id: 'collagen', name: 'Collagen Density', unit: 'mg/cm²', range: [1.2, 2.8] },
  { id: 'hydration', name: 'Hydration Level', unit: '%', range: [45, 85] },
  { id: 'poreSize', name: 'Pore Size Index', unit: 'µm', range: [20, 60] },
  { id: 'fineLines', name: 'Fine Line Depth', unit: 'mm', range: [0.1, 0.8] },
  { id: 'pigmentation', name: 'Pigmentation Score', unit: '', range: [1, 10] },
  { id: 'volumeLoss', name: 'Volume Deficit', unit: 'ml', range: [0.5, 4.5] },
  { id: 'symmetry', name: 'Facial Symmetry', unit: '%', range: [85, 99] },
  { id: 'texture', name: 'Texture Uniformity', unit: '', range: [4, 9] },
  { id: 'radiance', name: 'Skin Radiance', unit: 'cd/m²', range: [15, 45] },
  { id: 'wrinkleDepth', name: 'Wrinkle Severity', unit: 'grade', range: [1, 5] },
  { id: 'melanin', name: 'Melanin Index', unit: 'MI', range: [10, 50] },
];

const ANALYSIS_STAGES = [
  { icon: Microscope, text: 'Analyzing skin texture...', subtext: 'Detecting pore size and surface quality' },
  { icon: Brain, text: 'Processing facial geometry...', subtext: 'Mapping structural landmarks' },
  { icon: Dna, text: 'Evaluating aging markers...', subtext: 'Assessing volume and elasticity' },
  { icon: Activity, text: 'Generating treatment plan...', subtext: 'Matching clinical protocols' },
  { icon: Sparkles, text: 'Finalizing your Aura Index...', subtext: 'Computing personalized score' },
];

interface BiomarkerReading {
  id: string;
  name: string;
  value: number | null;
  unit: string;
  status: 'pending' | 'scanning' | 'complete';
}

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
  const [biomarkerReadings, setBiomarkerReadings] = useState<BiomarkerReading[]>(
    BIOMARKERS.map(b => ({ id: b.id, name: b.name, value: null, unit: b.unit, status: 'pending' as const }))
  );
  const [activeBiomarkerIndex, setActiveBiomarkerIndex] = useState(0);
  const biomarkerAnims = useRef(BIOMARKERS.map(() => new Animated.Value(0))).current;

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

    const biomarkerInterval = setInterval(() => {
      setActiveBiomarkerIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= BIOMARKERS.length) {
          clearInterval(biomarkerInterval);
          return prev;
        }
        return nextIndex;
      });
    }, 900);

    return () => {
      scanAnimation.stop();
      pulseAnimation.stop();
      iconPulse.stop();
      dotsAnimation.stop();
      clearInterval(stageInterval);
      clearInterval(biomarkerInterval);
    };
  }, [scanLinePosition, pulseAnim, textFadeAnim, iconScaleAnim, progressAnim, dotAnim1, dotAnim2, dotAnim3]);

  useEffect(() => {
    if (activeBiomarkerIndex < BIOMARKERS.length) {
      setBiomarkerReadings(prev => prev.map((b, i) => {
        if (i === activeBiomarkerIndex) {
          return { ...b, status: 'scanning' };
        }
        return b;
      }));

      Animated.timing(biomarkerAnims[activeBiomarkerIndex], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      const completeTimeout = setTimeout(() => {
        const biomarker = BIOMARKERS[activeBiomarkerIndex];
        const randomValue = biomarker.range[0] + Math.random() * (biomarker.range[1] - biomarker.range[0]);
        const formattedValue = biomarker.unit === '%' || biomarker.unit === '' || biomarker.unit === 'grade' || biomarker.unit === 'MI'
          ? Math.round(randomValue)
          : parseFloat(randomValue.toFixed(2));
        
        setBiomarkerReadings(prev => prev.map((b, i) => {
          if (i === activeBiomarkerIndex) {
            return { ...b, value: formattedValue, status: 'complete' };
          }
          return b;
        }));
      }, 700);

      return () => clearTimeout(completeTimeout);
    }
  }, [activeBiomarkerIndex, biomarkerAnims]);

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

      {/* Biomarkers Panel */}
      <View style={styles.biomarkersPanel}>
        <View style={styles.biomarkerHeader}>
          <Dna size={14} color={Colors.gold} />
          <Text style={styles.biomarkerTitle}>BIOMARKERS DETECTED</Text>
        </View>
        <ScrollView 
          style={styles.biomarkersList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.biomarkersListContent}
        >
          {biomarkerReadings.map((reading, index) => (
            <Animated.View
              key={reading.id}
              style={[
                styles.biomarkerRow,
                {
                  opacity: biomarkerAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [{
                    translateX: biomarkerAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.biomarkerLeft}>
                {reading.status === 'complete' ? (
                  <View style={styles.biomarkerCheckIcon}>
                    <Check size={10} color={Colors.success} />
                  </View>
                ) : reading.status === 'scanning' ? (
                  <View style={styles.biomarkerScanningIcon}>
                    <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({ inputRange: [0.3, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                      <Loader size={10} color={Colors.gold} />
                    </Animated.View>
                  </View>
                ) : (
                  <View style={styles.biomarkerPendingIcon} />
                )}
                <Text style={[
                  styles.biomarkerName,
                  reading.status === 'complete' && styles.biomarkerNameComplete,
                  reading.status === 'scanning' && styles.biomarkerNameScanning,
                ]}>
                  {reading.name}
                </Text>
              </View>
              <View style={styles.biomarkerRight}>
                {reading.status === 'complete' && reading.value !== null ? (
                  <Text style={styles.biomarkerValue}>
                    {reading.value}{reading.unit ? ` ${reading.unit}` : ''}
                  </Text>
                ) : reading.status === 'scanning' ? (
                  <Text style={styles.biomarkerScanning}>scanning...</Text>
                ) : (
                  <Text style={styles.biomarkerPending}>—</Text>
                )}
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
      
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
  biomarkersPanel: {
    position: 'absolute',
    top: 50,
    right: 12,
    width: 180,
    maxHeight: SCREEN_HEIGHT * 0.45,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    overflow: 'hidden',
  },
  biomarkerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  biomarkerTitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  biomarkersList: {
    maxHeight: SCREEN_HEIGHT * 0.38,
  },
  biomarkersListContent: {
    paddingVertical: 6,
  },
  biomarkerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  biomarkerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  biomarkerCheckIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biomarkerScanningIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biomarkerPendingIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  biomarkerName: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    flex: 1,
  },
  biomarkerNameComplete: {
    color: Colors.white,
  },
  biomarkerNameScanning: {
    color: Colors.gold,
  },
  biomarkerRight: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  biomarkerValue: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
    fontVariant: ['tabular-nums'],
  },
  biomarkerScanning: {
    fontSize: 8,
    color: Colors.gold,
    fontStyle: 'italic' as const,
  },
  biomarkerPending: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
  },
});
