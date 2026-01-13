import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: number;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  height = 400,
}: BeforeAfterSliderProps) {
  const containerWidth = Dimensions.get('window').width - 40;
  const [sliderPosition, setSliderPosition] = useState(containerWidth / 2);
  const panX = useRef(new Animated.Value(containerWidth / 2)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panX.setOffset(sliderPosition);
        panX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = sliderPosition + gestureState.dx;
        const clampedPosition = Math.max(20, Math.min(containerWidth - 20, newPosition));
        panX.setValue(gestureState.dx);
        setSliderPosition(clampedPosition);
      },
      onPanResponderRelease: () => {
        panX.flattenOffset();
      },
    })
  ).current;

  const clampedSliderPosition = Math.max(20, Math.min(containerWidth - 20, sliderPosition));

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: afterImage }}
          style={styles.baseImage}
          contentFit="cover"
        />
        
        <View
          style={[
            styles.beforeImageContainer,
            { width: clampedSliderPosition },
          ]}
        >
          <View style={[styles.beforeImageWrapper, { width: containerWidth }]}>
            <Image
              source={{ uri: beforeImage }}
              style={styles.beforeImage}
              contentFit="cover"
            />
          </View>
        </View>

        <View style={styles.labelBefore}>
          <Text style={styles.labelText}>BEFORE</Text>
        </View>
        <View style={styles.labelAfter}>
          <Text style={styles.labelTextGold}>AFTER</Text>
        </View>

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
    bottom: 0,
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
});
