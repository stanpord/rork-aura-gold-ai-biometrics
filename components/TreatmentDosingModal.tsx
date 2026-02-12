import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { X, AlertTriangle, Shield, CheckCircle, Settings, FilePen, Clock, Square, CheckSquare, Pill, Sparkles, Lightbulb } from 'lucide-react-native';
import { getPostCareRecommendations, requiresAntiviralForLipFlip } from '@/constants/contraindications';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ClinicalProcedure, PeptideTherapy, IVOptimization, TreatmentDosingSettings, ComplianceSignOff } from '@/types';
import TransparencyEngine from '@/components/TransparencyEngine';

interface TreatmentDosingModalProps {
  visible: boolean;
  treatment: ClinicalProcedure | PeptideTherapy | IVOptimization | null;
  treatmentType: 'procedure' | 'peptide' | 'iv';
  onClose: () => void;
  onConfirm: (dosing: TreatmentDosingSettings, signOff?: ComplianceSignOff) => void;
  patientConditions?: string[];
  skinIQData?: {
    texture: string;
    pores: string;
    pigment: string;
    redness: string;
  };
}

const TREATMENT_FIELDS: Record<string, { label: string; placeholder: string; unit?: string }[]> = {
  'Morpheus8': [
    { label: 'Depth', placeholder: '1.5', unit: 'mm' },
    { label: 'Energy', placeholder: '40', unit: 'mJ' },
    { label: 'Passes', placeholder: '2', unit: '' },
  ],
  'Botox Cosmetic': [
    { label: 'Units', placeholder: '20', unit: 'units' },
    { label: 'Injection Sites', placeholder: 'Glabella, Forehead', unit: '' },
    { label: 'Dilution', placeholder: '2.5ml saline', unit: '' },
  ],
  'Baby Botox': [
    { label: 'Units', placeholder: '10', unit: 'units' },
    { label: 'Injection Sites', placeholder: 'Forehead, Crow\'s feet', unit: '' },
    { label: 'Dilution', placeholder: '2.5ml saline', unit: '' },
  ],
  'Lip Flip': [
    { label: 'Units', placeholder: '4-6', unit: 'units' },
    { label: 'Injection Sites', placeholder: 'Upper lip border', unit: '' },
  ],
  'Dermal Fillers': [
    { label: 'Volume', placeholder: '1.0', unit: 'ml' },
    { label: 'Injection Sites', placeholder: 'Nasolabial folds', unit: '' },
  ],
  'HydraFacial': [
    { label: 'Passes', placeholder: '1', unit: '' },
  ],
  'IPL': [
    { label: 'Energy', placeholder: '15', unit: 'J/cm²' },
    { label: 'Passes', placeholder: '2', unit: '' },
  ],
  'Red Light Therapy': [
    { label: 'Duration', placeholder: '15-20', unit: 'min' },
    { label: 'Wavelength', placeholder: '630-660', unit: 'nm' },
  ],
  'LED Therapy': [
    { label: 'Duration', placeholder: '20', unit: 'min' },
    { label: 'Color/Mode', placeholder: 'Red/Blue/Combination', unit: '' },
  ],
  'Clear + Brilliant': [
    { label: 'Energy', placeholder: '0.2-1.0', unit: 'mJ' },
    { label: 'Passes', placeholder: '4-8', unit: '' },
    { label: 'Coverage', placeholder: '5-10%', unit: '' },
  ],
  'MOXI Laser': [
    { label: 'Energy', placeholder: '3-5', unit: 'mJ' },
    { label: 'Density', placeholder: '100-300', unit: 'spots/cm²' },
    { label: 'Passes', placeholder: '1-2', unit: '' },
  ],
  'Chemical Peel': [
    { label: 'Concentration', placeholder: '30%', unit: '' },
    { label: 'Application Time', placeholder: '3', unit: 'min' },
  ],
  'Microneedling': [
    { label: 'Depth', placeholder: '1.0', unit: 'mm' },
    { label: 'Passes', placeholder: '3', unit: '' },
  ],
  'Microdermabrasion': [
    { label: 'Passes', placeholder: '2', unit: '' },
    { label: 'Pressure', placeholder: 'Low/Medium/High', unit: '' },
  ],
  'Dermaplaning': [
    { label: 'Area', placeholder: 'Full face/Targeted', unit: '' },
    { label: 'Blade Angle', placeholder: '45°', unit: '' },
  ],
  'PDO Threads': [
    { label: 'Thread Count', placeholder: '10', unit: '' },
    { label: 'Thread Type', placeholder: 'Smooth/Barbed', unit: '' },
  ],
  'Kybella': [
    { label: 'Volume', placeholder: '4', unit: 'ml' },
    { label: 'Injection Sites', placeholder: '20', unit: 'points' },
  ],
  'Sculptra': [
    { label: 'Vials', placeholder: '2', unit: '' },
    { label: 'Dilution', placeholder: '8ml', unit: '' },
  ],
  'Radiesse': [
    { label: 'Volume', placeholder: '1.5', unit: 'ml' },
    { label: 'Injection Sites', placeholder: 'Cheeks, Jawline', unit: '' },
    { label: 'Dilution', placeholder: '0.3ml lidocaine', unit: '' },
  ],
  'Exosome Therapy': [
    { label: 'Vials', placeholder: '1-2', unit: '' },
    { label: 'Application Method', placeholder: 'Topical post-microneedling', unit: '' },
  ],
};

const DEFAULT_FIELDS = [
  { label: 'Dosage/Settings', placeholder: 'Enter clinical parameters', unit: '' },
];

export default function TreatmentDosingModal({
  visible,
  treatment,
  treatmentType,
  onClose,
  onConfirm,
  patientConditions = [],
  skinIQData,
}: TreatmentDosingModalProps) {
  const [dosing, setDosing] = useState<TreatmentDosingSettings>({});
  const [customNotes, setCustomNotes] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [practitionerSignature, setPractitionerSignature] = useState('');

  const treatmentName = treatment ? ('name' in treatment ? treatment.name : '') : '';
  const fields = TREATMENT_FIELDS[treatmentName] || DEFAULT_FIELDS;

  const currentTimestamp = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  }, []);

  const canSubmit = acknowledged && practitionerSignature.trim().length > 0;

  const handleConfirm = useCallback(() => {
    if (!canSubmit) return;
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    const signOff: ComplianceSignOff = {
      acknowledged,
      practitionerSignature: practitionerSignature.trim(),
      signedAt: new Date(),
      timestamp: currentTimestamp,
    };
    
    onConfirm({ ...dosing, customNotes }, signOff);
  }, [dosing, customNotes, onConfirm, acknowledged, practitionerSignature, currentTimestamp, canSubmit]);

  const handleClose = useCallback(() => {
    setDosing({});
    setCustomNotes('');
    setAcknowledged(false);
    setPractitionerSignature('');
    onClose();
  }, [onClose]);

  const updateField = useCallback((fieldLabel: string, value: string) => {
    const key = fieldLabel.toLowerCase().replace(/\s+/g, '') as keyof TreatmentDosingSettings;
    setDosing(prev => ({ ...prev, [key]: value }));
  }, []);

  const postCareRecommendations = useMemo(() => {
    return getPostCareRecommendations(treatmentName);
  }, [treatmentName]);

  const needsAntiviralPrescription = useMemo(() => {
    if (treatmentName === 'Lip Flip') {
      return requiresAntiviralForLipFlip(patientConditions);
    }
    return false;
  }, [treatmentName, patientConditions]);

  if (!treatment) return null;

  const safetyStatus = 'safetyStatus' in treatment ? treatment.safetyStatus : undefined;
  const clinicalReason = 'clinicalReason' in treatment ? treatment.clinicalReason : 
                         'mechanism' in treatment ? treatment.mechanism : 
                         'benefit' in treatment ? treatment.benefit : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Settings size={20} color={Colors.gold} />
            </View>
            <Text style={styles.headerTitle}>PRACTITIONER ACTION REQUIRED</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.treatmentHeader}>
              <Text style={styles.treatmentName}>{treatmentName}</Text>
              {safetyStatus && !safetyStatus.isBlocked && (
                <View style={styles.safetyBadge}>
                  <Shield size={12} color={Colors.success} />
                  <Text style={styles.safetyBadgeText}>CLEARED</Text>
                </View>
              )}
            </View>

            <View style={styles.rationaleBox}>
              <Text style={styles.rationaleLabel}>CLINICAL MATCH RATIONALE</Text>
              <Text style={styles.rationaleText}>{clinicalReason}</Text>
            </View>

            {safetyStatus?.hasCautions && (
              <View style={styles.cautionBox}>
                <AlertTriangle size={14} color="#f59e0b" />
                <Text style={styles.cautionText}>
                  Caution: {safetyStatus.cautionReasons.join(', ')}
                </Text>
              </View>
            )}

            {needsAntiviralPrescription && (
              <View style={styles.antiviralAlert}>
                <Pill size={16} color="#ef4444" />
                <View style={styles.antiviralContent}>
                  <Text style={styles.antiviralTitle}>ANTIVIRAL PRESCRIPTION REQUIRED</Text>
                  <Text style={styles.antiviralText}>
                    Patient has history of cold sores. Prescribe antiviral prophylaxis (e.g., Valacyclovir 500mg BID) starting 2 days before procedure.
                  </Text>
                </View>
              </View>
            )}

            {postCareRecommendations.length > 0 && (
              <View style={styles.postCareBox}>
                <View style={styles.postCareHeader}>
                  <Sparkles size={14} color={Colors.success} />
                  <Text style={styles.postCareTitle}>RECOMMENDED POST-CARE</Text>
                </View>
                {postCareRecommendations.map((rec, index) => (
                  <View key={index} style={styles.postCareItem}>
                    <Lightbulb size={12} color={Colors.gold} />
                    <View style={styles.postCareItemContent}>
                      <Text style={styles.postCareTreatment}>{rec.recommendTreatment}</Text>
                      <Text style={styles.postCareReason}>{rec.reason}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.firewallNotice}>
              <Shield size={16} color={Colors.gold} />
              <Text style={styles.firewallTitle}>Settings/Dosing Firewall</Text>
            </View>
            <Text style={styles.firewallDescription}>
              You have selected <Text style={styles.firewallHighlight}>{treatmentName}</Text>. Please input your clinical settings based on your physical assessment:
            </Text>

            <View style={styles.fieldsContainer}>
              {fields.map((field, index) => (
                <View key={index} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{field.label}{field.unit ? ` (${field.unit})` : ''}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={dosing[field.label.toLowerCase().replace(/\s+/g, '') as keyof TreatmentDosingSettings] || ''}
                    onChangeText={(value) => updateField(field.label, value)}
                    keyboardType={field.unit && !isNaN(Number(field.placeholder)) ? 'numeric' : 'default'}
                  />
                </View>
              ))}

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Clinical Notes (Optional)</Text>
                <TextInput
                  style={[styles.fieldInput, styles.notesInput]}
                  placeholder="Additional observations or instructions..."
                  placeholderTextColor={Colors.textMuted}
                  value={customNotes}
                  onChangeText={setCustomNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                Note: AI-generated guidance for these parameters is disabled to ensure licensed provider oversight.
              </Text>
            </View>

            <View style={styles.transparencySection}>
              <TransparencyEngine
                treatmentName={treatmentName}
                clinicalReason={clinicalReason}
                safetyStatus={safetyStatus}
                patientConditions={patientConditions}
                skinIQData={skinIQData}
                imageAnalysisId={`IMG-${Date.now().toString(36).toUpperCase()}`}
              />
            </View>

            <View style={styles.legalSignOffSection}>
              <View style={styles.legalHeader}>
                <FilePen size={16} color={Colors.gold} />
                <Text style={styles.legalHeaderTitle}>LEGAL SIGN-OFF REQUIRED</Text>
              </View>

              <TouchableOpacity
                style={styles.acknowledgementRow}
                onPress={() => setAcknowledged(!acknowledged)}
                activeOpacity={0.7}
              >
                {acknowledged ? (
                  <CheckSquare size={22} color={Colors.gold} />
                ) : (
                  <Square size={22} color={Colors.textMuted} />
                )}
                <Text style={styles.acknowledgementText}>
                  I have reviewed the AI suggestions and adjusted them based on my independent clinical judgment.
                </Text>
              </TouchableOpacity>

              <View style={styles.signatureSection}>
                <Text style={styles.signatureLabel}>Practitioner Signature (Digital)</Text>
                <TextInput
                  style={styles.signatureInput}
                  placeholder="Enter your full name as signature"
                  placeholderTextColor={Colors.textMuted}
                  value={practitionerSignature}
                  onChangeText={setPractitionerSignature}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.timestampRow}>
                <Clock size={14} color={Colors.textMuted} />
                <Text style={styles.timestampText}>Timestamp: {currentTimestamp}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !canSubmit && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={!canSubmit}
            >
              <CheckCircle size={16} color={canSubmit ? Colors.black : Colors.textMuted} />
              <Text style={[styles.confirmButtonText, !canSubmit && styles.confirmButtonTextDisabled]}>
                {canSubmit ? 'CONFIRM & SIGN' : 'SIGN-OFF REQUIRED'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  treatmentName: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  safetyBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.success,
    letterSpacing: 1,
  },
  rationaleBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  rationaleLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  rationaleText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  cautionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  cautionText: {
    flex: 1,
    fontSize: 12,
    color: '#f59e0b',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  firewallNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  firewallTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  firewallDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  firewallHighlight: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldRow: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disclaimerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.gold,
  },
  confirmButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButtonTextDisabled: {
    color: Colors.textMuted,
  },
  transparencySection: {
    marginTop: 24,
  },
  legalSignOffSection: {
    marginTop: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.15)',
  },
  legalHeaderTitle: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  acknowledgementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  acknowledgementText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  signatureSection: {
    marginBottom: 16,
  },
  signatureLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  signatureInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    fontStyle: 'italic',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timestampText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  antiviralAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  antiviralContent: {
    flex: 1,
  },
  antiviralTitle: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: '#ef4444',
    letterSpacing: 1,
    marginBottom: 6,
  },
  antiviralText: {
    fontSize: 12,
    color: '#fca5a5',
    lineHeight: 18,
  },
  postCareBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  postCareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  postCareTitle: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.success,
    letterSpacing: 1,
  },
  postCareItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.15)',
  },
  postCareItemContent: {
    flex: 1,
  },
  postCareTreatment: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  postCareReason: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
