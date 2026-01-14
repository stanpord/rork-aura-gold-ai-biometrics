import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  Shield,
  Scale,
  AlertTriangle,
  Lock,
  FileText,
  CheckSquare,
  Square,
  Gavel,
  Building2,
  MapPin,
  ChevronDown,
  Syringe,
  Droplets,
  FlaskConical,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TermsOfServiceAcknowledgment } from '@/types';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: (acknowledgment: TermsOfServiceAcknowledgment) => void;
  appName?: string;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

export default function TermsOfServiceModal({
  visible,
  onClose,
  onAccept,
  appName = 'Aura AI Biometrics',
}: TermsOfServiceModalProps) {
  const [hasReadAll, setHasReadAll] = useState(false);
  const [tosChecks, setTosChecks] = useState({
    humanInTheLoop: false,
    regulatoryDisclosures: false,
    recommendationLimitations: false,
    dataPrivacy: false,
  });
  const [practitionerSignature, setPractitionerSignature] = useState('');
  const [practitionerCredentials, setPractitionerCredentials] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [stateJurisdiction, setStateJurisdiction] = useState('');
  const [showStateSelector, setShowStateSelector] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const allChecked = Object.values(tosChecks).every(Boolean);
  const canSubmit = allChecked && 
    practitionerSignature.trim() && 
    practitionerCredentials.trim() && 
    stateJurisdiction;

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    if (isNearBottom && !hasReadAll) {
      setHasReadAll(true);
    }
  };

  const toggleCheck = (key: keyof typeof tosChecks) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTosChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const acknowledgment: TermsOfServiceAcknowledgment = {
      acknowledgedAt: new Date(),
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }),
      acknowledgedSections: {
        humanInTheLoop: tosChecks.humanInTheLoop,
        regulatoryDisclosures: tosChecks.regulatoryDisclosures,
        recommendationLimitations: tosChecks.recommendationLimitations,
        dataPrivacy: tosChecks.dataPrivacy,
      },
      practitionerSignature: practitionerSignature.trim(),
      practitionerCredentials: practitionerCredentials.trim(),
      clinicName: clinicName.trim() || undefined,
      stateJurisdiction,
    };

    onAccept(acknowledgment);
    resetForm();
  };

  const resetForm = () => {
    setTosChecks({
      humanInTheLoop: false,
      regulatoryDisclosures: false,
      recommendationLimitations: false,
      dataPrivacy: false,
    });
    setPractitionerSignature('');
    setPractitionerCredentials('');
    setClinicName('');
    setStateJurisdiction('');
    setHasReadAll(false);
    setShowStateSelector(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectState = (state: string) => {
    setStateJurisdiction(state);
    setShowStateSelector(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const CheckboxItem = ({
    checked,
    onPress,
    label,
  }: {
    checked: boolean;
    onPress: () => void;
    label: string;
  }) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {checked ? (
        <CheckSquare size={20} color={Colors.success} />
      ) : (
        <Square size={20} color={Colors.textMuted} />
      )}
      <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelChecked]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Gavel size={20} color={Colors.gold} />
            <Text style={styles.headerTitle}>TERMS OF SERVICE</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>Clinical Decision Support System Agreement</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>1.</Text>
              <Text style={styles.sectionTitle}>Human-in-the-Loop Clause</Text>
            </View>
            <View style={styles.liabilityBadge}>
              <Scale size={12} color={Colors.gold} />
              <Text style={styles.liabilityBadgeText}>LIABILITY SHIELD</Text>
            </View>
            
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>1.1 Professional Judgment Override</Text>
              <View style={styles.legalTextBox}>
                <Text style={styles.legalText}>
                  This App provides automated aesthetic recommendations based on clinical criteria. However, {appName} is NOT a licensed medical professional. Every recommendation—including specific Morpheus8 depths, Botox units, or Peptide dosages—must be reviewed, modified, or confirmed by a licensed Practitioner (MD, NP, or RN) prior to administration. The Practitioner retains 100% legal responsibility for the final treatment plan.
                </Text>
              </View>
            </View>
            
            <CheckboxItem
              checked={tosChecks.humanInTheLoop}
              onPress={() => toggleCheck('humanInTheLoop')}
              label="I acknowledge that I retain full legal responsibility for all treatment decisions and that AI recommendations require my professional review"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>2.</Text>
              <Text style={styles.sectionTitle}>2026 Regulatory Disclosures</Text>
            </View>
            <View style={styles.complianceBadge}>
              <Text style={styles.complianceBadgeText}>STATE COMPLIANCE</Text>
            </View>
            
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>2.1 AI Interaction Disclosure</Text>
              <View style={styles.legalTextBox}>
                <Text style={styles.legalText}>
                  In compliance with California AB 3030 and Texas SB 1188, users are hereby notified that the clinical outputs of this App are generated by Artificial Intelligence.
                </Text>
              </View>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>2.2 Right to Human Consultation</Text>
              <View style={styles.legalTextBox}>
                <Text style={styles.legalText}>
                  Patients have the absolute right to a consultation with a human provider to discuss any AI-generated recommendation. This App is intended to supplement, not replace, the patient-provider relationship.
                </Text>
              </View>
            </View>
            
            <CheckboxItem
              checked={tosChecks.regulatoryDisclosures}
              onPress={() => toggleCheck('regulatoryDisclosures')}
              label="I understand my obligation to disclose AI usage to patients and respect their right to human-only consultation"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>3.</Text>
              <Text style={styles.sectionTitle}>Scope of Recommendation Limitations</Text>
            </View>
            
            <View style={styles.treatmentCategory}>
              <View style={styles.treatmentCategoryHeader}>
                <Syringe size={14} color={Colors.text} />
                <Text style={styles.treatmentCategoryTitle}>Aesthetic Outcomes</Text>
              </View>
              <View style={styles.legalTextBox}>
                <Text style={styles.legalText}>
                  AI-generated simulations of Botox or filler results are illustrative only and do not guarantee actual surgical or non-surgical outcomes.
                </Text>
              </View>
            </View>

            <View style={styles.treatmentCategory}>
              <View style={styles.treatmentCategoryHeader}>
                <Droplets size={14} color="#3b82f6" />
                <FlaskConical size={14} color={Colors.success} />
                <Text style={styles.treatmentCategoryTitle}>Systemic Treatments (IVs/Peptides)</Text>
              </View>
              <View style={styles.legalTextBox}>
                <Text style={styles.legalText}>
                  Recommendations for systemic treatments are based on provided medical history. Users agree that {appName} is not liable for adverse reactions (e.g., sulfa allergies or renal issues) if the patient{`'`}s data input was incomplete or inaccurate.
                </Text>
              </View>
            </View>
            
            <CheckboxItem
              checked={tosChecks.recommendationLimitations}
              onPress={() => toggleCheck('recommendationLimitations')}
              label="I understand that AI recommendations are limited and outcomes are not guaranteed"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lock size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>4.</Text>
              <Text style={styles.sectionTitle}>Data Privacy & Bio-Data Protection</Text>
            </View>
            
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>4.1 Biometric & Clinical Data</Text>
              <View style={styles.legalTextBox}>
                <Text style={styles.legalText}>
                  All facial images and clinical inputs are encrypted and stored in compliance with HIPAA and applicable State-specific Data Privacy Acts. As of January 1, 2026, all data for Texas-based users is stored on U.S.-based servers in accordance with SB 1188.
                </Text>
              </View>
            </View>

            <View style={styles.privacyHighlights}>
              <View style={styles.privacyItem}>
                <View style={styles.privacyDot} />
                <Text style={styles.privacyText}>HIPAA Compliant Data Handling</Text>
              </View>
              <View style={styles.privacyItem}>
                <View style={styles.privacyDot} />
                <Text style={styles.privacyText}>End-to-End Encryption</Text>
              </View>
              <View style={styles.privacyItem}>
                <View style={styles.privacyDot} />
                <Text style={styles.privacyText}>No Third-Party AI Model Training</Text>
              </View>
              <View style={styles.privacyItem}>
                <View style={styles.privacyDot} />
                <Text style={styles.privacyText}>U.S.-Based Server Storage</Text>
              </View>
            </View>
            
            <CheckboxItem
              checked={tosChecks.dataPrivacy}
              onPress={() => toggleCheck('dataPrivacy')}
              label="I acknowledge the data privacy practices and agree to handle patient data accordingly"
            />
          </View>

          {!hasReadAll && (
            <View style={styles.scrollPrompt}>
              <ChevronDown size={16} color={Colors.textMuted} />
              <Text style={styles.scrollPromptText}>Scroll to read all sections</Text>
            </View>
          )}

          <View style={styles.signatureSection}>
            <Text style={styles.signatureSectionTitle}>PRACTITIONER ACKNOWLEDGMENT</Text>
            
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <Building2 size={14} color={Colors.textMuted} />
                <Text style={styles.inputLabel}>Clinic/Practice Name (Optional)</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={clinicName}
                onChangeText={setClinicName}
                placeholder="Enter clinic or practice name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <MapPin size={14} color={Colors.textMuted} />
                <Text style={styles.inputLabel}>State Jurisdiction *</Text>
              </View>
              <TouchableOpacity
                style={styles.stateSelector}
                onPress={() => setShowStateSelector(!showStateSelector)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.stateSelectorText,
                  !stateJurisdiction && styles.stateSelectorPlaceholder
                ]}>
                  {stateJurisdiction || 'Select your state'}
                </Text>
                <ChevronDown size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              
              {showStateSelector && (
                <View style={styles.stateList}>
                  <ScrollView style={styles.stateListScroll} nestedScrollEnabled>
                    {US_STATES.map((state) => (
                      <TouchableOpacity
                        key={state}
                        style={[
                          styles.stateItem,
                          state === stateJurisdiction && styles.stateItemSelected
                        ]}
                        onPress={() => selectState(state)}
                      >
                        <Text style={[
                          styles.stateItemText,
                          state === stateJurisdiction && styles.stateItemTextSelected
                        ]}>
                          {state}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Practitioner Credentials *</Text>
              <TextInput
                style={styles.textInput}
                value={practitionerCredentials}
                onChangeText={setPractitionerCredentials}
                placeholder="e.g., MD, DO, NP, RN, PA-C"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Digital Signature *</Text>
              <TextInput
                style={styles.signatureInput}
                value={practitionerSignature}
                onChangeText={setPractitionerSignature}
                placeholder="Type your full name as signature"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.timestampBox}>
              <Text style={styles.timestampLabel}>Timestamp</Text>
              <Text style={styles.timestampValue}>
                {new Date().toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.legalDisclaimer}>
            <Text style={styles.legalDisclaimerText}>
              By accepting these Terms of Service, you certify that you are a licensed healthcare professional authorized to practice in your stated jurisdiction and that you will use {appName} in accordance with all applicable federal and state regulations.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.declineButtonText}>DECLINE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!canSubmit}
          >
            <Text style={styles.acceptButtonText}>ACCEPT TERMS</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  subHeaderText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.gold,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionNumber: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.white,
    flex: 1,
  },
  liabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  liabilityBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  complianceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  complianceBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#3b82f6',
    letterSpacing: 1,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  legalTextBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  legalText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  treatmentCategory: {
    marginBottom: 16,
  },
  treatmentCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  treatmentCategoryTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  privacyHighlights: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  privacyText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  checkboxLabelChecked: {
    color: Colors.success,
  },
  scrollPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  scrollPromptText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  signatureSection: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginBottom: 16,
  },
  signatureSectionTitle: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  signatureInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    fontStyle: 'italic',
  },
  stateSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateSelectorText: {
    fontSize: 14,
    color: Colors.white,
  },
  stateSelectorPlaceholder: {
    color: Colors.textMuted,
  },
  stateList: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  stateListScroll: {
    maxHeight: 200,
  },
  stateItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stateItemSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  stateItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  stateItemTextSelected: {
    color: Colors.gold,
    fontWeight: '600' as const,
  },
  timestampBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timestampValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  legalDisclaimer: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  legalDisclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  declineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: 'transparent',
  },
  declineButtonText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  acceptButton: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.gold,
  },
  acceptButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
