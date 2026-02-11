// components/AuraScoreGauge.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface AuraScoreGaugeProps {
  score: number; // 1-1000
  animated?: boolean;
}

const AuraScoreGauge: React.FC<AuraScoreGaugeProps> = ({ 
  score = 500, 
  animated = true 
}) => {
  const [animatedValue] = React.useState(new Animated.Value(0));
  const displayScore = Math.min(Math.max(score, 1), 1000);

  // Animate on mount
  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: displayScore,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web', // Fix for web platform
      }).start();
    }
  }, [displayScore, animated]);

  // Calculate percentage for gauge visualization
  const percentage = displayScore / 1000;
  
  // Determine color based on score range
  const getScoreColor = () => {
    if (displayScore >= 800) return ['#FFD700', '#FFA500']; // Golden
    if (displayScore >= 600) return ['#FFA500', '#FF8C00']; // Orange-Gold
    if (displayScore >= 400) return ['#FF8C00', '#FF6347']; // Orange-Red
    if (displayScore >= 200) return ['#FF6347', '#FF4500']; // Red-Orange
    return ['#FF4500', '#DC143C']; // Deep Red
  };

  // Get descriptive text based on score
  const getScoreDescription = () => {
    if (displayScore >= 900) return "Divine Radiance";
    if (displayScore >= 800) return "Brilliant Aura";
    if (displayScore >= 700) return "Radiant Energy";
    if (displayScore >= 600) return "Strong Presence";
    if (displayScore >= 500) return "Balanced Aura";
    if (displayScore >= 400) return "Moderate Energy";
    if (displayScore >= 300) return "Developing Aura";
    if (displayScore >= 200) return "Awakening Energy";
    if (displayScore >= 100) return "Subtle Presence";
    return "Beginning Awareness";
  };

  // STYLES DEFINED FIRST (IMPORTANT!)
  const styles = StyleSheet.create({
    container: {
      backgroundColor: Colors.cardBackground || '#1a1a2e',
      borderRadius: 20,
      padding: 20,
      marginVertical: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.2)',
      shadowColor: '#FFD700',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFD700',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: '#aaa',
    },
    gaugeContainer: {
      alignItems: 'center',
    },
    scoreDisplay: {
      alignItems: 'center',
      marginBottom: 20,
    },
    scoreNumber: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFD700',
      textShadowColor: 'rgba(255, 215, 0, 0.5)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    },
    scoreLabel: {
      fontSize: 14,
      color: '#FFD700',
      fontWeight: '600',
      letterSpacing: 1,
      marginTop: 4,
    },
    visualGauge: {
      width: '100%',
      height: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 20,
    },
    gaugeBar: {
      height: '100%',
      borderRadius: 10,
    },
    gaugeFill: {
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    descriptionContainer: {
      alignItems: 'center',
    },
    descriptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFD700',
      textAlign: 'center',
      marginBottom: 4,
    },
    scoreRange: {
      fontSize: 12,
      color: '#888',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>YOUR AURA ANALYSIS</Text>
        <Text style={styles.subtitle}>Personal Energy Assessment</Text>
      </View>
      
      <View style={styles.gaugeContainer}>
        {/* Main Score Display */}
        <View style={styles.scoreDisplay}>
          <Animated.Text style={styles.scoreNumber}>
            {animated ? animatedValue.interpolate({
              inputRange: [0, 1000],
              outputRange: ['0', displayScore.toString()],
              extrapolate: 'clamp',
            }) : displayScore}
          </Animated.Text>
          <Text style={styles.scoreLabel}>AURA SCORE</Text>
        </View>

        {/* Visual Gauge */}
        <View style={styles.visualGauge}>
          <LinearGradient
            colors={getScoreColor()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gaugeBar}
          >
            <View 
              style={[
                styles.gaugeFill, 
                { width: `${percentage * 100}%` }
              ]} 
            />
          </LinearGradient>
        </View>

        {/* Score Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{getScoreDescription()}</Text>
          <Text style={styles.scoreRange}>
            Score Range: 1 - 1000
          </Text>
        </View>
      </View>
    </View>
  );
};

export default AuraScoreGauge;
