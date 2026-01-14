import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  useWindowDimensions,
  LayoutChangeEvent,
  ImageBackground,
} from 'react-native';
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: number;
  maxWidth?: number;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  height = 400,
  maxWidth = 500,
}: BeforeAfterSliderProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(Math.min(windowWidth - 40, maxWidth));
  const [sliderPosition, setSliderPosition] = useState(containerWidth / 2);
  const currentSliderPosition = useRef(containerWidth / 2);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    setImageKey(prev => prev + 1);
  }, [beforeImage, afterImage]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
      const newPosition = width / 2;
      setSliderPosition(newPosition);
      currentSliderPosition.current = newPosition;
    }
  }, [containerWidth]);

  const containerWidthRef = useRef(containerWidth);
  containerWidthRef.current = containerWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2;
      },
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const width = containerWidthRef.current;
        const newPosition = currentSliderPosition.current + gestureState.dx;
        const clampedPosition = Math.max(0, Math.min(width, newPosition));
        setSliderPosition(clampedPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        const width = containerWidthRef.current;
        const newPosition = currentSliderPosition.current + gestureState.dx;
        const clampedPosition = Math.max(0, Math.min(width, newPosition));
        currentSliderPosition.current = clampedPosition;
      },
    })
  ).current;

  const clampedSliderPosition = Math.max(0, Math.min(containerWidth, sliderPosition));

  return (
    <View style={[styles.container, { height, maxWidth }]} onLayout={onLayout}>
      <View style={styles.imageContainer}>
        <ImageBackground
          key={`after-${imageKey}`}
          source={{ uri: afterImage }}
          style={styles.baseImage}
          resizeMode="cover"
        >
          {clampedSliderPosition > 0 && (
            <View
              style={[
                styles.beforeImageContainer,
                { width: clampedSliderPosition },
              ]}
            >
              <ImageBackground
                key={`before-${imageKey}`}
                source={{ uri: beforeImage }}
                style={[styles.beforeImage, { width: containerWidth, height }]}
                resizeMode="cover"
              />
            </View>
          )}

          {clampedSliderPosition > 40 && (
            <View style={styles.labelBefore}>
              <Text style={styles.labelText}>BEFORE</Text>
            </View>
          )}
          {clampedSliderPosition < containerWidth - 40 && (
            <View style={styles.labelAfter}>
              <Text style={styles.labelTextGold}>AFTER</Text>
            </View>
          )}

          <View
            style={[
              styles.sliderLine,
              { left: Math.max(20, Math.min(containerWidth - 20, clampedSliderPosition)) - 1 },
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
          </View>
        </ImageBackground>
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
    flex: 1,
    width: '100%',
    height: '100%',
  },
  beforeImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  beforeImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    marginLeft: -40,
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
});
