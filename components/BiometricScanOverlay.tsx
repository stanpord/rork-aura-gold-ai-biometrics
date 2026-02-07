import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOLD = Colors.gold || '#F59E0B';

// --- STYLES DEFINED AT TOP ---
const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 999 },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: GOLD },
  cornerBase: { position: 'absolute', width: 32, height: 32, borderColor: GOLD },
});

export default function BiometricScanOverlay({ onReadyToCapture }: { onReadyToCapture: () => void }) {
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanLineY, { toValue: 1, duration: 2500, useNativeDriver: true })
    ).start();
    
    // Auto-trigger capture after 12 seconds for the clinical handshake
    const timer = setTimeout(() => {
      onReadyToCapture();
    }, 12000);

    return () => clearTimeout(timer);
  }, [onReadyToCapture]);

  const translateY = scanLineY.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0, SCREEN_HEIGHT * 0.5] 
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
      <View style={[styles.cornerBase, { top: 60, left: 40, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[styles.cornerBase, { top: 60, right: 40, borderTopWidth: 2, borderRightWidth: 2 }]} />
      <View style={[styles.cornerBase, { bottom: 60, left: 40, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
      <View style={[styles.cornerBase, { bottom: 60, right: 40, borderBottomWidth: 2, borderRightWidth: 2 }]} />
    </View>
  );
}