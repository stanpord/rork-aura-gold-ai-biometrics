import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react-native';
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
  const [sliderPosition, setSliderPosition] = useState(containerWidth / 2);
  const panX = useRef(new Animated.Value(containerWidth / 2)).current;
  const currentSliderPosition = useRef(sliderPosition);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
      const newPosition = width / 2;
      setSliderPosition(newPosition);
      currentSliderPosition.current = newPosition;
      panX.setValue(newPosition);
    }
  }, [containerWidth, panX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panX.setOffset(currentSliderPosition.current);
        panX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = currentSliderPosition.current + gestureState.dx;
        const clampedPosition = Math.max(20, Math.min(containerWidth - 20, newPosition));
        panX.setValue(gestureState.dx);
        setSliderPosition(clampedPosition);
      },
      onPanResponderRelease: () => {
        panX.flattenOffset();
        currentSliderPosition.current = sliderPosition;
      },
    })
  ).current;

  const clampedSliderPosition = Math.max(20, Math.min(containerWidth - 20, sliderPosition));

  return (
    <View style={[styles.container, { height, maxWidth }]} onLayout={onLayout}>
      <View style={styles.imageContainer}>
        <Image
          key={`after-${afterImage}`}
          source={{ uri: afterImage }}
          style={styles.baseImage}
          contentFit="cover"
          cachePolicy="none"
        />
        
        <View
          style={[
            styles.beforeImageContainer,
            { width: clampedSliderPosition },
          ]}
        >
          <View style={[styles.beforeImageWrapper, { width: containerWidth }]}>
            <Image
              key={`before-${beforeImage}`}
              source={{ uri: beforeImage }}
              style={styles.beforeImage}
              contentFit="cover"
              cachePolicy="none"
            />
          </View>
        </View>

        <View style={styles.labelBefore}>
          <Text style={styles.labelText}>BEFORE</Text>
        </View>
        <View style={styles.labelAfter}>
          <Text style={styles.labelTextGold}>AFTER</Text>
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

        <Animated.View
          style={[
            styles.sliderLine,
            { left: clampedSliderPosition - 1 },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sliderLineInner} />
          <View style={styles.sliderHandle}>
            <View style={styles.sliderHandleInner}>
              <ChevronLeft size={14} color={Colors.black} style={styles.chevronLeft} />
              <View style={styles.gripContainer}>
                <GripVertical size={16} color={Colors.black} />
              </View>
              <ChevronRight size={14} color={Colors.black} style={styles.chevronRight} />
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          ← Drag to compare →
        </Text>
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
  baseImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  beforeImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 2,
  },
  beforeImageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
  },
  beforeImage: {
    width: '100%',
    height: '100%',
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 44,
    marginLeft: -22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sliderLineInner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  sliderHandle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderHandleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gripContainer: {
    marginHorizontal: -4,
  },
  chevronLeft: {
    marginRight: -6,
  },
  chevronRight: {
    marginLeft: -6,
  },
  labelBefore: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labelAfter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
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
  instructionContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    letterSpacing: 1,
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
