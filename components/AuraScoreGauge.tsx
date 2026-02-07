iimport React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Colors from '@/constants/colors';

interface AuraScoreGaugeProps {
  score: number;
  size?: number;
}

// --- 1. STYLES AT TOP (Initialization Guard) ---
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
    color: Colors.gold || '#F59E0B',
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -5,
  },
});

// --- 2. COMPONENT LOGIC ---
export default function AuraScoreGauge({ score, size = 200 }: AuraScoreGaugeProps) {
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Ensure score is clamped between 0 and 100 to prevent SVG "bleeding"
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={Colors.gold || '#F59E0B'} />
            <Stop offset="100%" stopColor="#B8860B" />
          </LinearGradient>
        </Defs>
        
        {/* Background Circle (Track) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Foreground Circle (Progress) */}
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
          // Better compatibility for rotation
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      
      <View style={styles.textContainer}>
        <Text style={styles.scoreText}>{Math.round(clampedScore)}</Text>
        <Text style={styles.label}>AURA INDEX</Text>
      </View>
    </View>
  );
}