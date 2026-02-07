import React from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Info, ShieldAlert, CheckCircle2, ChevronRight, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import AuraScoreGauge from './AuraScoreGauge'; // Your gauge component
import Colors from '@/constants/colors';

const PatientResultsModal = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const getSeverityColor = (percentage: number) => {
    if (percentage > 60) return '#EF4444'; 
    if (percentage > 30) return '#F59E0B'; 
    return '#10B981'; 
  };

  const getAuraStatus = (score: number) => {
    if (score > 800) return { label: 'Excellent', color: '#10B981' };
    if (score > 600) return { label: 'Good', color: '#F59E0B' };
    return { label: 'Needs Optimization', color: '#EF4444' };
  };

  const status = getAuraStatus(analysis.auraScore);

  return (
    <Modal animationType="slide" transparent={true} visible={!!analysis}>
      <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* Header with Gauge */}
          <View style={styles.header}>
             <AuraScoreGauge score={analysis.auraScore} size={150} />
             <View style={styles.headerMeta}>
                <Text style={styles.modalTitle}>Facial Analysis</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
                <Text style={styles.skinType}>Fitzpatrick Type {analysis.fitzpatrickAssessment.type}</Text>
             </View>
             <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                <X color="#94A3B8" size={24} />
             </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* --- VOLUME LOSS VISUALIZER --- */}
            <Text style={styles.sectionTitle}>Volume & Laxity Map</Text>
            <View style={styles.grid}>
              {analysis.volumeLoss.map((zone, index) => (
                <View key={index} style={styles.zoneCard}>
                  <Text style={styles.zoneName}>{zone.zone}</Text>
                  <View style={styles.zoneValueRow}>
                    <Text style={[styles.zoneValue, { color: getSeverityColor(zone.percentage) }]}>
                      {zone.percentage}%
                    </Text>
                    <Text style={styles.lossLabel}>Loss</Text>
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
            <Text style={styles.sectionTitle}>Clinical Recommendations</Text>
            {analysis.clinicalRoadmap.map((item, idx) => (
              <TouchableOpacity key={idx} style={[styles.treatmentCard, !item.isSafe && styles.unsafeCard]}>
                <View style={styles.treatmentHeader}>
                  <View style={styles.treatmentMain}>
                    {item.isSafe ? (
                      <CheckCircle2 size={18} color="#10B981" />
                    ) : (
                      <ShieldAlert size={18} color="#EF4444" />
                    )}
                    <Text style={styles.treatmentName}>{item.name}</Text>
                  </View>
                  <ChevronRight size={16} color="#CBD5E1" />
                </View>
                
                <Text style={styles.treatmentReason}>{item.reasoning}</Text>
                
                {!item.isSafe && (
                  <View style={styles.warningBox}>
                    <Info size={12} color="#EF4444" />
                    <Text style={styles.warningText}>{item.safetyWarning}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.primaryAction} onPress={onClose}>
            <Text style={styles.primaryActionText}>Save to Health Profile</Text>
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
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    height: '92%', 
    paddingTop: 10
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerMeta: { flex: 1, marginLeft: 10 },
  closeIcon: { alignSelf: 'flex-start', padding: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  skinType: { fontSize: 13, color: '#64748B' },
  scrollBody: { padding: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  zoneCard: { width: '48%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 12 },
  zoneName: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 },
  zoneValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 10 },
  zoneValue: { fontSize: 24, fontWeight: 'bold' },
  lossLabel: { fontSize: 12, color: '#64748B' },
  progressBarBg: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 },
  progressBarFill: { height: '100%', borderRadius: 2 },
  treatmentCard: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  unsafeCard: { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
  treatmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  treatmentMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  treatmentName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  treatmentReason: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#FFF', padding: 8, borderRadius: 8 },
  warningText: { fontSize: 11, color: '#EF4444', fontWeight: '600', flex: 1 },
  primaryAction: { margin: 24, backgroundColor: '#1E293B', padding: 20, borderRadius: 20, alignItems: 'center' },
  primaryActionText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});
