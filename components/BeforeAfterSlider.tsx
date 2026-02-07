import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  LayoutChangeEvent,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Sparkles, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// --- CONSTANTS (Usually in @/constants/colors) ---
const Colors = {
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  goldDark: '#D97706',
  surface: '#1E293B',
  black: '#000000',
  white: '#FFFFFF',
  textMuted: '#94A3B8',
};

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: number;
  maxWidth?: number;
  isSimulationPending?: boolean;
}

/**
 * BEFORE AFTER SLIDER COMPONENT
 * Handles the visual transition between original and AI-simulated results.
 */
export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  height = 400,
  maxWidth = 500,
  isSimulationPending = false,
}: BeforeAfterSliderProps) {
  const isSameImage = beforeImage === afterImage;
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(Math.min(windowWidth - 40, maxWidth));
  const [showAfter, setShowAfter] = useState(false);
  const [progress, setProgress] = useState(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- ANIMATION LOGIC ---
  useEffect(() => {
    if (isSimulationPending) {
      setProgress(0);
      setShowAfter(false); // Reset to before view during generation
      
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();

      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 85 ? 1 : 0.5;
          return Math.min(prev + increment, 95);
        });
      }, 200);
    } else {
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (progress > 0 && progress < 100) {
        setProgress(100);
        // Delay clearing progress so the user sees "100%" briefly
        setTimeout(() => setProgress(0), 800);
      }
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isSimulationPending]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
    }
  }, [containerWidth]);

  const handleToggle = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAfter(prev => !prev);
  }, []);

  const currentImage = showAfter ? afterImage : beforeImage;
  const canShowAfter = !isSameImage && !isSimulationPending;

  return (
    <View style={[styles.container, { height, maxWidth }]} onLayout={onLayout}>
      <View style={styles.imageContainer}>
        {/* Main Image View */}
        <Image
          key={currentImage}
          source={{ uri: currentImage }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="none"
          transition={400} // Smooth crossfade on image swap
        />

        {/* Labels */}
        {!isSimulationPending && (
          <View style={showAfter ? styles.labelAfter : styles.labelBefore}>
            <Text style={showAfter ? styles.labelTextGold : styles.labelText}>
              {showAfter ? 'AI SIMULATION' : 'BEFORE'}
            </Text>
          </View>
        )}

        {/* Simulation Processing Overlay */}
        {isSimulationPending && (
          <>
            <View style={styles.shimmerOverlay}>
              <Animated.View
                style={[
                  styles.shimmerGradient,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(245,158,11,0.15)', 'rgba(245,158,11,0.25)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmerGradientInner}
                />
              </Animated.View>
            </View>
            
            <View style={styles.simulationLoading}>
              <View style={styles.loadingIconContainer}>
                <Sparkles size={20} color={Colors.gold} />
              </View>
              <Text style={styles.simulationLoadingText}>MAPPING FACIAL STRUCTURE</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            </View>
          </>
        )}

        {/* Unavailable State */}
        {isSameImage && !isSimulationPending && progress === 0 && (
          <View style={styles.simulationUnavailable}>
            <Text style={styles.simulationUnavailableText}>AI SIMULATION READY</Text>
            <Text style={styles.simulationUnavailableSubtext}>Tap button to analyze</Text>
          </View>
        )}
      </View>

      {/* Control Button */}
      <View style={styles.buttonContainer}>
        {!showAfter ? (
          <TouchableOpacity
            style={[styles.toggleButton, !canShowAfter && styles.toggleButtonDisabled]}
            onPress={handleToggle}
            activeOpacity={0.8}
            disabled={!canShowAfter}
          >
            <Sparkles size={16} color={canShowAfter ? Colors.black : Colors.textMuted} />
            <Text style={[styles.toggleButtonText, !canShowAfter && styles.toggleButtonTextDisabled]}>
              {isSimulationPending ? 'GENERATING...' : 'SEE POTENTIAL'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.toggleButtonOutline}
            onPress={handleToggle}
            activeOpacity={0.8}
          >
            <RotateCcw size={16} color={Colors.gold} />
            <Text style={styles.toggleButtonOutlineText}>VIEW ORIGINAL</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: 32, overflow: 'hidden', backgroundColor: '#1E293B', alignSelf: 'center' },
  imageContainer: { flex: 1, position: 'relative', overflow: 'hidden' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  labelBefore: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  labelAfter: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.gold },
  labelText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  labelTextGold: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  buttonContainer: { position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center' },
  toggleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.gold, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  toggleButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  toggleButtonText: { fontSize: 13, fontWeight: '900', color: Colors.black, letterSpacing: 1 },
  toggleButtonTextDisabled: { color: Colors.textMuted },
  toggleButtonOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30, borderWidth: 1, borderColor: Colors.gold },
  toggleButtonOutlineText: { fontSize: 13, fontWeight: '900', color: Colors.gold, letterSpacing: 1 },
  shimmerOverlay: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: 10 },
  shimmerGradient: { position: 'absolute', top: 0, bottom: 0, width: 250, left: '50%' },
  shimmerGradientInner: { flex: 1, width: '100%' },
  simulationLoading: { position: 'absolute', top: '40%', left: '10%', right: '10%', backgroundColor: 'rgba(0,0,0,0.9)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', alignItems: 'center', zIndex: 20 },
  loadingIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  simulationLoadingText: { fontSize: 11, fontWeight: '800', color: Colors.gold, letterSpacing: 1.5, marginBottom: 16 },
  progressContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  progressText: { fontSize: 12, fontWeight: '700', color: Colors.gold, width: 35 },
  simulationUnavailable: { position: 'absolute', bottom: 100, left: '10%', right: '10%', backgroundColor: 'rgba(0,0,0,0.7)', padding: 16, borderRadius: 16, alignItems: 'center' },
  simulationUnavailableText: { fontSize: 12, fontWeight: '800', color: Colors.gold, marginBottom: 4 },
  simulationUnavailableSubtext: { fontSize: 12, color: '#FFF', opacity: 0.8 }
});
