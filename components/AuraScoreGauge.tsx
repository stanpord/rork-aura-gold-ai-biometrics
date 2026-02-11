import React from 'react';
import { View, Text } from 'react-native';

const AuraScoreGauge = ({ score = 500 }: { score?: number }) => {
  return (
    <View style={{ 
      padding: 20, 
      backgroundColor: '#1a1a2e', 
      margin: 16,
      borderRadius: 20,
    }}>
      <Text style={{ 
        color: '#FFD700', 
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
      }}>
        YOUR AURA ANALYSIS
      </Text>
      <Text style={{ 
        color: '#FFD700', 
        fontSize: 48, 
        textAlign: 'center',
        fontWeight: 'bold',
      }}>
        {Math.min(Math.max(score, 1), 1000)}
      </Text>
      <Text style={{ 
        color: '#FFD700', 
        textAlign: 'center',
        marginTop: 8,
      }}>
        AURA SCORE
      </Text>
    </View>
  );
};

export default AuraScoreGauge;
