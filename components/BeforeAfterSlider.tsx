import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
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
          <View style={styles.simulationLoading}>
            <Text style={styles.simulationLoadingText}>GENERATING SIMULATION...</Text>
          </View>
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
  simulationLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -90 }, { translateY: -20 }],
    width: 180,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    zIndex: 20,
  },
  simulationLoadingText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
