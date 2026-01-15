import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { 
  X, 
  Phone, 
  Sparkles, 
  Syringe, 
  Droplets, 
  FlaskConical,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  RefreshCcw,
  Clock,
  Info,
  Printer,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Lead, ClinicalProcedure, PeptideTherapy, IVOptimization, SelectedTreatment, TreatmentDosingSettings, ComplianceSignOff, TREATMENT_RECURRENCE_MAP } from '@/types';
import { useApp } from '@/contexts/AppContext';
import TreatmentDosingModal from '@/components/TreatmentDosingModal';

interface LeadDetailModalProps {
  visible: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function LeadDetailModal({ visible, onClose, lead }: LeadDetailModalProps) {
  const { updateLeadTreatments } = useApp();
  const [selectedTreatmentForDosing, setSelectedTreatmentForDosing] = useState<{
    treatment: ClinicalProcedure | PeptideTherapy | IVOptimization;
    type: 'procedure' | 'peptide' | 'iv';
  } | null>(null);
  const [showPatientPrintSummary, setShowPatientPrintSummary] = useState(false);

  const confirmedTreatments = useMemo(() => lead?.selectedTreatments || [], [lead?.selectedTreatments]);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPatientPrintSummary(false);
    onClose();
  };

  const handlePrintPatient = () => {
    if (Platform.OS === 'web') {
      window.print();
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getPatientSignedOffTreatments = useCallback(() => {
    if (!lead) return [];
    return confirmedTreatments.filter(st => st.complianceSignOff?.acknowledged);
  }, [lead, confirmedTreatments]);

  const getPatientRecommendedTreatments = useCallback(() => {
    if (!lead) return [];
    const recommended: { treatmentName: string; type: string; price: string }[] = [];
    const invalidPatterns = ['loading', 'please wait', 'analyzing', '---', 'generating', 'processing'];
    
    const isValidName = (name: string | undefined): boolean => {
      if (!name) return false;
      const lower = name.toLowerCase().trim();
      return !invalidPatterns.some(pattern => lower.includes(pattern)) && lower !== '' && lower !== '...';
    };
    
    lead.roadmap?.forEach(t => {
      if (isValidName(t.name)) {
        recommended.push({ treatmentName: t.name, type: 'Procedure', price: t.price });
      }
    });
    lead.peptides?.forEach(t => {
      if (isValidName(t.name)) {
        recommended.push({ treatmentName: t.name, type: 'Peptide', price: '-' });
      }
    });
    lead.ivDrips?.forEach(t => {
      if (isValidName(t.name)) {
        recommended.push({ treatmentName: t.name, type: 'IV Therapy', price: '-' });
      }
    });
    return recommended;
  }, [lead]);

  const handleSelectTreatment = useCallback((treatment: ClinicalProcedure | PeptideTherapy | IVOptimization, type: 'procedure' | 'peptide' | 'iv') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedTreatmentForDosing({ treatment, type });
  }, []);

  const handleConfirmDosing = useCallback((dosing: TreatmentDosingSettings, signOff?: ComplianceSignOff) => {
    if (!selectedTreatmentForDosing || !lead) return;
    
    const newSelection: SelectedTreatment = {
      treatment: selectedTreatmentForDosing.treatment,
      treatmentType: selectedTreatmentForDosing.type,
      dosing,
      selectedAt: new Date(),
      complianceSignOff: signOff,
    };
    
    const updatedTreatments = [...confirmedTreatments, newSelection];
    updateLeadTreatments(lead.id, updatedTreatments);
    setSelectedTreatmentForDosing(null);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('Treatment confirmed with dosing and sign-off:', newSelection);
  }, [selectedTreatmentForDosing, lead, confirmedTreatments, updateLeadTreatments]);

  const isTreatmentConfirmed = useCallback((treatmentName: string) => {
    return confirmedTreatments.some(ct => {
      if ('name' in ct.treatment) return ct.treatment.name === treatmentName;
      return false;
    });
  }, [confirmedTreatments]);

  const recurringRevenueData = useMemo(() => {
    if (!lead) return { treatments: [], totalAnnual: 0 };

    const treatments: {
      name: string;
      pricePerSession: number;
      intervalMonths: number;
      description: string;
      annualSessions: number;
      annualValue: number;
    }[] = [];

    const allTreatments = [
      ...(lead.roadmap || []).map(t => ({ name: t.name, price: t.price })),
      ...(lead.peptides || []).map(t => ({ name: t.name, price: '$150-300' })),
      ...(lead.ivDrips || []).map(t => ({ name: t.name, price: '$200-400' })),
    ];

    allTreatments.forEach(treatment => {
      const recurrence = TREATMENT_RECURRENCE_MAP[treatment.name];
      if (recurrence && recurrence.intervalMonths > 0) {
        const priceMatch = treatment.price.match(/\$?([\d,]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
        const annualSessions = Math.round(12 / recurrence.intervalMonths);
        const annualValue = price * annualSessions;

        treatments.push({
          name: treatment.name,
          pricePerSession: price,
          intervalMonths: recurrence.intervalMonths,
          description: recurrence.description,
          annualSessions,
          annualValue,
        });
      }
    });

    const totalAnnual = treatments.reduce((sum, t) => sum + t.annualValue, 0);

    return { treatments, totalAnnual };
  }, [lead]);

  const isValidTreatment = useCallback((treatment: { name?: string; benefit?: string; goal?: string; clinicalReason?: string; price?: string }) => {
    if (!treatment || !treatment.name) return false;
    
    const invalidPatterns = ['loading', 'please wait', 'analyzing', '---', 'generating', 'processing'];
    
    const checkField = (field: string | undefined): boolean => {
      if (!field) return false;
      const lower = field.toLowerCase().trim();
      return invalidPatterns.some(pattern => lower.includes(pattern)) || lower === '' || lower === '...';
    };
    
    const nameInvalid = checkField(treatment.name);
    const benefitInvalid = checkField(treatment.benefit) || checkField(treatment.goal);
    const reasonInvalid = checkField((treatment as { clinicalReason?: string }).clinicalReason);
    const priceInvalid = treatment.price === '---' || treatment.price === '' || treatment.price === undefined;
    
    const isInvalid = nameInvalid || benefitInvalid || reasonInvalid || priceInvalid;
    
    if (isInvalid) {
      console.log('Filtering out invalid treatment:', treatment.name, '- nameInvalid:', nameInvalid, 'benefitInvalid:', benefitInvalid, 'reasonInvalid:', reasonInvalid, 'priceInvalid:', priceInvalid);
    }
    
    return !isInvalid;
  }, []);

  const validRoadmap = useMemo(() => {
    const roadmap = lead?.roadmap || [];
    console.log('Filtering roadmap - total items:', roadmap.length);
    const filtered = roadmap.filter(item => {
      const valid = isValidTreatment(item);
      return valid;
    });
    console.log('Valid roadmap items after filter:', filtered.length);
    return filtered;
  }, [lead?.roadmap, isValidTreatment]);

  const validPeptides = useMemo(() => {
    const peptides = lead?.peptides || [];
    console.log('Filtering peptides - total items:', peptides.length);
    const filtered = peptides.filter(item => isValidTreatment(item));
    console.log('Valid peptides after filter:', filtered.length);
    return filtered;
  }, [lead?.peptides, isValidTreatment]);

  const validIvDrips = useMemo(() => {
    const ivDrips = lead?.ivDrips || [];
    console.log('Filtering IV drips - total items:', ivDrips.length);
    const filtered = ivDrips.filter(item => isValidTreatment(item));
    console.log('Valid IV drips after filter:', filtered.length);
    return filtered;
  }, [lead?.ivDrips, isValidTreatment]);

  const hasNoValidTreatments = useMemo(() => {
    return validRoadmap.length === 0 && validPeptides.length === 0 && validIvDrips.length === 0;
  }, [validRoadmap, validPeptides, validIvDrips]);

  if (!lead) return null;

  const roadmapTotal = validRoadmap.reduce((acc, proc) => {
    const price = parseFloat(proc.price?.replace(/[^0-9.-]/g, '') || '0');
    return acc + price;
  }, 0);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{lead.name?.[0] || '?'}</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{lead.name}</Text>
              <Text style={styles.headerSubtitle}>Patient Report</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.printPatientButton}
              onPress={() => setShowPatientPrintSummary(true)}
              activeOpacity={0.7}
            >
              <Printer size={16} color={Colors.gold} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Phone size={16} color={Colors.textMuted} />
              <Text style={styles.infoCardLabel}>Phone</Text>
              <Text style={styles.infoCardValue}>{lead.phone}</Text>
            </View>
            <View style={styles.infoCard}>
              <Sparkles size={16} color={Colors.gold} />
              <Text style={styles.infoCardLabel}>Aura Score</Text>
              <Text style={styles.infoCardValueGold}>{lead.auraScore}</Text>
            </View>
            <View style={styles.infoCard}>
              <Calendar size={16} color={Colors.textMuted} />
              <Text style={styles.infoCardLabel}>Captured</Text>
              <Text style={styles.infoCardValue}>{formatDate(lead.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <View style={styles.revenueIconContainer}>
                <DollarSign size={24} color={Colors.gold} />
              </View>
              <View>
                <Text style={styles.revenueLabel}>ESTIMATED TREATMENT VALUE</Text>
                <Text style={styles.revenueValue}>${lead.estimatedValue?.toLocaleString() || '0'}</Text>
              </View>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueBreakdown}>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueRowLabel}>Clinical Procedures</Text>
                <Text style={styles.revenueRowValue}>${roadmapTotal.toLocaleString()}</Text>
              </View>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueRowLabel}>Treatments Selected</Text>
                <Text style={styles.revenueRowValue}>{confirmedTreatments.length}</Text>
              </View>
            </View>
          </View>

          {recurringRevenueData.treatments.length > 0 && (
            <View style={styles.recurringCard}>
              <View style={styles.recurringHeader}>
                <View style={styles.recurringIconContainer}>
                  <RefreshCcw size={20} color="#10b981" />
                </View>
                <View style={styles.recurringHeaderText}>
                  <Text style={styles.recurringLabel}>RECURRING POTENTIAL</Text>
                  <Text style={styles.recurringSubtitle}>If all treatment plans are followed</Text>
                </View>
              </View>
              <View style={styles.recurringTotal}>
                <Text style={styles.recurringTotalLabel}>Annual Value</Text>
                <Text style={styles.recurringTotalValue}>
                  ${recurringRevenueData.totalAnnual.toLocaleString()}/yr
                </Text>
              </View>
              <View style={styles.recurringDivider} />
              <View style={styles.recurringList}>
                {recurringRevenueData.treatments.map((treatment, index) => (
                  <View key={index} style={styles.recurringItem}>
                    <View style={styles.recurringItemHeader}>
                      <Text style={styles.recurringItemName}>{treatment.name}</Text>
                      <Text style={styles.recurringItemValue}>
                        ${treatment.annualValue.toLocaleString()}/yr
                      </Text>
                    </View>
                    <View style={styles.recurringItemDetails}>
                      <View style={styles.recurringItemBadge}>
                        <Clock size={10} color={Colors.textMuted} />
                        <Text style={styles.recurringItemBadgeText}>{treatment.description}</Text>
                      </View>
                      <Text style={styles.recurringItemSessions}>
                        ~{treatment.annualSessions} sessions/yr
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.recurringNote}>
                <Info size={12} color={Colors.textMuted} />
                <Text style={styles.recurringNoteText}>
                  Recurring estimates based on standard maintenance protocols
                </Text>
              </View>
            </View>
          )}

          {hasNoValidTreatments && (
            <View style={styles.noDataContainer}>
              <AlertCircle size={40} color={Colors.gold} />
              <Text style={styles.noDataTitle}>Treatment Plan Unavailable</Text>
              <Text style={styles.noDataText}>
                The treatment plan for this patient could not be loaded. This may be due to incomplete analysis data.
              </Text>
              <Text style={styles.noDataHint}>
                Please delete this record and perform a new scan to generate treatment recommendations.
              </Text>
            </View>
          )}

          {validRoadmap.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Syringe size={18} color={Colors.gold} />
                <Text style={styles.sectionTitle}>Clinical Roadmap</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{validRoadmap.length}</Text>
                </View>
              </View>
              {validRoadmap.map((procedure, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationName}>{procedure.name}</Text>
                    <Text style={styles.recommendationPrice}>{procedure.price}</Text>
                  </View>
                  <Text style={styles.recommendationBenefit}>{procedure.benefit}</Text>
                  {procedure.clinicalReason && (
                    <View style={styles.clinicalReasonBox}>
                      <Text style={styles.clinicalReasonLabel}>Clinical Reason</Text>
                      <Text style={styles.clinicalReasonText}>{procedure.clinicalReason}</Text>
                    </View>
                  )}
                  {TREATMENT_RECURRENCE_MAP[procedure.name] && (
                    <View style={styles.maintenanceBadge}>
                      <RefreshCcw size={10} color="#10b981" />
                      <Text style={styles.maintenanceBadgeText}>
                        Maintenance: {TREATMENT_RECURRENCE_MAP[procedure.name].description}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.selectTreatmentButton,
                      isTreatmentConfirmed(procedure.name) && styles.selectTreatmentButtonConfirmed
                    ]}
                    onPress={() => handleSelectTreatment(procedure, 'procedure')}
                    activeOpacity={0.8}
                    disabled={isTreatmentConfirmed(procedure.name)}
                  >
                    {isTreatmentConfirmed(procedure.name) ? (
                      <>
                        <CheckCircle size={14} color={Colors.success} />
                        <Text style={styles.selectTreatmentButtonTextConfirmed}>TREATMENT SELECTED</Text>
                      </>
                    ) : (
                      <Text style={styles.selectTreatmentButtonText}>SELECT TREATMENT</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {validPeptides.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FlaskConical size={18} color={Colors.success} />
                <Text style={styles.sectionTitle}>Peptide Therapies</Text>
                <View style={[styles.sectionBadge, styles.sectionBadgeGreen]}>
                  <Text style={[styles.sectionBadgeText, styles.sectionBadgeTextGreen]}>
                    {validPeptides.length}
                  </Text>
                </View>
              </View>
              {validPeptides.map((peptide, index) => (
                <View key={index} style={styles.peptideCard}>
                  <View style={styles.peptideHeader}>
                    <Text style={styles.peptideName}>{peptide.name}</Text>
                    <Text style={styles.peptideFrequency}>{peptide.frequency}</Text>
                  </View>
                  <Text style={styles.peptideGoal}>{peptide.goal}</Text>
                  {peptide.mechanism && (
                    <Text style={styles.peptideMechanism}>{peptide.mechanism}</Text>
                  )}
                  {TREATMENT_RECURRENCE_MAP[peptide.name] && (
                    <View style={styles.maintenanceBadge}>
                      <RefreshCcw size={10} color="#10b981" />
                      <Text style={styles.maintenanceBadgeText}>
                        Cycle: {TREATMENT_RECURRENCE_MAP[peptide.name].description}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.selectTreatmentButton,
                      isTreatmentConfirmed(peptide.name) && styles.selectTreatmentButtonConfirmed
                    ]}
                    onPress={() => handleSelectTreatment(peptide, 'peptide')}
                    activeOpacity={0.8}
                    disabled={isTreatmentConfirmed(peptide.name)}
                  >
                    {isTreatmentConfirmed(peptide.name) ? (
                      <>
                        <CheckCircle size={14} color={Colors.success} />
                        <Text style={styles.selectTreatmentButtonTextConfirmed}>TREATMENT SELECTED</Text>
                      </>
                    ) : (
                      <Text style={styles.selectTreatmentButtonText}>SELECT TREATMENT</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {validIvDrips.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Droplets size={18} color="#60a5fa" />
                <Text style={styles.sectionTitle}>IV Optimization</Text>
                <View style={[styles.sectionBadge, styles.sectionBadgeBlue]}>
                  <Text style={[styles.sectionBadgeText, styles.sectionBadgeTextBlue]}>
                    {validIvDrips.length}
                  </Text>
                </View>
              </View>
              {validIvDrips.map((iv, index) => (
                <View key={index} style={styles.ivCard}>
                  <View style={styles.ivHeader}>
                    <Text style={styles.ivName}>{iv.name}</Text>
                    <Text style={styles.ivDuration}>{iv.duration}</Text>
                  </View>
                  <Text style={styles.ivBenefit}>{iv.benefit}</Text>
                  {iv.ingredients && (
                    <View style={styles.ingredientsBox}>
                      <Text style={styles.ingredientsLabel}>Ingredients</Text>
                      <Text style={styles.ingredientsText}>{iv.ingredients}</Text>
                    </View>
                  )}
                  {TREATMENT_RECURRENCE_MAP[iv.name] && (
                    <View style={styles.maintenanceBadge}>
                      <RefreshCcw size={10} color="#10b981" />
                      <Text style={styles.maintenanceBadgeText}>
                        Schedule: {TREATMENT_RECURRENCE_MAP[iv.name].description}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.selectTreatmentButton,
                      isTreatmentConfirmed(iv.name) && styles.selectTreatmentButtonConfirmed
                    ]}
                    onPress={() => handleSelectTreatment(iv, 'iv')}
                    activeOpacity={0.8}
                    disabled={isTreatmentConfirmed(iv.name)}
                  >
                    {isTreatmentConfirmed(iv.name) ? (
                      <>
                        <CheckCircle size={14} color={Colors.success} />
                        <Text style={styles.selectTreatmentButtonTextConfirmed}>TREATMENT SELECTED</Text>
                      </>
                    ) : (
                      <Text style={styles.selectTreatmentButtonText}>SELECT TREATMENT</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.conversionTip}>
            <TrendingUp size={16} color={Colors.gold} />
            <Text style={styles.conversionTipText}>
              Contact within 24hrs for best patient engagement
            </Text>
          </View>
        </ScrollView>
      </View>

      <TreatmentDosingModal
        visible={selectedTreatmentForDosing !== null}
        treatment={selectedTreatmentForDosing?.treatment || null}
        treatmentType={selectedTreatmentForDosing?.type || 'procedure'}
        onClose={() => setSelectedTreatmentForDosing(null)}
        onConfirm={handleConfirmDosing}
        patientConditions={[]}
        skinIQData={undefined}
      />

      {showPatientPrintSummary && (
        <View style={styles.printOverlay}>
          <View style={styles.printModal}>
            <View style={styles.printHeader}>
              <View style={styles.printHeaderLeft}>
                <View style={styles.printAvatar}>
                  <Text style={styles.printAvatarText}>{lead.name?.[0] || '?'}</Text>
                </View>
                <View>
                  <Text style={styles.printTitle}>{lead.name}</Text>
                  <Text style={styles.printSubtitle}>Treatment Summary</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.printCloseButton}
                onPress={() => setShowPatientPrintSummary(false)}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.printContent} showsVerticalScrollIndicator={false}>
              <View style={styles.printPatientInfo}>
                <View style={styles.printInfoRow}>
                  <Text style={styles.printInfoLabel}>Phone:</Text>
                  <Text style={styles.printInfoValue}>{lead.phone}</Text>
                </View>
                <View style={styles.printInfoRow}>
                  <Text style={styles.printInfoLabel}>Aura Score:</Text>
                  <Text style={styles.printInfoValueGold}>{lead.auraScore}</Text>
                </View>
                <View style={styles.printInfoRow}>
                  <Text style={styles.printInfoLabel}>Est. Value:</Text>
                  <Text style={styles.printInfoValueGold}>${lead.estimatedValue?.toLocaleString() || '0'}</Text>
                </View>
              </View>

              <View style={styles.printSection}>
                <View style={styles.printSectionHeader}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.printSectionTitle}>SIGNED OFF TREATMENTS ({getPatientSignedOffTreatments().length})</Text>
                </View>
                {getPatientSignedOffTreatments().length === 0 ? (
                  <Text style={styles.printEmptyText}>No treatments signed off yet</Text>
                ) : (
                  getPatientSignedOffTreatments().map((st, index) => {
                    const treatmentName = 'name' in st.treatment ? st.treatment.name : 'Unknown';
                    return (
                      <View key={index} style={styles.printItem}>
                        <View style={styles.printItemLeft}>
                          <Text style={styles.printItemName}>{treatmentName}</Text>
                          {st.dosing && Object.keys(st.dosing).length > 0 && (
                            <View style={styles.printDosingContainer}>
                              {st.dosing.units && (
                                <Text style={styles.printDosingText}>Units: {st.dosing.units}</Text>
                              )}
                              {st.dosing.volume && (
                                <Text style={styles.printDosingText}>Volume: {st.dosing.volume}</Text>
                              )}
                              {st.dosing.depth && (
                                <Text style={styles.printDosingText}>Depth: {st.dosing.depth}</Text>
                              )}
                              {st.dosing.energy && (
                                <Text style={styles.printDosingText}>Energy: {st.dosing.energy}</Text>
                              )}
                              {st.dosing.passes && (
                                <Text style={styles.printDosingText}>Passes: {st.dosing.passes}</Text>
                              )}
                              {st.dosing.customNotes && (
                                <Text style={styles.printDosingText}>Notes: {st.dosing.customNotes}</Text>
                              )}
                            </View>
                          )}
                        </View>
                        <View style={styles.printItemRight}>
                          <Text style={styles.printItemType}>{st.treatmentType.toUpperCase()}</Text>
                          <Text style={styles.printSignedDate}>
                            {st.complianceSignOff?.signedAt 
                              ? new Date(st.complianceSignOff.signedAt).toLocaleDateString()
                              : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.printDivider} />

              <View style={styles.printSection}>
                <View style={styles.printSectionHeader}>
                  <Syringe size={16} color={Colors.gold} />
                  <Text style={styles.printSectionTitle}>ALL RECOMMENDATIONS ({getPatientRecommendedTreatments().length})</Text>
                </View>
                {getPatientRecommendedTreatments().length === 0 ? (
                  <Text style={styles.printEmptyText}>No recommendations</Text>
                ) : (
                  getPatientRecommendedTreatments().map((item, index) => (
                    <View key={index} style={styles.printItemCompact}>
                      <View style={styles.printItemLeft}>
                        <Text style={styles.printItemNameCompact}>{item.treatmentName}</Text>
                        <Text style={styles.printItemTypeCompact}>{item.type}</Text>
                      </View>
                      <View style={styles.printItemRight}>
                        {item.price !== '-' && (
                          <Text style={styles.printItemPrice}>{item.price}</Text>
                        )}
                        {isTreatmentConfirmed(item.treatmentName) && (
                          <View style={styles.printSelectedBadge}>
                            <CheckCircle size={10} color={Colors.success} />
                            <Text style={styles.printSelectedText}>Selected</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.printDivider} />

              <View style={styles.printSection}>
                <View style={styles.printSectionHeader}>
                  <DollarSign size={16} color={Colors.gold} />
                  <Text style={styles.printSectionTitle}>PATIENT SUMMARY</Text>
                </View>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{getPatientSignedOffTreatments().length}</Text>
                    <Text style={styles.summaryLabel}>Signed Off</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{confirmedTreatments.length}</Text>
                    <Text style={styles.summaryLabel}>Selected</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{getPatientRecommendedTreatments().length}</Text>
                    <Text style={styles.summaryLabel}>Recommended</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValueGold}>${lead.estimatedValue?.toLocaleString() || '0'}</Text>
                    <Text style={styles.summaryLabel}>Est. Value</Text>
                  </View>
                </View>
              </View>

              {recurringRevenueData.treatments.length > 0 && (
                <>
                  <View style={styles.printDivider} />
                  <View style={styles.printSection}>
                    <View style={styles.printSectionHeader}>
                      <RefreshCcw size={16} color="#10b981" />
                      <Text style={styles.printSectionTitle}>RECURRING POTENTIAL</Text>
                    </View>
                    <View style={styles.recurringPrintTotal}>
                      <Text style={styles.recurringPrintLabel}>Annual Value</Text>
                      <Text style={styles.recurringPrintValue}>${recurringRevenueData.totalAnnual.toLocaleString()}/yr</Text>
                    </View>
                    {recurringRevenueData.treatments.map((treatment, index) => (
                      <View key={index} style={styles.recurringPrintItem}>
                        <Text style={styles.recurringPrintItemName}>{treatment.name}</Text>
                        <Text style={styles.recurringPrintItemDetail}>
                          {treatment.description} • ~{treatment.annualSessions} sessions/yr
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.printFooter}>
                <Text style={styles.printFooterText}>
                  Generated: {new Date().toLocaleString()}
                </Text>
              </View>
            </ScrollView>

            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={styles.webPrintButton}
                onPress={handlePrintPatient}
                activeOpacity={0.8}
              >
                <Printer size={16} color={Colors.black} />
                <Text style={styles.webPrintButtonText}>PRINT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCardLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center',
  },
  infoCardValueGold: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.gold,
  },
  revenueCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  revenueIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.gold,
    marginTop: 2,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  revenueBreakdown: {
    gap: 10,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueRowLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  revenueRowValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  recurringCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  recurringIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringHeaderText: {
    flex: 1,
  },
  recurringLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#10b981',
    letterSpacing: 1.5,
  },
  recurringSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recurringTotal: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringTotalLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recurringTotalValue: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#10b981',
  },
  recurringDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  recurringList: {
    gap: 12,
  },
  recurringItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
  },
  recurringItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurringItemName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  recurringItemValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  recurringItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringItemBadgeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  recurringItemSessions: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  recurringNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recurringNoteText: {
    fontSize: 10,
    color: Colors.textMuted,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.white,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  sectionBadgeBlue: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  sectionBadgeTextGreen: {
    color: Colors.success,
  },
  sectionBadgeTextBlue: {
    color: '#60a5fa',
  },
  recommendationCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    flex: 1,
    marginRight: 12,
  },
  recommendationPrice: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  recommendationBenefit: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  clinicalReasonBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  clinicalReasonLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  clinicalReasonText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  maintenanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  maintenanceBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  selectTreatmentButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  selectTreatmentButtonConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  selectTreatmentButtonText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1.5,
  },
  selectTreatmentButtonTextConfirmed: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.success,
    letterSpacing: 1.5,
  },
  peptideCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  peptideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  peptideName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    flex: 1,
  },
  peptideFrequency: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  peptideGoal: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  peptideMechanism: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  ivCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  ivHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ivName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    flex: 1,
  },
  ivDuration: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ivBenefit: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  ingredientsBox: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  ingredientsLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#60a5fa',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ingredientsText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  conversionTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  conversionTipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.gold,
    flex: 1,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  noDataHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printPatientButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  printModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '95%',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  printHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  printHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  printAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printAvatarText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  printTitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.white,
  },
  printSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  printCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printContent: {
    padding: 20,
  },
  printPatientInfo: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  printInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  printInfoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  printInfoValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  printInfoValueGold: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  printSection: {
    marginBottom: 16,
  },
  printSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  printSectionTitle: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  printEmptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    paddingLeft: 26,
  },
  printItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  printItemLeft: {
    flex: 1,
  },
  printItemRight: {
    alignItems: 'flex-end',
  },
  printItemName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  printDosingContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  printDosingText: {
    fontSize: 11,
    color: Colors.text,
    marginBottom: 2,
  },
  printItemType: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  printSignedDate: {
    fontSize: 10,
    color: Colors.success,
  },
  printItemCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  printItemNameCompact: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  printItemTypeCompact: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  printItemPrice: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  printSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  printSelectedText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  printDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  summaryValueGold: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.gold,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  recurringPrintTotal: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recurringPrintLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recurringPrintValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#10b981',
  },
  recurringPrintItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recurringPrintItemName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  recurringPrintItemDetail: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  printFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  printFooterText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  webPrintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
  },
  webPrintButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
});
