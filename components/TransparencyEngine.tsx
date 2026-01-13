import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { 
  FileText, 
  Database, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Ban,
  BookOpen,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SafetyStatus, TransparencyData, SafetyInterlock } from '@/types';

interface TransparencyEngineProps {
  treatmentName: string;
  clinicalReason: string;
  safetyStatus?: SafetyStatus;
  patientConditions: string[];
  skinIQData?: {
    texture: string;
    pores: string;
    pigment: string;
    redness: string;
  };
  imageAnalysisId?: string;
}

function generateTransparencyData(
  treatmentName: string,
  clinicalReason: string,
  safetyStatus?: SafetyStatus,
  patientConditions: string[] = [],
  skinIQData?: TransparencyEngineProps['skinIQData']
): TransparencyData {
  const guidelinesMap: Record<string, string> = {
    'Morpheus8': '2025 Aesthetic Guidelines for RF Microneedling',
    'Botox Cosmetic': '2025 Neurotoxin Administration Guidelines',
    'Botox': '2025 Neurotoxin Administration Guidelines',
    'HydraFacial': '2025 Non-Invasive Facial Treatment Standards',
    'Dermal Fillers': '2025 Hyaluronic Acid Filler Guidelines',
    'IPL': '2025 Intense Pulsed Light Treatment Protocols',
    'Chemical Peel': '2025 Chemical Exfoliation Guidelines',
    'Microneedling': '2025 Collagen Induction Therapy Standards',
    'PDO Threads': '2025 Thread Lift Procedural Guidelines',
    'Kybella': '2025 Deoxycholic Acid Treatment Protocols',
    'Sculptra': '2025 Poly-L-Lactic Acid Guidelines',
    'BPC-157': '2025 Peptide Therapy Clinical Standards',
    'GHK-Cu': '2025 Copper Peptide Protocols',
    'Epithalon': '2025 Telomerase Peptide Guidelines',
    'TB-500': '2025 Thymosin Beta-4 Treatment Standards',
    'Glow Drip': '2025 IV Vitamin Therapy Guidelines',
    'NAD+ Infusion': '2025 NAD+ Administration Protocols',
    'Myers Cocktail': '2025 IV Nutrient Therapy Standards',
    'Glutathione Push': '2025 Antioxidant IV Guidelines',
  };

  const skinDataSource = skinIQData 
    ? `Skin IQ Analysis (Texture: ${skinIQData.texture}, Pores: ${skinIQData.pores}, Pigment: ${skinIQData.pigment}, Redness: ${skinIQData.redness})`
    : 'AI Facial Analysis';

  const interlocks: SafetyInterlock[] = [];

  if (safetyStatus) {
    if (!safetyStatus.isBlocked) {
      interlocks.push({
        type: 'cleared',
        label: 'No absolute contraindications detected',
        detected: true,
      });
    }

    if (safetyStatus.isBlocked) {
      safetyStatus.blockedReasons.forEach(reason => {
        interlocks.push({
          type: 'blocked',
          label: reason,
          detected: true,
        });
      });
    }

    if (safetyStatus.hasCautions) {
      safetyStatus.cautionReasons.forEach(reason => {
        interlocks.push({
          type: 'warning',
          label: reason,
          detected: true,
        });
      });
    }

    if (safetyStatus.requiresLabWork) {
      interlocks.push({
        type: 'warning',
        label: `Lab work required: ${safetyStatus.requiredLabTests.join(', ')}`,
        detected: true,
      });
    }
  } else {
    interlocks.push({
      type: 'cleared',
      label: 'Standard safety protocols apply',
      detected: true,
    });
  }

  const commonInterlocks = [
    { type: 'cleared' as const, label: 'Pacemaker/defibrillator', detected: !patientConditions.includes('pacemaker') },
    { type: 'cleared' as const, label: 'Active skin infection', detected: !patientConditions.includes('active_skin_infection') },
    { type: 'cleared' as const, label: 'Pregnancy', detected: !patientConditions.includes('pregnancy') },
  ];

  commonInterlocks.forEach(interlock => {
    if (interlock.detected) {
      interlocks.push(interlock);
    }
  });

  return {
    clinicalCriteria: clinicalReason,
    dataSource: `AI Image Analysis + Health Questionnaire | ${skinDataSource}`,
    safetyInterlocks: interlocks,
    guidelinesReference: guidelinesMap[treatmentName] || '2025 Aesthetic Treatment Guidelines',
  };
}

export default function TransparencyEngine({
  treatmentName,
  clinicalReason,
  safetyStatus,
  patientConditions,
  skinIQData,
  imageAnalysisId,
}: TransparencyEngineProps) {
  const transparencyData = generateTransparencyData(
    treatmentName,
    clinicalReason,
    safetyStatus,
    patientConditions,
    skinIQData
  );

  const renderInterlockIcon = (type: SafetyInterlock['type']) => {
    switch (type) {
      case 'cleared':
        return <CheckCircle size={12} color={Colors.success} />;
      case 'warning':
        return <AlertTriangle size={12} color="#f59e0b" />;
      case 'blocked':
        return <Ban size={12} color="#ef4444" />;
    }
  };

  const getInterlockStyle = (type: SafetyInterlock['type']) => {
    switch (type) {
      case 'cleared':
        return styles.interlockCleared;
      case 'warning':
        return styles.interlockWarning;
      case 'blocked':
        return styles.interlockBlocked;
    }
  };

  const getInterlockTextStyle = (type: SafetyInterlock['type']) => {
    switch (type) {
      case 'cleared':
        return styles.interlockTextCleared;
      case 'warning':
        return styles.interlockTextWarning;
      case 'blocked':
        return styles.interlockTextBlocked;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Shield size={14} color={Colors.gold} />
        <Text style={styles.headerTitle}>TRANSPARENCY ENGINE</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BookOpen size={12} color={Colors.textMuted} />
          <Text style={styles.sectionLabel}>CLINICAL CRITERIA</Text>
        </View>
        <Text style={styles.sectionContent}>{transparencyData.clinicalCriteria}</Text>
        {transparencyData.guidelinesReference && (
          <Text style={styles.guidelinesRef}>
            Based on {transparencyData.guidelinesReference}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Database size={12} color={Colors.textMuted} />
          <Text style={styles.sectionLabel}>DATA SOURCE</Text>
        </View>
        <Text style={styles.sectionContent}>{transparencyData.dataSource}</Text>
        {imageAnalysisId && (
          <Text style={styles.analysisId}>Analysis ID: {imageAnalysisId}</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={12} color={Colors.textMuted} />
          <Text style={styles.sectionLabel}>SAFETY INTERLOCKS</Text>
        </View>
        <View style={styles.interlocksContainer}>
          {transparencyData.safetyInterlocks.map((interlock, index) => (
            <View 
              key={index} 
              style={[styles.interlockRow, getInterlockStyle(interlock.type)]}
            >
              {renderInterlockIcon(interlock.type)}
              <Text style={[styles.interlockText, getInterlockTextStyle(interlock.type)]}>
                {interlock.type === 'cleared' ? '✓' : interlock.type === 'warning' ? '⚠' : '✗'} {interlock.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  sectionContent: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  guidelinesRef: {
    fontSize: 10,
    color: Colors.gold,
    marginTop: 6,
    fontStyle: 'italic',
  },
  analysisId: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  interlocksContainer: {
    gap: 6,
  },
  interlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  interlockCleared: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  interlockWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  interlockBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  interlockText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  interlockTextCleared: {
    color: Colors.success,
  },
  interlockTextWarning: {
    color: '#f59e0b',
  },
  interlockTextBlocked: {
    color: '#ef4444',
  },
});
