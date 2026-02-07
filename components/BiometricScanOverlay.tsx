import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, Brain, Microscope, Dna, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants (order doesn't matter as much here)
const GOLD = Colors.gold || '#F59E0B';
const CORNER_SIZE = 32;
const CORNER_THICKNESS = 2;

const ANALYSIS_STAGES = [
  { icon: Microscope, text: 'Analyzing skin texture...', subtext: 'Detecting pore size' },
  // ... rest
];

// ────────────────────────────────────────────────
// MUST BE HERE — BEFORE THE COMPONENT FUNCTION
// ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: GOLD,
  },
  cornerBase: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: GOLD,
  },
  panel: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
  },
});

// Now the component
export default function BiometricScanOverlay() {
  // ... rest of your code unchanged
  return (
    <View style={styles.container} pointerEvents="none">
      {/* now styles is guaranteed to exist */}
      {/* ... */}
    </View>
  );
}
