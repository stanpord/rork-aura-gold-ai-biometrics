import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';

interface AuraScoreGaugeProps {
  score: number;
  size?: number;
}

export default function AuraScoreGauge({ score = 0, size = 180 }: AuraScoreGaugeProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const radius = size * 0.38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const duration = 2000;
      const startTime = Date.now();
      const startScore = displayScore;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setDisplayScore(startScore + (score - startScore) * progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    } else {
      Animated.timing(animatedValue, {
        toValue: score,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1000],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const webStrokeDashoffset = circumference - (displayScore / 1000) * circumference;

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="auraGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.goldLight} />
            <Stop offset="50%" stopColor={Colors.gold} />
            <Stop offset="100%" stopColor={Colors.goldDark} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(30, 41, 59, 0.5)"
          strokeWidth={strokeWidth - 2}
          fill="transparent"
        />
        {Platform.OS === 'web' ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#auraGoldGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={webStrokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#auraGoldGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View style={styles.centerContent}>
        <Text style={styles.scoreText}>{Math.round(score)}</Text>
        <Text style={styles.label}>AURA INDEX</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -2,
  },
  label: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: 'rgba(245, 158, 11, 0.8)',
    letterSpacing: 3,
    marginTop: 2,
  },
});
