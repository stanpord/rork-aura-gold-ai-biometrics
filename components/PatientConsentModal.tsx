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
  Brain,
  Lock,
  AlertTriangle,
  UserX,
  CheckSquare,
  Square,
  FileSignature,
  ChevronDown,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PatientConsent } from '@/types';

interface PatientConsentModalProps {
  visible: boolean;
  onClose: () => void;
  onConsent: (consent: PatientConsent) => void;
  appName?: string;
}

export default function PatientConsentModal({
  visible,
  onClose,
  onConsent,
  appName = 'Aura AI Biometrics',
}: PatientConsentModalProps) {
  const [hasReadAll, setHasReadAll] = useState(false);
  const [consentChecks, setConsentChecks] = useState({
    aiDisclosure: false,
    aiRole: false,
    dataPrivacy: false,
    risksLimitations: false,
    humanOnlyRight: false,
  });
  const [patientSignature, setPatientSignature] = useState('');
  const [autoFillSignature, setAutoFillSignature] = useState(true);
  const [providerSignature, setProviderSignature] = useState('');
  const [patientName, setPatientName] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const allChecked = Object.values(consentChecks).every(Boolean);
  const canSubmit = allChecked && patientSignature.trim() && providerSignature.trim() && patientName.trim();

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    if (isNearBottom && !hasReadAll) {
      setHasReadAll(true);
    }
  };

  const toggleCheck = (key: keyof typeof consentChecks) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setConsentChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const consent: PatientConsent = {
      patientName: patientName.trim(),
      patientSignature: patientSignature.trim(),
      providerSignature: providerSignature.trim(),
      consentedAt: new Date(),
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
        aiDisclosure: consentChecks.aiDisclosure,
        aiRole: consentChecks.aiRole,
        dataPrivacy: consentChecks.dataPrivacy,
        risksLimitations: consentChecks.risksLimitations,
        humanOnlyRight: consentChecks.humanOnlyRight,
      },
      optedOutOfAI: false,
    };

    onConsent(consent);
    resetForm();
  };

  const handleOptOut = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!patientName.trim() || !patientSignature.trim() || !providerSignature.trim()) {
      return;
    }

    const consent: PatientConsent = {
      patientName: patientName.trim(),
      patientSignature: patientSignature.trim(),
      providerSignature: providerSignature.trim(),
      consentedAt: new Date(),
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
        aiDisclosure: false,
        aiRole: false,
        dataPrivacy: false,
        risksLimitations: false,
        humanOnlyRight: true,
      },
      optedOutOfAI: true,
    };

    onConsent(consent);
    resetForm();
  };

  const resetForm = () => {
    setConsentChecks({
      aiDisclosure: false,
      aiRole: false,
      dataPrivacy: false,
      risksLimitations: false,
      humanOnlyRight: false,
    });
    setPatientSignature('');
    setProviderSignature('');
    setPatientName('');
    setHasReadAll(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
            <FileSignature size={20} color={Colors.gold} />
            <Text style={styles.headerTitle}>PATIENT INFORMED CONSENT</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>AI-Assisted Treatment Planning</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.patientNameSection}>
            <Text style={styles.inputLabel}>Patient Name</Text>
            <TextInput
              style={styles.textInput}
              value={patientName}
              onChangeText={(text) => {
                setPatientName(text);
                if (autoFillSignature) {
                  setPatientSignature(text);
                }
              }}
              placeholder="Enter patient full name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>1.</Text>
              <Text style={styles.sectionTitle}>Disclosure of AI Usage</Text>
            </View>
            <Text style={styles.sectionText}>
              I understand that {appName} utilizes Artificial Intelligence (AI) to assist my practitioner in identifying potential aesthetic treatments (such as Morpheus8, Botox, Hydrafacials, IV Drips, or Peptides). This AI analyzes my skin images, medical history, and clinical goals to suggest options.
            </Text>
            <CheckboxItem
              checked={consentChecks.aiDisclosure}
              onPress={() => toggleCheck('aiDisclosure')}
              label="I acknowledge the disclosure of AI usage in my treatment planning"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Brain size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>2.</Text>
              <Text style={styles.sectionTitle}>Understanding the AI{`'`}s Role</Text>
            </View>
            <Text style={styles.sectionSubtitle}>(Recommendation Only)</Text>
            <Text style={styles.sectionText}>
              I acknowledge and understand the following:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>The AI is not a doctor:</Text> The AI does not diagnose conditions or prescribe treatments.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Recommendation vs. Order:</Text> The AI provides a {`"suggested plan"`} only. It does not set final dosages or device parameters.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  <Text style={styles.boldText}>Human-in-the-Loop:</Text> My human practitioner is responsible for reviewing, adjusting, and finalizing all treatment plans. The AI is a {`"second set of eyes"`} to help ensure safety and consistency.
                </Text>
              </View>
            </View>
            <CheckboxItem
              checked={consentChecks.aiRole}
              onPress={() => toggleCheck('aiRole')}
              label="I understand the AI's advisory role and that my practitioner makes all final decisions"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lock size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>3.</Text>
              <Text style={styles.sectionTitle}>Data and Privacy</Text>
            </View>
            <Text style={styles.sectionText}>
              I consent to the AI processing my facial images and health data. I understand that my data is handled in accordance with HIPAA and that {appName} does not use my personal medical data to train public AI models without additional anonymization.
            </Text>
            <CheckboxItem
              checked={consentChecks.dataPrivacy}
              onPress={() => toggleCheck('dataPrivacy')}
              label="I consent to the processing of my facial images and health data"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>4.</Text>
              <Text style={styles.sectionTitle}>Risks and Limitations</Text>
            </View>
            <Text style={styles.sectionText}>
              While AI helps personalize my plan, I understand that:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  AI recommendations are based on statistical patterns and may not account for every individual biological variation.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  Clinical outcomes (e.g., the exact {`"look"`} of Botox or the healing time of Morpheus8) are not guaranteed by the AI{`'`}s recommendation.
                </Text>
              </View>
            </View>
            <CheckboxItem
              checked={consentChecks.risksLimitations}
              onPress={() => toggleCheck('risksLimitations')}
              label="I understand the risks and limitations of AI-assisted planning"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <UserX size={16} color={Colors.gold} />
              <Text style={styles.sectionNumber}>5.</Text>
              <Text style={styles.sectionTitle}>Right to a Human-Only Plan</Text>
            </View>
            <Text style={styles.sectionText}>
              I have been informed that I have the right to decline the use of AI in my treatment planning. If I opt-out, my practitioner will develop my plan using traditional manual methods without any impact on my quality of care.
            </Text>
            <CheckboxItem
              checked={consentChecks.humanOnlyRight}
              onPress={() => toggleCheck('humanOnlyRight')}
              label="I acknowledge my right to opt-out of AI-assisted planning"
            />
          </View>

          {!hasReadAll && (
            <View style={styles.scrollPrompt}>
              <ChevronDown size={16} color={Colors.textMuted} />
              <Text style={styles.scrollPromptText}>Scroll to read all sections</Text>
            </View>
          )}

          <View style={styles.signatureSection}>
            <Text style={styles.signatureSectionTitle}>SIGNATURES</Text>
            
            <View style={styles.signatureBox}>
              <Text style={styles.inputLabel}>Patient Signature (Digital)</Text>
              <TextInput
                style={styles.signatureInput}
                value={patientSignature}
                onChangeText={(text) => {
                  setPatientSignature(text);
                  if (text !== patientName) {
                    setAutoFillSignature(false);
                  }
                }}
                placeholder="Type your full name as signature"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
              {patientName && patientSignature === patientName && (
                <Text style={styles.autoFillHint}>Auto-filled from patient name</Text>
              )}
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.inputLabel}>Provider Acknowledgment (Digital)</Text>
              <TextInput
                style={styles.signatureInput}
                value={providerSignature}
                onChangeText={setProviderSignature}
                placeholder="Provider name and credentials"
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.optOutButton,
              (!patientName.trim() || !patientSignature.trim() || !providerSignature.trim()) && styles.buttonDisabled,
            ]}
            onPress={handleOptOut}
            activeOpacity={0.8}
            disabled={!patientName.trim() || !patientSignature.trim() || !providerSignature.trim()}
          >
            <UserX size={16} color={Colors.gold} />
            <Text style={styles.optOutButtonText}>OPT-OUT OF AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.consentButton, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!canSubmit}
          >
            <Text style={styles.consentButtonText}>PROVIDE CONSENT</Text>
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
  patientNameSection: {
    marginBottom: 24,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: -8,
  },
  sectionText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletList: {
    gap: 10,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700' as const,
    color: Colors.white,
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
  },
  signatureSectionTitle: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  signatureBox: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
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
  autoFillHint: {
    fontSize: 10,
    color: Colors.success,
    marginTop: 6,
    fontStyle: 'italic',
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
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optOutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.goldMuted,
    backgroundColor: 'transparent',
  },
  optOutButtonText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  consentButton: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.gold,
  },
  consentButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
