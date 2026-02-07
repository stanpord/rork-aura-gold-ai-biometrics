import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOLD = Colors.gold || '#F59E0B';

// --- STYLES AT TOP TO PREVENT INITIALIZATION ERROR ---
const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ovalGuide: { width: 240, height: 320, borderRadius: 120, borderWidth: 2, borderColor: GOLD },
  statusBar: { position: 'absolute', top: 50, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 },
  statusText: { color: '#FFF', fontSize: 14, fontWeight: '600', padding: 10 }
});

export default function GuidedCaptureOverlay({ isActive = false }) {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{isActive ? 'ANALYZING...' : 'CENTER FACE'}</Text>
      </View>
      <View style={styles.ovalGuide} />
    </View>
  );
}