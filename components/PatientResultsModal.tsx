import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  User,
  Phone,
  Sparkles,
  Syringe,
  FlaskConical,
  Beaker,
  Droplets,
  Search,
  ChevronRight,
  Calendar,
  Info,
  Shield,
  AlertTriangle,
  Ban,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Lead, ClinicalProcedure } from '@/types';
import AuraScoreGauge from '@/components/AuraScoreGauge';

interface PatientResultsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PatientResultsModal({ visible, onClose }: PatientResultsModalProps) {
  const { findPatientByPhone, patientBasicInfo } = useApp();
  const [phoneInput, setPhoneInput] = useState('');
  const [foundPatient, setFoundPatient] = useState<Lead | null>(null);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhoneInput(formatPhoneNumber(text));
    setSearchError('');
    setHasSearched(false);
  };

  const handleSearch = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const cleaned = phoneInput.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setSearchError('Please enter a valid 10-digit phone number');
      return;
    }

    const patient = findPatientByPhone(cleaned);
    setHasSearched(true);
    
    if (patient) {
      setFoundPatient(patient);
      setSearchError('');
      console.log('[PatientResults] Found patient:', patient.name);
    } else {
      setFoundPatient(null);
      setSearchError('No previous scan found for this phone number');
    }
  }, [phoneInput, findPatientByPhone]);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPhoneInput('');
    setFoundPatient(null);
    setSearchError('');
    setHasSearched(false);
    onClose();
  };

  const handleBackToSearch = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFoundPatient(null);
    setHasSearched(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderSafetyBadge = (safetyStatus: ClinicalProcedure['safetyStatus']) => {
    if (!safetyStatus) return null;

    if (safetyStatus.isBlocked) {
      return (
        <View style={styles.safetyBadgeBlocked}>
          <Ban size={10} color="#ef4444" />
          <Text style={styles.safetyBadgeBlockedText}>CONTRAINDICATED</Text>
        </View>
      );
    }

    if (safetyStatus.isConditional) {
      return (
        <View style={styles.safetyBadgeConditional}>
          <FileText size={10} color={Colors.gold} />
          <Text style={styles.safetyBadgeConditionalText}>LAB REQUIRED</Text>
        </View>
      );
    }

    if (safetyStatus.hasCautions) {
      return (
        <View style={styles.safetyBadgeCaution}>
          <AlertCircle size={10} color="#f59e0b" />
          <Text style={styles.safetyBadgeCautionText}>CAUTION</Text>
        </View>
      );
    }

    return (
      <View style={styles.safetyBadgeSafe}>
        <Shield size={10} color={Colors.success} />
        <Text style={styles.safetyBadgeSafeText}>CLEARED</Text>
      </View>
    );
  };

  const renderResults = () => {
    if (!foundPatient) return null;

    return (
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <User size={28} color={Colors.gold} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{foundPatient.name}</Text>
            <View style={styles.patientMeta}>
              <Calendar size={12} color={Colors.textMuted} />
              <Text style={styles.patientDate}>Scanned {formatDate(foundPatient.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.scoreSection}>
          <AuraScoreGauge score={foundPatient.auraScore} size={140} />
          <View style={styles.scoreInfo}>
            <Text style={styles.faceType}>{foundPatient.faceType}</Text>
            {foundPatient.skinIQ && (
              <View style={styles.skinIQTags}>
                {Object.entries(foundPatient.skinIQ).map(([key, value]) => (
                  <View key={key} style={styles.skinIQTag}>
                    <Text style={styles.skinIQTagText}>
                      {key.toUpperCase()}: {value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {foundPatient.roadmap && foundPatient.roadmap.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Syringe size={16} color={Colors.gold} />
              <Text style={styles.sectionTitle}>CLINICAL ROADMAP</Text>
            </View>
            {foundPatient.roadmap.map((proc, index) => (
              <View key={index} style={[styles.treatmentCard, proc.safetyStatus?.isBlocked && styles.treatmentCardBlocked]}>
                <View style={styles.treatmentHeader}>
                  <Text style={[styles.treatmentName, proc.safetyStatus?.isBlocked && styles.treatmentNameBlocked]}>
                    {proc.name}
                  </Text>
                  {renderSafetyBadge(proc.safetyStatus)}
                </View>
                <Text style={styles.treatmentPrice}>{proc.price}</Text>
                <Text style={styles.treatmentBenefit}>{proc.benefit}</Text>
                {proc.clinicalReason && (
                  <View style={styles.clinicalReasonBox}>
                    <View style={styles.clinicalReasonHeader}>
                      <Info size={11} color={Colors.gold} />
                      <Text style={styles.clinicalReasonLabel}>Clinical Indication</Text>
                    </View>
                    <Text style={styles.clinicalReasonText}>{proc.clinicalReason}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {foundPatient.peptides && foundPatient.peptides.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FlaskConical size={16} color={Colors.gold} />
              <Text style={styles.sectionTitle}>PEPTIDE THERAPY</Text>
            </View>
            {foundPatient.peptides.map((peptide, index) => (
              <View key={index} style={[styles.treatmentCard, peptide.safetyStatus?.isBlocked && styles.treatmentCardBlocked]}>
                <View style={styles.treatmentHeader}>
                  <Text style={[styles.treatmentName, peptide.safetyStatus?.isBlocked && styles.treatmentNameBlocked]}>
                    {peptide.name}
                  </Text>
                  {renderSafetyBadge(peptide.safetyStatus)}
                </View>
                <Text style={styles.treatmentBenefit}>{peptide.goal}</Text>
                <View style={styles.peptideDetailBox}>
                  <Text style={styles.peptideDetailLabel}>Mechanism</Text>
                  <Text style={styles.peptideDetailText}>{peptide.mechanism}</Text>
                </View>
                <View style={styles.peptideFrequencyBox}>
                  <Text style={styles.peptideFrequencyLabel}>Protocol</Text>
                  <Text style={styles.peptideFrequencyText}>{peptide.frequency}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {foundPatient.ivDrips && foundPatient.ivDrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Beaker size={16} color={Colors.gold} />
              <Text style={styles.sectionTitle}>IV OPTIMIZATION</Text>
            </View>
            {foundPatient.ivDrips.map((iv, index) => (
              <View key={index} style={[styles.treatmentCard, iv.safetyStatus?.isBlocked && styles.treatmentCardBlocked]}>
                <View style={styles.treatmentHeader}>
                  <Text style={[styles.treatmentName, iv.safetyStatus?.isBlocked && styles.treatmentNameBlocked]}>
                    {iv.name}
                  </Text>
                  {renderSafetyBadge(iv.safetyStatus)}
                </View>
                <Text style={styles.treatmentBenefit}>{iv.benefit}</Text>
                <View style={styles.ivIngredientsBox}>
                  <Text style={styles.ivIngredientsLabel}>Formula</Text>
                  <Text style={styles.ivIngredientsText}>{iv.ingredients}</Text>
                </View>
                <View style={styles.ivDurationBox}>
                  <Text style={styles.ivDurationLabel}>Duration</Text>
                  <Text style={styles.ivDurationText}>{iv.duration}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {foundPatient.volumeAssessment && foundPatient.volumeAssessment.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Droplets size={16} color={Colors.gold} />
              <Text style={styles.sectionTitle}>VOLUME ASSESSMENT</Text>
            </View>
            {foundPatient.volumeAssessment.map((zone, index) => (
              <View key={index} style={styles.volumeCard}>
                <View style={styles.volumeHeader}>
                  <Text style={styles.volumeZoneName}>{zone.zone}</Text>
                  <View style={[
                    styles.volumeBadge,
                    zone.volumeLoss >= 35 ? styles.volumeHigh :
                    zone.volumeLoss >= 20 ? styles.volumeMedium : styles.volumeLow
                  ]}>
                    <Text style={[
                      styles.volumeBadgeText,
                      zone.volumeLoss >= 35 ? styles.volumeHighText :
                      zone.volumeLoss >= 20 ? styles.volumeMediumText : styles.volumeLowText
                    ]}>{zone.volumeLoss}% LOSS</Text>
                  </View>
                </View>
                <View style={styles.volumeBarContainer}>
                  <View style={styles.volumeBarBackground}>
                    <View 
                      style={[
                        styles.volumeBarFill,
                        { width: `${zone.volumeLoss}%` },
                        zone.volumeLoss >= 35 ? styles.volumeBarHigh :
                        zone.volumeLoss >= 20 ? styles.volumeBarMedium : styles.volumeBarLow
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.volumeRecommendation}>{zone.recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.disclaimerBox}>
          <AlertTriangle size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            These recommendations were generated based on your previous scan. 
            Schedule a consultation for personalized treatment planning.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sparkles size={24} color={Colors.gold} />
            <Text style={styles.headerTitle}>
              {foundPatient ? 'Your Recommendations' : 'Find Your Results'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {foundPatient ? (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToSearch}
              activeOpacity={0.7}
            >
              <ChevronRight size={16} color={Colors.gold} style={{ transform: [{ rotate: '180deg' }] }} />
              <Text style={styles.backButtonText}>Search Again</Text>
            </TouchableOpacity>
            {renderResults()}
          </>
        ) : (
          <View style={styles.searchContainer}>
            <View style={styles.searchIcon}>
              <Phone size={32} color={Colors.gold} />
            </View>
            <Text style={styles.searchTitle}>Enter Your Phone Number</Text>
            <Text style={styles.searchSubtitle}>
              We'll look up your previous scan results
            </Text>

            <View style={styles.inputContainer}>
              <Phone size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="(555) 555-5555"
                placeholderTextColor={Colors.textMuted}
                value={phoneInput}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={14}
                autoFocus
              />
            </View>

            {searchError ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.searchButton,
                phoneInput.replace(/\D/g, '').length < 10 && styles.searchButtonDisabled
              ]}
              onPress={handleSearch}
              activeOpacity={0.8}
              disabled={phoneInput.replace(/\D/g, '').length < 10}
            >
              <Search size={18} color={Colors.black} />
              <Text style={styles.searchButtonText}>FIND MY RESULTS</Text>
            </TouchableOpacity>

            {!hasSearched && (
              <Text style={styles.privacyNote}>
                Your data is securely stored and encrypted
              </Text>
            )}
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gold,
  },
  searchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  searchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  searchTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  searchSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 24,
    width: '100%',
    maxWidth: 320,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  privacyNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 16,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreInfo: {
    flex: 1,
  },
  faceType: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 12,
  },
  skinIQTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skinIQTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  skinIQTagText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  treatmentCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  treatmentCardBlocked: {
    opacity: 0.7,
    borderColor: '#ef4444',
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  treatmentName: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  treatmentNameBlocked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  treatmentPrice: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gold,
    marginBottom: 8,
  },
  treatmentBenefit: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    marginBottom: 12,
  },
  clinicalReasonBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  clinicalReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  clinicalReasonLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  clinicalReasonText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  peptideDetailBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  peptideDetailLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  peptideDetailText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },
  peptideFrequencyBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 12,
  },
  peptideFrequencyLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.success,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  peptideFrequencyText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },
  ivIngredientsBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  ivIngredientsLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ivIngredientsText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },
  ivDurationBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
  },
  ivDurationLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ivDurationText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },
  volumeCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  volumeZoneName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  volumeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  volumeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  volumeMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  volumeLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  volumeBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  volumeHighText: {
    color: '#ef4444',
  },
  volumeMediumText: {
    color: Colors.gold,
  },
  volumeLowText: {
    color: Colors.success,
  },
  volumeBarContainer: {
    marginBottom: 10,
  },
  volumeBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  volumeBarHigh: {
    backgroundColor: '#ef4444',
  },
  volumeBarMedium: {
    backgroundColor: Colors.gold,
  },
  volumeBarLow: {
    backgroundColor: Colors.success,
  },
  volumeRecommendation: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  safetyBadgeBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeBlockedText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  safetyBadgeConditional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeConditionalText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  safetyBadgeCaution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeCautionText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  safetyBadgeSafe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeSafeText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: Colors.success,
    letterSpacing: 0.5,
  },
});
