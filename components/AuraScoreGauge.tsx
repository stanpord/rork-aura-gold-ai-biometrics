import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';

// CRITICAL: Ensure NO line says: import AuraScoreGauge from './AuraScoreGauge';

interface AuraScoreGaugeProps {
  score: number;
  size?: number;
}

export default function AuraScoreGauge({ score, size = 200 }: AuraScoreGaugeProps) {
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={Colors.gold} />
            <Stop offset="100%" stopColor="#B8860B" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.scoreText}>{Math.round(score)}</Text>
        <Text style={styles.label}>AURA INDEX</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
  },
  label: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -5,
  },
});