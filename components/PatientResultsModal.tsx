import React from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Info, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const PatientResultsModal = ({ analysis, onClose }) => {
  // Helper to color-code severity
  const getSeverityColor = (percentage: number) => {
    if (percentage > 60) return '#EF4444'; // High loss
    if (percentage > 30) return '#F59E0B'; // Moderate
    return '#10B981'; // Mild
  };

  return (
    <Modal animationType="slide" transparent={true} visible={!!analysis}>
      <BlurView intensity={80} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.indicator} />
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>Clinical Profile</Text>
                <Text style={styles.skinType}>Fitzpatrick Type {analysis.fitzpatrickAssessment.type}</Text>
              </View>
              <View style={styles.auraBadge}>
                <Text style={styles.auraText}>Aura Score: {analysis.auraScore}</Text>
              </View>
            </View>

            {/* --- VOLUME LOSS VISUALIZER --- */}
            <Text style={styles.sectionTitle}>Volume & Laxity Analysis</Text>
            <View style={styles.grid}>
              {analysis.volumeLoss.map((zone, index) => (
                <View key={index} style={styles.zoneCard}>
                  <View style={styles.zoneHeader}>
                    <Text style={styles.zoneName}>{zone.zone}</Text>
                    <Text style={[styles.zoneValue, { color: getSeverityColor(zone.percentage) }]}>
                      {zone.percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${zone.percentage}%`, backgroundColor: getSeverityColor(zone.percentage) }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* --- TREATMENT ROADMAP --- */}
            <Text style={styles.sectionTitle}>Recommended Roadmap</Text>
            {analysis.clinicalRoadmap.map((item, idx) => (
              <View key={idx} style={[styles.treatmentCard, !item.isSafe && styles.unsafeCard]}>
                <View style={styles.treatmentIcon}>
                  {item.isSafe ? (
                    <CheckCircle2 size={20} color="#10B981" />
                  ) : (
                    <ShieldAlert size={20} color="#EF4444" />
                  )}
                </View>
                
                <View style={styles.treatmentInfo}>
                  <Text style={styles.treatmentName}>{item.name}</Text>
                  <Text style={styles.treatmentReason}>{item.reasoning}</Text>
                  
                  {!item.isSafe && (
                    <View style={styles.warningBox}>
                      <Info size={14} color="#EF4444" />
                      <Text style={styles.warningText}>{item.safetyWarning}</Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={18} color="#CBD5E1" />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    height: '85%', 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  indicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  skinType: { fontSize: 14, color: '#64748B', marginTop: 2 },
  auraBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  auraText: { color: '#6366F1', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 16, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  zoneCard: { width: '48%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  zoneName: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase' },
  zoneValue: { fontSize: 14, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  treatmentCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    marginBottom: 12 
  },
  unsafeCard: { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
  treatmentIcon: { marginRight: 12 },
  treatmentInfo: { flex: 1 },
  treatmentName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  treatmentReason: { fontSize: 13, color: '#64748B', marginTop: 2 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  warningText: { fontSize: 12, color: '#EF4444', fontWeight: '500' },
  closeButton: { backgroundColor: '#1E293B', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  closeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
