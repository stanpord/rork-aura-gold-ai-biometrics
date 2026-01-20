import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

const WOMAN_IMAGE = 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800';

const BIOMARKERS = [
  'Skin Texture', 'Pore Size', 'Wrinkle Depth', 'Fine Lines', 'Elasticity',
  'Hydration Level', 'Collagen Density', 'Pigmentation', 'Sun Damage', 'Erythema',
  'Vascular Patterns', 'Dark Circles', 'Periorbital Volume', 'Crow\'s Feet', 'Forehead Lines',
  'Glabellar Lines', 'Nasolabial Folds', 'Marionette Lines', 'Lip Volume', 'Lip Symmetry',
  'Cheek Volume', 'Temple Hollowing', 'Jawline Definition', 'Chin Projection', 'Facial Symmetry',
  'Golden Ratio', 'Skin Luminosity', 'Sebum Production', 'Dehydration Lines', 'Age Spots',
  'Melasma Patterns', 'Brow Position', 'Eyelid Laxity', 'Tear Troughs', 'Malar Fat Pad',
  'Submalar Hollows', 'Jowl Formation', 'Platysmal Bands', 'Neck Laxity', 'Skin Tone',
  'Capillary Health', 'Acne Scarring', 'Pore Congestion', 'Fitzpatrick Type', 'Melanin Density',
  'Bone Structure', 'Tissue Integrity',
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMNS = 3;
const BIOMARKER_PHASE_DURATION = 5000;
const SCANNING_PHASE_DURATION = 4000;
const TOTAL_DURATION = BIOMARKER_PHASE_DURATION + SCANNING_PHASE_DURATION;

interface Props {
  onComplete?: () => void;
}

export default function BiomarkerLoadingScreen({ onComplete }: Props) {
  const fadeAnims = useRef(BIOMARKERS.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const [activeBiomarker, setActiveBiomarker] = useState(0);
  const [phase, setPhase] = useState<'biomarkers' | 'scanning'>('biomarkers');
  
  const phaseTransitionAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanPulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Image.prefetch(WOMAN_IMAGE).catch(() => {});
  }, []);

  useEffect(() => {
    const staggerDelay = 40;
    const animations = fadeAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * staggerDelay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(staggerDelay, animations).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const interval = setInterval(() => {
      setActiveBiomarker((prev) => (prev + 1) % BIOMARKERS.length);
    }, 80);

    const phaseTimeout = setTimeout(() => {
      Animated.timing(phaseTransitionAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setPhase('scanning');
        Animated.timing(phaseTransitionAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, BIOMARKER_PHASE_DURATION);

    const completeTimeout = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, TOTAL_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(phaseTimeout);
      clearTimeout(completeTimeout);
    };
  }, []);

  useEffect(() => {
    if (phase === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanPulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scanPulseAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [phase]);

  const renderBiomarkerGrid = () => {
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < BIOMARKERS.length; i += COLUMNS) {
      const rowItems = BIOMARKERS.slice(i, i + COLUMNS);
      rows.push(
        <View key={i} style={styles.row}>
          {rowItems.map((biomarker, index) => {
            const actualIndex = i + index;
            const isActive = actualIndex === activeBiomarker;
            return (
              <Animated.View
                key={biomarker}
                style={[
                  styles.biomarkerItem,
                  {
                    opacity: fadeAnims[actualIndex],
                    transform: [
                      {
                        scale: fadeAnims[actualIndex].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                  isActive && styles.biomarkerItemActive,
                ]}
              >
                <View style={[styles.biomarkerDot, isActive && styles.biomarkerDotActive]} />
                <Text
                  style={[styles.biomarkerText, isActive && styles.biomarkerTextActive]}
                  numberOfLines={1}
                >
                  {biomarker}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  

  const renderScanningPhase = () => {
    const scanLineTranslate = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, SCREEN_HEIGHT + 100],
    });

    return (
      <Animated.View style={[styles.scanningPhase, { opacity: phaseTransitionAnim }]}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: WOMAN_IMAGE }}
            style={styles.backgroundImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.3)', 'transparent', 'rgba(0, 0, 0, 0.5)']}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanLineTranslate }],
                opacity: glowAnim,
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', '#00CED1', '#00FFFF', '#00CED1', 'transparent']}
              style={styles.scanLineGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
            <View style={styles.scanLineGlow} />
          </Animated.View>

          <Animated.View
            style={[
              styles.gridOverlay,
              { opacity: scanPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.3] }) },
            ]}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 11}%` }]} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 14}%` }]} />
            ))}
          </Animated.View>

          <View style={styles.cornerMarkers}>
            <View style={[styles.cornerMarker, styles.topLeft]} />
            <View style={[styles.cornerMarker, styles.topRight]} />
            <View style={[styles.cornerMarker, styles.bottomLeft]} />
            <View style={[styles.cornerMarker, styles.bottomRight]} />
          </View>

          <View style={styles.facePoints}>
            <Animated.View style={[styles.facePoint, styles.facePointForehead, { opacity: glowAnim }]} />
            <Animated.View style={[styles.facePoint, styles.facePointLeftCheek, { opacity: glowAnim }]} />
            <Animated.View style={[styles.facePoint, styles.facePointRightCheek, { opacity: glowAnim }]} />
            <Animated.View style={[styles.facePoint, styles.facePointNose, { opacity: glowAnim }]} />
            <Animated.View style={[styles.facePoint, styles.facePointChin, { opacity: glowAnim }]} />
            <Animated.View style={[styles.facePoint, styles.facePointLeftEye, { opacity: glowAnim }]} />
            <Animated.View style={[styles.facePoint, styles.facePointRightEye, { opacity: glowAnim }]} />
          </View>
        </View>

        <View style={styles.scanningFooter}>
          <View style={styles.scanningHeader}>
            <Text style={styles.scanningTitle}>ANALYZING BIOMARKERS</Text>
            <Text style={styles.scanningSubtitle}>Real-time facial mapping in progress</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: scanPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['60%', '90%'],
                  }),
                },
              ]} 
            />
          </View>

          <View style={styles.biomarkerPreview}>
            <Text style={styles.biomarkerPreviewLabel}>Currently Scanning:</Text>
            <Text style={styles.biomarkerPreviewValue}>{BIOMARKERS[activeBiomarker]}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (phase === 'scanning') {
    return (
      <View style={styles.container}>
        {renderScanningPhase()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050505', '#0a0808', '#050505']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.topAccent}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Animated.View style={[styles.content, { opacity: phaseTransitionAnim }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.logoRing, { opacity: pulseAnim }]} />
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>A</Text>
            </View>
          </View>
          <Text style={styles.title}>AURA GOLD</Text>
          <Text style={styles.subtitle}>Biometric Analysis Engine</Text>
        </View>

        <View style={styles.biomarkersSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>47 BIOMARKERS</Text>
            <View style={styles.sectionLine} />
          </View>
          
          <View style={styles.biomarkersGrid}>
            {renderBiomarkerGrid()}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.scanningIndicator}>
            <Animated.View 
              style={[
                styles.scanningDot, 
                { 
                  opacity: pulseAnim,
                  transform: [{ scale: pulseAnim }] 
                }
              ]} 
            />
            <Text style={styles.scanningText}>Initializing Analysis Engine</Text>
          </View>
          <Text style={styles.tagline}>Advanced Regenerative Aesthetics</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '200' as const,
    color: Colors.white,
    letterSpacing: 8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  biomarkersSection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    maxWidth: 60,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.gold,
    letterSpacing: 4,
  },
  biomarkersGrid: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  biomarkerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    minWidth: (SCREEN_WIDTH - 60) / 3,
    maxWidth: (SCREEN_WIDTH - 60) / 3,
  },
  biomarkerItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  biomarkerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 6,
  },
  biomarkerDotActive: {
    backgroundColor: Colors.gold,
  },
  biomarkerText: {
    fontSize: 8,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.3,
    flex: 1,
  },
  biomarkerTextActive: {
    color: Colors.gold,
    fontWeight: '600' as const,
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  scanningText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  scanningPhase: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  scanLineGradient: {
    flex: 1,
    height: 3,
  },
  scanLineGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -15,
    height: 35,
    backgroundColor: 'rgba(0, 255, 255, 0.08)',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(0, 206, 209, 0.25)',
  },
  gridLineV: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    width: 1,
    backgroundColor: 'rgba(0, 206, 209, 0.25)',
  },
  cornerMarkers: {
    ...StyleSheet.absoluteFillObject,
  },
  cornerMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00FFFF',
  },
  topLeft: {
    top: 40,
    left: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 40,
    right: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 40,
    left: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 40,
    right: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  facePoints: {
    ...StyleSheet.absoluteFillObject,
  },
  facePoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  facePointForehead: {
    top: '22%',
    left: '48%',
  },
  facePointLeftCheek: {
    top: '42%',
    left: '32%',
  },
  facePointRightCheek: {
    top: '42%',
    right: '32%',
  },
  facePointNose: {
    top: '38%',
    left: '47%',
  },
  facePointChin: {
    top: '55%',
    left: '47%',
  },
  facePointLeftEye: {
    top: '30%',
    left: '38%',
  },
  facePointRightEye: {
    top: '30%',
    right: '38%',
  },
  scanningFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 206, 209, 0.3)',
  },
  scanningHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scanningTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#00FFFF',
    letterSpacing: 4,
    marginBottom: 6,
  },
  scanningSubtitle: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 206, 209, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00FFFF',
    borderRadius: 2,
  },
  biomarkerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  biomarkerPreviewLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
  },
  biomarkerPreviewValue: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#00FFFF',
    letterSpacing: 0.5,
  },
});
