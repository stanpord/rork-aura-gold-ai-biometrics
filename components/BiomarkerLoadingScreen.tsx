import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

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
const isSmallScreen = SCREEN_HEIGHT < 700;
const isVerySmallScreen = SCREEN_HEIGHT < 600;
const isTablet = SCREEN_WIDTH >= 768;
const isLargeTablet = SCREEN_WIDTH >= 1024;
const COLUMNS = isLargeTablet ? 5 : isTablet ? 4 : 3;

interface BiomarkerLoadingScreenProps {
  onComplete?: () => void;
}

export default function BiomarkerLoadingScreen({ onComplete }: BiomarkerLoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnims = useRef(BIOMARKERS.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const [activeBiomarker, setActiveBiomarker] = useState(0);

  useEffect(() => {
    console.log('[BiomarkerLoadingScreen] Starting biomarker animation sequence');
    const staggerDelay = 350;
    const animations = fadeAnims.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    );

    Animated.stagger(staggerDelay, animations).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const interval = setInterval(() => {
      setActiveBiomarker((prev) => {
        const next = (prev + 1) % BIOMARKERS.length;
        if (next === 0) {
          console.log('[BiomarkerLoadingScreen] Completed full biomarker cycle');
        }
        return next;
      });
    }, 350);

    const completionTimer = setTimeout(() => {
      console.log('[BiomarkerLoadingScreen] Animation complete, triggering onComplete');
      if (onComplete) {
        onComplete();
      }
    }, BIOMARKERS.length * staggerDelay + 1500);

    return () => {
      console.log('[BiomarkerLoadingScreen] Cleaning up animations');
      clearInterval(interval);
      clearTimeout(completionTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fadeAnims, pulseAnim]);

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

      <View style={[styles.content, { paddingTop: insets.top + (isVerySmallScreen ? 6 : isSmallScreen ? 10 : 20), paddingBottom: insets.bottom + (isVerySmallScreen ? 6 : isSmallScreen ? 10 : 20) }]}>
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
          
          <ScrollView 
            style={styles.biomarkersScrollView}
            contentContainerStyle={styles.biomarkersGrid}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {renderBiomarkerGrid()}
          </ScrollView>
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
            <Text style={styles.scanningText}>Initializing</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    zIndex: 100,
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
    paddingHorizontal: isTablet ? 40 : isVerySmallScreen ? 12 : 16,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 8,
  },
  logoContainer: {
    width: isTablet ? 64 : isSmallScreen ? 36 : 48,
    height: isTablet ? 64 : isSmallScreen ? 36 : 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet ? 12 : isSmallScreen ? 4 : 8,
  },
  logoRing: {
    position: 'absolute',
    width: isTablet ? 64 : isSmallScreen ? 36 : 48,
    height: isTablet ? 64 : isSmallScreen ? 36 : 48,
    borderRadius: isTablet ? 32 : isSmallScreen ? 18 : 24,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  logoInner: {
    width: isTablet ? 48 : isSmallScreen ? 28 : 36,
    height: isTablet ? 48 : isSmallScreen ? 28 : 36,
    borderRadius: isTablet ? 24 : isSmallScreen ? 14 : 18,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: isTablet ? 24 : isSmallScreen ? 14 : 18,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  title: {
    fontSize: isTablet ? 28 : isSmallScreen ? 14 : 18,
    fontWeight: '200' as const,
    color: Colors.white,
    letterSpacing: isTablet ? 8 : 5,
    marginBottom: isTablet ? 8 : isSmallScreen ? 2 : 4,
  },
  subtitle: {
    fontSize: isTablet ? 12 : isSmallScreen ? 8 : 9,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: isTablet ? 3 : 2,
    textTransform: 'uppercase' as const,
  },
  biomarkersSection: {
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    paddingTop: isVerySmallScreen ? 2 : isSmallScreen ? 4 : 8,
    paddingBottom: 0,
    marginBottom: 4,
  },
  biomarkersScrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    maxWidth: isTablet ? 100 : 60,
  },
  sectionTitle: {
    fontSize: isTablet ? 14 : 9,
    fontWeight: '600' as const,
    color: Colors.gold,
    letterSpacing: isTablet ? 6 : 4,
  },
  biomarkersGrid: {
    gap: isTablet ? 10 : isVerySmallScreen ? 2 : isSmallScreen ? 3 : 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isTablet ? 10 : isVerySmallScreen ? 2 : isSmallScreen ? 3 : 4,
  },
  biomarkerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: isTablet ? 8 : 5,
    paddingHorizontal: isTablet ? 12 : isVerySmallScreen ? 3 : isSmallScreen ? 4 : 6,
    paddingVertical: isTablet ? 10 : isVerySmallScreen ? 2 : isSmallScreen ? 3 : 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    minWidth: isLargeTablet ? (SCREEN_WIDTH - 100) / 5 : isTablet ? (SCREEN_WIDTH - 80) / 4 : (SCREEN_WIDTH - 40) / 3,
    maxWidth: isLargeTablet ? (SCREEN_WIDTH - 100) / 5 : isTablet ? (SCREEN_WIDTH - 80) / 4 : (SCREEN_WIDTH - 40) / 3,
  },
  biomarkerItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  biomarkerDot: {
    width: isTablet ? 6 : isVerySmallScreen ? 2 : isSmallScreen ? 3 : 4,
    height: isTablet ? 6 : isVerySmallScreen ? 2 : isSmallScreen ? 3 : 4,
    borderRadius: isTablet ? 3 : 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: isTablet ? 10 : isVerySmallScreen ? 3 : isSmallScreen ? 4 : 6,
  },
  biomarkerDotActive: {
    backgroundColor: Colors.gold,
  },
  biomarkerText: {
    fontSize: isTablet ? 13 : isVerySmallScreen ? 6 : isSmallScreen ? 7 : 8,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: isTablet ? 0.5 : 0.2,
    flex: 1,
  },
  biomarkerTextActive: {
    color: Colors.gold,
    fontWeight: '600' as const,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: isVerySmallScreen ? 4 : 6,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanningDot: {
    width: isTablet ? 10 : isVerySmallScreen ? 6 : 7,
    height: isTablet ? 10 : isVerySmallScreen ? 6 : 7,
    borderRadius: isTablet ? 5 : isVerySmallScreen ? 3 : 3.5,
    backgroundColor: Colors.gold,
  },
  scanningText: {
    fontSize: isTablet ? 14 : isVerySmallScreen ? 8 : 9,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: isTablet ? 2 : 1,
  },
});
