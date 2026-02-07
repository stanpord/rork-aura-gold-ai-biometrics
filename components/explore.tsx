import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BookOpen, ShieldCheck, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import ParallaxScrollView from '@/components/parallax-scroll-view';

const GOLD = Colors.gold || '#F59E0B';

// --- STYLES DEFINED AT TOP TO PREVENT INITIALIZATION ERROR ---
const styles = StyleSheet.create({
  headerImage: {
    color: '#1D1D1F',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  section: {
    padding: 24,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
  tag: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
  }
});

export default function ExploreScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#111', dark: '#000' }}
      headerImage={<BookOpen size={310} color="rgba(245, 158, 11, 0.05)" style={styles.headerImage} />}
    >
      <View style={styles.section}>
        <View style={styles.titleContainer}>
          <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '900' }}>EXPLORE</Text>
          <Text style={{ color: GOLD, fontSize: 28, fontWeight: '900' }}>PROTOCOL</Text>
        </View>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={24} color={GOLD} />
            <Text style={styles.cardTitle}>Clinical Safety</Text>
          </View>
          <Text style={styles.cardDescription}>
            Review the latest contraindication data and safety protocols for aesthetic treatments.
          </Text>
          <Text style={styles.tag}>PATENT PENDING CDSS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeader}>
            <Zap size={24} color={GOLD} />
            <Text style={styles.cardTitle}>Optimization</Text>
          </View>
          <Text style={styles.cardDescription}>
            Dive deep into peptide therapy and IV drip optimization based on biometric markers.
          </Text>
          <Text style={styles.tag}>VERSION 1.0.10</Text>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}
