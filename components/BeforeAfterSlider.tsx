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
import Colors from '@/constants/colors';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: number;
  maxWidth?: number;
  isSimulationPending?: boolean;
}

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

  useEffect(() => {
    if (isSimulationPending) {
      setProgress(0);
      
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
        setTimeout(() => setProgress(0), 500);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Image
          key={currentImage}
          source={{ uri: currentImage }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="none"
        />

        <View style={showAfter ? styles.labelAfter : styles.labelBefore}>
          <Text style={showAfter ? styles.labelTextGold : styles.labelText}>
            {showAfter ? 'AFTER' : 'BEFORE'}
          </Text>
        </View>

        {isSameImage && !isSimulationPending && (
          <View style={styles.simulationUnavailable}>
            <Text style={styles.simulationUnavailableText}>AI SIMULATION UNAVAILABLE</Text>
            <Text style={styles.simulationUnavailableSubtext}>Original image shown</Text>
          </View>
        )}

        {isSimulationPending && (
          <>
            <View style={styles.shimmerOverlay}>
              <Animated.View
                style={[
                  styles.shimmerGradient,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(245, 158, 11, 0.15)',
                    'rgba(245, 158, 11, 0.25)',
                    'rgba(245, 158, 11, 0.15)',
                    'transparent',
                  ]}
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
              <Text style={styles.simulationLoadingText}>GENERATING SIMULATION</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            </View>
          </>
        )}
      </View>

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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    alignSelf: 'center',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  labelBefore: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labelAfter: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  labelText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  labelTextGold: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  toggleButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 2,
  },
  toggleButtonTextDisabled: {
    color: Colors.textMuted,
  },
  toggleButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  toggleButtonOutlineText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  simulationUnavailable: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -30 }],
    width: 200,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    zIndex: 20,
  },
  simulationUnavailableText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  simulationUnavailableSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 15,
  },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
    left: '50%',
  },
  shimmerGradientInner: {
    flex: 1,
    width: '100%',
  },
  simulationLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -110 }, { translateY: -55 }],
    width: 220,
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  simulationLoadingText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.gold,
    width: 36,
    textAlign: 'right',
  },
});
