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
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
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
  const [showClientSummary, setShowClientSummary] = useState(false);

  const confirmedTreatments = useMemo(() => lead?.selectedTreatments || [], [lead?.selectedTreatments]);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

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

  if (!lead) return null;

  const roadmapTotal = lead.roadmap?.reduce((acc, proc) => {
    const price = parseFloat(proc.price?.replace(/[^0-9.-]/g, '') || '0');
    return acc + price;
  }, 0) || 0;

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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X size={20} color={Colors.white} />
          </TouchableOpacity>
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

          {lead.skinIQ && (
            <View style={styles.skinIQCard}>
              <Text style={styles.skinIQTitle}>SKIN IQ PROFILE</Text>
              <View style={styles.skinIQGrid}>
                <View style={styles.skinIQItem}>
                  <Text style={styles.skinIQLabel}>Texture</Text>
                  <Text style={styles.skinIQValue}>{lead.skinIQ.texture}</Text>
                </View>
                <View style={styles.skinIQItem}>
                  <Text style={styles.skinIQLabel}>Pores</Text>
                  <Text style={styles.skinIQValue}>{lead.skinIQ.pores}</Text>
                </View>
                <View style={styles.skinIQItem}>
                  <Text style={styles.skinIQLabel}>Pigment</Text>
                  <Text style={styles.skinIQValue}>{lead.skinIQ.pigment}</Text>
                </View>
                <View style={styles.skinIQItem}>
                  <Text style={styles.skinIQLabel}>Redness</Text>
                  <Text style={styles.skinIQValue}>{lead.skinIQ.redness}</Text>
                </View>
              </View>
            </View>
          )}

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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Syringe size={18} color={Colors.gold} />
              <Text style={styles.sectionTitle}>Clinical Roadmap</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{lead.roadmap?.length || 0}</Text>
              </View>
            </View>
            {(!lead.roadmap || lead.roadmap.length === 0) ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No procedures recommended</Text>
              </View>
            ) : (
              <>
                {lead.roadmap.map((procedure, index) => (
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
              </>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FlaskConical size={18} color={Colors.success} />
              <Text style={styles.sectionTitle}>Peptide Therapies</Text>
              <View style={[styles.sectionBadge, styles.sectionBadgeGreen]}>
                <Text style={[styles.sectionBadgeText, styles.sectionBadgeTextGreen]}>
                  {lead.peptides?.length || 0}
                </Text>
              </View>
            </View>
            {(!lead.peptides || lead.peptides.length === 0) ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No peptide therapies recommended</Text>
              </View>
            ) : (
              <>
                {lead.peptides.map((peptide, index) => (
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
              </>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Droplets size={18} color="#60a5fa" />
              <Text style={styles.sectionTitle}>IV Optimization</Text>
              <View style={[styles.sectionBadge, styles.sectionBadgeBlue]}>
                <Text style={[styles.sectionBadgeText, styles.sectionBadgeTextBlue]}>
                  {lead.ivDrips?.length || 0}
                </Text>
              </View>
            </View>
            {(!lead.ivDrips || lead.ivDrips.length === 0) ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No IV therapies recommended</Text>
              </View>
            ) : (
              <>
                {lead.ivDrips.map((iv, index) => (
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
              </>
            )}
          </View>

          <View style={styles.conversionTip}>
            <TrendingUp size={16} color={Colors.gold} />
            <Text style={styles.conversionTipText}>
              Contact within 24hrs for best patient engagement
            </Text>
          </View>

          {confirmedTreatments.length > 0 && (
            <View style={styles.clientSummarySection}>
              <TouchableOpacity
                style={styles.clientSummaryToggle}
                onPress={() => {
                  setShowClientSummary(!showClientSummary);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.clientSummaryToggleLeft}>
                  <FileText size={18} color={Colors.gold} />
                  <View>
                    <Text style={styles.clientSummaryToggleTitle}>CLIENT TREATMENT SUMMARY</Text>
                    <Text style={styles.clientSummaryToggleSubtitle}>
                      {confirmedTreatments.length} treatment{confirmedTreatments.length !== 1 ? 's' : ''} selected for patient
                    </Text>
                  </View>
                </View>
                {showClientSummary ? (
                  <ChevronUp size={20} color={Colors.textMuted} />
                ) : (
                  <ChevronDown size={20} color={Colors.textMuted} />
                )}
              </TouchableOpacity>

              {showClientSummary && (
                <View style={styles.clientSummaryContent}>
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryPatientInfo}>
                      <Text style={styles.summaryPatientName}>{lead.name}</Text>
                      <Text style={styles.summaryDate}>{formatDate(lead.createdAt)}</Text>
                    </View>
                    <View style={styles.summaryScoreBadge}>
                      <Sparkles size={12} color={Colors.gold} />
                      <Text style={styles.summaryScoreText}>AURA {lead.auraScore}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryDivider} />

                  <Text style={styles.summaryListTitle}>SELECTED TREATMENTS</Text>
                  
                  {confirmedTreatments.filter(ct => ct.treatmentType === 'procedure').length > 0 && (
                    <View style={styles.summaryCategory}>
                      <View style={styles.summaryCategoryHeader}>
                        <Syringe size={14} color={Colors.gold} />
                        <Text style={styles.summaryCategoryTitle}>Clinical Procedures</Text>
                      </View>
                      {confirmedTreatments
                        .filter(ct => ct.treatmentType === 'procedure')
                        .map((ct, index) => {
                          const treatment = ct.treatment as ClinicalProcedure;
                          return (
                            <View key={index} style={styles.summaryTreatmentItem}>
                              <View style={styles.summaryTreatmentRow}>
                                <CheckCircle size={14} color={Colors.success} />
                                <Text style={styles.summaryTreatmentName}>{treatment.name}</Text>
                                <Text style={styles.summaryTreatmentPrice}>{treatment.price}</Text>
                              </View>
                              {ct.dosing && Object.keys(ct.dosing).some(k => ct.dosing[k as keyof typeof ct.dosing]) && (
                                <View style={styles.summaryDosingBox}>
                                  <Text style={styles.summaryDosingLabel}>Protocol Notes:</Text>
                                  <Text style={styles.summaryDosingText}>
                                    {ct.dosing.depth && `Depth: ${ct.dosing.depth}`}
                                    {ct.dosing.energy && `${ct.dosing.depth ? ' • ' : ''}Energy: ${ct.dosing.energy}`}
                                    {ct.dosing.passes && `${(ct.dosing.depth || ct.dosing.energy) ? ' • ' : ''}Passes: ${ct.dosing.passes}`}
                                    {ct.dosing.units && `${(ct.dosing.depth || ct.dosing.energy || ct.dosing.passes) ? ' • ' : ''}Units: ${ct.dosing.units}`}
                                    {ct.dosing.customNotes && `\n${ct.dosing.customNotes}`}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                    </View>
                  )}

                  {confirmedTreatments.filter(ct => ct.treatmentType === 'peptide').length > 0 && (
                    <View style={styles.summaryCategory}>
                      <View style={styles.summaryCategoryHeader}>
                        <FlaskConical size={14} color={Colors.success} />
                        <Text style={styles.summaryCategoryTitle}>Peptide Therapies</Text>
                      </View>
                      {confirmedTreatments
                        .filter(ct => ct.treatmentType === 'peptide')
                        .map((ct, index) => {
                          const treatment = ct.treatment as PeptideTherapy;
                          return (
                            <View key={index} style={styles.summaryTreatmentItem}>
                              <View style={styles.summaryTreatmentRow}>
                                <CheckCircle size={14} color={Colors.success} />
                                <Text style={styles.summaryTreatmentName}>{treatment.name}</Text>
                                <Text style={styles.summaryTreatmentFreq}>{treatment.frequency}</Text>
                              </View>
                              {ct.dosing && Object.keys(ct.dosing).some(k => ct.dosing[k as keyof typeof ct.dosing]) && (
                                <View style={styles.summaryDosingBox}>
                                  <Text style={styles.summaryDosingLabel}>Protocol Notes:</Text>
                                  <Text style={styles.summaryDosingText}>
                                    {ct.dosing.dilution && `Dilution: ${ct.dosing.dilution}`}
                                    {ct.dosing.volume && `${ct.dosing.dilution ? ' • ' : ''}Volume: ${ct.dosing.volume}`}
                                    {ct.dosing.customNotes && `\n${ct.dosing.customNotes}`}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                    </View>
                  )}

                  {confirmedTreatments.filter(ct => ct.treatmentType === 'iv').length > 0 && (
                    <View style={styles.summaryCategory}>
                      <View style={styles.summaryCategoryHeader}>
                        <Droplets size={14} color="#60a5fa" />
                        <Text style={styles.summaryCategoryTitle}>IV Optimization</Text>
                      </View>
                      {confirmedTreatments
                        .filter(ct => ct.treatmentType === 'iv')
                        .map((ct, index) => {
                          const treatment = ct.treatment as IVOptimization;
                          return (
                            <View key={index} style={styles.summaryTreatmentItem}>
                              <View style={styles.summaryTreatmentRow}>
                                <CheckCircle size={14} color={Colors.success} />
                                <Text style={styles.summaryTreatmentName}>{treatment.name}</Text>
                                <Text style={styles.summaryTreatmentDuration}>{treatment.duration}</Text>
                              </View>
                              {ct.dosing && Object.keys(ct.dosing).some(k => ct.dosing[k as keyof typeof ct.dosing]) && (
                                <View style={styles.summaryDosingBox}>
                                  <Text style={styles.summaryDosingLabel}>Protocol Notes:</Text>
                                  <Text style={styles.summaryDosingText}>
                                    {ct.dosing.customNotes || 'Standard protocol'}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                    </View>
                  )}

                  <View style={styles.summaryTotalSection}>
                    <Text style={styles.summaryTotalLabel}>TREATMENTS SELECTED</Text>
                    <Text style={styles.summaryTotalCount}>{confirmedTreatments.length}</Text>
                  </View>

                  <View style={styles.summaryFooter}>
                    <Printer size={12} color={Colors.textMuted} />
                    <Text style={styles.summaryFooterText}>
                      Present this summary to your patient for their treatment plan review
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
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
  skinIQCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  skinIQTitle: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  skinIQGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skinIQItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
  },
  skinIQLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  skinIQValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  emptySection: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptySectionText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  clientSummarySection: {
    marginTop: 24,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    overflow: 'hidden',
  },
  clientSummaryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  clientSummaryToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientSummaryToggleTitle: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  clientSummaryToggleSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  clientSummaryContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  summaryPatientInfo: {
    flex: 1,
  },
  summaryPatientName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  summaryDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryScoreText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  summaryListTitle: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  summaryCategory: {
    marginBottom: 16,
  },
  summaryCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  summaryCategoryTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  summaryTreatmentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  summaryTreatmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTreatmentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  summaryTreatmentPrice: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  summaryTreatmentFreq: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  summaryTreatmentDuration: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#60a5fa',
  },
  summaryDosingBox: {
    marginTop: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 8,
    padding: 10,
  },
  summaryDosingLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryDosingText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },
  summaryTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.success,
    letterSpacing: 1,
  },
  summaryTotalCount: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.success,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryFooterText: {
    fontSize: 10,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 14,
  },
});
