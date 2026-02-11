import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface AuraScoreGaugeProps {
  score: number;
  animated?: boolean;
}

const AuraScoreGauge: React.FC<AuraScoreGaugeProps> = ({ 
  score = 500 
}) => {
  const displayScore = Math.min(Math.max(score, 1), 1000);

  // GET COLORS FOR SCORE RANGE
  const getScoreColor = () => {
    if (displayScore >= 800) return '#FFD700'; // Golden
    if (displayScore >= 600) return '#FFA500'; // Orange-Gold
    if (displayScore >= 400) return '#FF8C00'; // Orange
    if (displayScore >= 200) return '#FF6347'; // Red-Orange
    return '#FF4500'; // Red
  };

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

  // STYLES DEFINED FIRST (CRITICAL!)
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#1a1a2e',
      borderRadius: 20,
      padding: 20,
      marginVertical: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFD700',
      textAlign: 'center',
      marginBottom: 12,
    },
    scoreContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    scoreNumber: {
      fontSize: 48,
      fontWeight: 'bold',
      color: getScoreColor(),
    },
    scoreLabel: {
      fontSize: 14,
      color: '#FFD700',
      fontWeight: '600',
      marginTop: 4,
    },
    progressBar: {
      width: '100%',
      height: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: getScoreColor(),
      borderRadius: 6,
      width: `${(displayScore / 1000) * 100}%`,
    },
    description: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFD700',
      textAlign: 'center',
    },
    range: {
      fontSize: 12,
      color: '#888',
      textAlign: 'center',
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YOUR AURA ANALYSIS</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreNumber}>{displayScore}</Text>
        <Text style={styles.scoreLabel}>AURA SCORE</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.description}>{getScoreDescription()}</Text>
      <Text style={styles.range}>Score Range: 1 - 1000</Text>
    </View>
  );
};

export default AuraScoreGauge;
