import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';

const GOLD = Colors.gold || '#F59E0B';

// --- STYLES AT TOP (Aura Guard Compliance) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 20,
    textAlign: 'center',
  },
  subtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 8,
    letterSpacing: 1,
  },
  loaderBarBg: {
    width: 200,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 30,
    borderRadius: 1,
    overflow: 'hidden',
  },
  loaderBarFill: {
    height: '100%',
    backgroundColor: GOLD,
  }
});

export default function BiomarkerLoadingScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotation animation for the icon
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Indeterminate progress bar animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        })
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const translateX = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Activity size={48} color={GOLD} strokeWidth={1} />
        </Animated.View>
        
        <Text style={styles.text}>AURA GOLD AI</Text>
        <Text style={styles.subtext}>INITIALIZING BIOMETRIC CORE</Text>
      </View>

      <View style={styles.loaderBarBg}>
        <Animated.View 
          style={[
            styles.loaderBarFill, 
            { 
              width: '100%',
              transform: [{ translateX }] 
            }
          ]} 
        />
      </View>
    </View>
  );
}
