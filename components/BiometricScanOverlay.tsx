import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Microscope, Brain, Dna, Activity, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOLD = Colors.gold || '#F59E0B';

// --- STYLES DEFINED AT TOP TO PREVENT REFERENCEERROR ---
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
    width: 32,
    height: 32,
    borderColor: GOLD,
  },
  panel: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
  },
  statusText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  }
});

export default function BiometricScanOverlay({ onReadyToCapture }: { onReadyToCapture: () => void }) {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scan Line Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // 12-Second Clinical Handshake Progress
    Animated.timing(progress, {
      toValue: 100,
      duration: 12000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && onReadyToCapture) {
        onReadyToCapture();
      }
    });
  }, [onReadyToCapture]);

  const translateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.5],
  });

  const barWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
      
      {/* Viewfinder Corners */}
      <View style={[styles.cornerBase, { top: 60, left: 40, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[styles.cornerBase, { top: 60, right: 40, borderTopWidth: 2, borderRightWidth: 2 }]} />
      <View style={[styles.cornerBase, { bottom: 60, left: 40, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[styles.cornerBase, { bottom: 60, right: 40, borderBottomWidth: 2, borderRightWidth: 2 }]} />

      <View style={styles.panel}>
        <Activity size={32} color={GOLD} />
        <Text style={styles.statusText}>Analyzing Biometric Markers...</Text>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}