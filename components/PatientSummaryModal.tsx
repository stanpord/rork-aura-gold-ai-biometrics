import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { 
  X, 
  Printer,
  Share2,
  Sparkles,
  Syringe,
  FlaskConical,
  Droplets,
  CheckCircle,
  Calendar,
  Phone,
  FileText,
  Activity,
  FileSignature,
  User,
  Stethoscope,
  Clock,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Lead, ClinicalProcedure, PeptideTherapy, IVOptimization } from '@/types';

interface PatientSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function PatientSummaryModal({ visible, onClose, lead }: PatientSummaryModalProps) {
  const confirmedTreatments = useMemo(() => lead?.selectedTreatments || [], [lead?.selectedTreatments]);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const generateSummaryText = (): string => {
    if (!lead) return '';

    let text = `PATIENT TREATMENT SUMMARY\n`;
    text += `${'═'.repeat(40)}\n\n`;
    text += `Patient: ${lead.name}\n`;
    text += `Phone: ${lead.phone}\n`;
    text += `Date: ${formatDate(lead.createdAt)}\n`;
    text += `Aura Score: ${lead.auraScore}/1000\n\n`;

    if (lead.skinIQ) {
      text += `SKIN ANALYSIS\n`;
      text += `${'─'.repeat(20)}\n`;
      text += `• Texture: ${lead.skinIQ.texture}\n`;
      text += `• Pores: ${lead.skinIQ.pores}\n`;
      text += `• Pigment: ${lead.skinIQ.pigment}\n`;
      text += `• Redness: ${lead.skinIQ.redness}\n\n`;
    }

    if (confirmedTreatments.length > 0) {
      text += `SELECTED TREATMENTS\n`;
      text += `${'─'.repeat(20)}\n`;
      
      const procedures = confirmedTreatments.filter(ct => ct.treatmentType === 'procedure');
      const peptides = confirmedTreatments.filter(ct => ct.treatmentType === 'peptide');
      const ivs = confirmedTreatments.filter(ct => ct.treatmentType === 'iv');

      if (procedures.length > 0) {
        text += `\nClinical Procedures:\n`;
        procedures.forEach(ct => {
          const t = ct.treatment as ClinicalProcedure;
          text += `  ✓ ${t.name} - ${t.price}\n`;
          if (ct.dosing?.customNotes) {
            text += `    Notes: ${ct.dosing.customNotes}\n`;
          }
        });
      }

      if (peptides.length > 0) {
        text += `\nPeptide Therapies:\n`;
        peptides.forEach(ct => {
          const t = ct.treatment as PeptideTherapy;
          text += `  ✓ ${t.name} - ${t.frequency}\n`;
        });
      }

      if (ivs.length > 0) {
        text += `\nIV Optimization:\n`;
        ivs.forEach(ct => {
          const t = ct.treatment as IVOptimization;
          text += `  ✓ ${t.name} - ${t.duration}\n`;
        });
      }
    } else {
      text += `RECOMMENDED TREATMENTS\n`;
      text += `${'─'.repeat(20)}\n`;

      if (lead.roadmap && lead.roadmap.length > 0) {
        text += `\nClinical Procedures:\n`;
        lead.roadmap.forEach(proc => {
          text += `  • ${proc.name} - ${proc.price}\n`;
          text += `    ${proc.benefit}\n`;
        });
      }

      if (lead.peptides && lead.peptides.length > 0) {
        text += `\nPeptide Therapies:\n`;
        lead.peptides.forEach(p => {
          text += `  • ${p.name} - ${p.frequency}\n`;
          text += `    ${p.goal}\n`;
        });
      }

      if (lead.ivDrips && lead.ivDrips.length > 0) {
        text += `\nIV Optimization:\n`;
        lead.ivDrips.forEach(iv => {
          text += `  • ${iv.name} - ${iv.duration}\n`;
          text += `    ${iv.benefit}\n`;
        });
      }
    }

    text += `\n${'═'.repeat(40)}\n`;
    text += `Estimated Treatment Value: $${lead.estimatedValue?.toLocaleString() || '0'}\n`;
    text += `\nThis summary is for informational purposes only.\n`;
    text += `Please consult with your provider for final treatment plans.`;

    return text;
  };

  const handlePrint = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const htmlContent = generatePrintHTML();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      Alert.alert(
        'Print Summary',
        'Use the Share option to send this summary to a printer or save as PDF.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const summaryText = generateSummaryText();

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `Treatment Summary - ${lead?.name}`,
            text: summaryText,
          });
        } else {
          await navigator.clipboard.writeText(summaryText);
          Alert.alert('Copied', 'Summary copied to clipboard');
        }
      } else {
        await Share.share({
          message: summaryText,
          title: `Treatment Summary - ${lead?.name}`,
        });
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const generatePrintHTML = (): string => {
    if (!lead) return '';

    const procedures = confirmedTreatments.filter(ct => ct.treatmentType === 'procedure');
    const peptides = confirmedTreatments.filter(ct => ct.treatmentType === 'peptide');
    const ivs = confirmedTreatments.filter(ct => ct.treatmentType === 'iv');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Treatment Summary - ${lead.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f59e0b; }
          .logo { font-size: 24px; font-weight: 900; color: #f59e0b; letter-spacing: 2px; }
          .title { font-size: 14px; color: #666; margin-top: 8px; letter-spacing: 1px; }
          .patient-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background: #fafafa; border-radius: 12px; }
          .patient-details h2 { font-size: 22px; margin-bottom: 8px; }
          .patient-details p { color: #666; font-size: 14px; margin: 4px 0; }
          .score-badge { text-align: center; padding: 15px 25px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; color: white; }
          .score-badge .score { font-size: 32px; font-weight: 900; }
          .score-badge .label { font-size: 10px; letter-spacing: 2px; opacity: 0.9; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 12px; font-weight: 700; color: #f59e0b; letter-spacing: 2px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
          .skin-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .skin-item { background: #f9f9f9; padding: 12px; border-radius: 8px; text-align: center; }
          .skin-item .label { font-size: 10px; color: #999; letter-spacing: 1px; }
          .skin-item .value { font-size: 14px; font-weight: 600; margin-top: 4px; }
          .treatment-card { background: #fafafa; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #f59e0b; }
          .treatment-card.peptide { border-left-color: #10b981; }
          .treatment-card.iv { border-left-color: #60a5fa; }
          .treatment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .treatment-name { font-size: 15px; font-weight: 600; }
          .treatment-price { font-size: 14px; font-weight: 700; color: #f59e0b; }
          .treatment-benefit { font-size: 13px; color: #666; line-height: 1.5; }
          .notes-box { background: #fff8e1; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 12px; color: #666; }
          .total-section { margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; color: white; display: flex; justify-content: space-between; align-items: center; }
          .total-label { font-size: 14px; letter-spacing: 1px; }
          .total-value { font-size: 28px; font-weight: 900; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 11px; line-height: 1.6; }
          .check-icon { color: #10b981; margin-right: 8px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AURA GOLD</div>
          <div class="title">PATIENT TREATMENT SUMMARY</div>
        </div>
        
        <div class="patient-info">
          <div class="patient-details">
            <h2>${lead.name}</h2>
            <p>📞 ${lead.phone}</p>
            <p>📅 ${formatDate(lead.createdAt)}</p>
          </div>
          <div class="score-badge">
            <div class="label">AURA SCORE</div>
            <div class="score">${lead.auraScore}</div>
          </div>
        </div>

        ${lead.skinIQ ? `
        <div class="section">
          <div class="section-title">SKIN ANALYSIS</div>
          <div class="skin-grid">
            <div class="skin-item">
              <div class="label">TEXTURE</div>
              <div class="value">${lead.skinIQ.texture}</div>
            </div>
            <div class="skin-item">
              <div class="label">PORES</div>
              <div class="value">${lead.skinIQ.pores}</div>
            </div>
            <div class="skin-item">
              <div class="label">PIGMENT</div>
              <div class="value">${lead.skinIQ.pigment}</div>
            </div>
            <div class="skin-item">
              <div class="label">REDNESS</div>
              <div class="value">${lead.skinIQ.redness}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${confirmedTreatments.length > 0 ? `
        <div class="section">
          <div class="section-title">✓ SELECTED TREATMENTS</div>
          ${procedures.length > 0 ? procedures.map(ct => {
            const t = ct.treatment as ClinicalProcedure;
            return `
              <div class="treatment-card">
                <div class="treatment-header">
                  <span class="treatment-name">✓ ${t.name}</span>
                  <span class="treatment-price">${t.price}</span>
                </div>
                <div class="treatment-benefit">${t.benefit}</div>
                ${ct.dosing?.customNotes ? `<div class="notes-box">Notes: ${ct.dosing.customNotes}</div>` : ''}
              </div>
            `;
          }).join('') : ''}
          ${peptides.length > 0 ? peptides.map(ct => {
            const t = ct.treatment as PeptideTherapy;
            return `
              <div class="treatment-card peptide">
                <div class="treatment-header">
                  <span class="treatment-name">✓ ${t.name}</span>
                  <span class="treatment-price" style="color:#10b981">${t.frequency}</span>
                </div>
                <div class="treatment-benefit">${t.goal}</div>
              </div>
            `;
          }).join('') : ''}
          ${ivs.length > 0 ? ivs.map(ct => {
            const t = ct.treatment as IVOptimization;
            return `
              <div class="treatment-card iv">
                <div class="treatment-header">
                  <span class="treatment-name">✓ ${t.name}</span>
                  <span class="treatment-price" style="color:#60a5fa">${t.duration}</span>
                </div>
                <div class="treatment-benefit">${t.benefit}</div>
              </div>
            `;
          }).join('') : ''}
        </div>
        ` : `
        <div class="section">
          <div class="section-title">RECOMMENDED TREATMENTS</div>
          ${lead.roadmap?.map(proc => `
            <div class="treatment-card">
              <div class="treatment-header">
                <span class="treatment-name">${proc.name}</span>
                <span class="treatment-price">${proc.price}</span>
              </div>
              <div class="treatment-benefit">${proc.benefit}</div>
            </div>
          `).join('') || ''}
          ${lead.peptides?.map(p => `
            <div class="treatment-card peptide">
              <div class="treatment-header">
                <span class="treatment-name">${p.name}</span>
                <span class="treatment-price" style="color:#10b981">${p.frequency}</span>
              </div>
              <div class="treatment-benefit">${p.goal}</div>
            </div>
          `).join('') || ''}
          ${lead.ivDrips?.map(iv => `
            <div class="treatment-card iv">
              <div class="treatment-header">
                <span class="treatment-name">${iv.name}</span>
                <span class="treatment-price" style="color:#60a5fa">${iv.duration}</span>
              </div>
              <div class="treatment-benefit">${iv.benefit}</div>
            </div>
          `).join('') || ''}
        </div>
        `}

        <div class="total-section">
          <div class="total-label">ESTIMATED TREATMENT VALUE</div>
          <div class="total-value">$${lead.estimatedValue?.toLocaleString() || '0'}</div>
        </div>

        <div class="footer">
          <p>This summary is for informational purposes only.</p>
          <p>Please consult with your provider for final treatment plans and pricing.</p>
          <p style="margin-top: 10px;">Generated by AURA GOLD • ${formatDate(new Date())}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (!lead) return null;

  const totalTreatments = (lead.roadmap?.length || 0) + (lead.peptides?.length || 0) + (lead.ivDrips?.length || 0);

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
            <FileText size={24} color={Colors.gold} />
            <View>
              <Text style={styles.headerTitle}>Patient Summary</Text>
              <Text style={styles.headerSubtitle}>Printable Treatment Report</Text>
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

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePrint}
            activeOpacity={0.8}
          >
            <Printer size={18} color={Colors.black} />
            <Text style={styles.actionButtonText}>PRINT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={Colors.gold} />
            <Text style={styles.actionButtonTextSecondary}>SHARE</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.patientInfo}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarTextLarge}>{lead.name?.[0] || '?'}</Text>
                </View>
                <View style={styles.patientDetails}>
                  <Text style={styles.patientName}>{lead.name}</Text>
                  <View style={styles.patientMeta}>
                    <Phone size={12} color={Colors.textMuted} />
                    <Text style={styles.patientMetaText}>{lead.phone}</Text>
                  </View>
                  <View style={styles.patientMeta}>
                    <Calendar size={12} color={Colors.textMuted} />
                    <Text style={styles.patientMetaText}>{formatDate(lead.createdAt)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.scoreBadgeLarge}>
                <Text style={styles.scoreBadgeLabel}>AURA</Text>
                <Text style={styles.scoreBadgeValue}>{lead.auraScore}</Text>
              </View>
            </View>

            {lead.skinIQ && (
              <View style={styles.skinIQSection}>
                <View style={styles.skinIQHeader}>
                  <Activity size={16} color={Colors.gold} />
                  <Text style={styles.skinIQTitle}>SKIN ANALYSIS</Text>
                </View>
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
          </View>

          {confirmedTreatments.length > 0 ? (
            <View style={styles.treatmentsSection}>
              <View style={styles.treatmentsSectionHeader}>
                <CheckCircle size={18} color={Colors.success} />
                <Text style={styles.treatmentsSectionTitle}>SELECTED TREATMENTS</Text>
                <View style={styles.treatmentCountBadge}>
                  <Text style={styles.treatmentCountText}>{confirmedTreatments.length}</Text>
                </View>
              </View>

              {confirmedTreatments.filter(ct => ct.treatmentType === 'procedure').length > 0 && (
                <View style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Syringe size={14} color={Colors.gold} />
                    <Text style={styles.categoryTitle}>Clinical Procedures</Text>
                  </View>
                  {confirmedTreatments
                    .filter(ct => ct.treatmentType === 'procedure')
                    .map((ct, index) => {
                      const t = ct.treatment as ClinicalProcedure;
                      return (
                        <View key={index} style={styles.treatmentItem}>
                          <View style={styles.treatmentItemHeader}>
                            <CheckCircle size={14} color={Colors.success} />
                            <Text style={styles.treatmentItemName}>{t.name}</Text>
                            <Text style={styles.treatmentItemPrice}>{t.price}</Text>
                          </View>
                          <Text style={styles.treatmentItemBenefit}>{t.benefit}</Text>
                          {ct.dosing?.customNotes && (
                            <View style={styles.notesBox}>
                              <Text style={styles.notesLabel}>Notes:</Text>
                              <Text style={styles.notesText}>{ct.dosing.customNotes}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              )}

              {confirmedTreatments.filter(ct => ct.treatmentType === 'peptide').length > 0 && (
                <View style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <FlaskConical size={14} color={Colors.success} />
                    <Text style={styles.categoryTitle}>Peptide Therapies</Text>
                  </View>
                  {confirmedTreatments
                    .filter(ct => ct.treatmentType === 'peptide')
                    .map((ct, index) => {
                      const t = ct.treatment as PeptideTherapy;
                      return (
                        <View key={index} style={[styles.treatmentItem, styles.treatmentItemGreen]}>
                          <View style={styles.treatmentItemHeader}>
                            <CheckCircle size={14} color={Colors.success} />
                            <Text style={styles.treatmentItemName}>{t.name}</Text>
                            <Text style={styles.treatmentItemFreq}>{t.frequency}</Text>
                          </View>
                          <Text style={styles.treatmentItemBenefit}>{t.goal}</Text>
                        </View>
                      );
                    })}
                </View>
              )}

              {confirmedTreatments.filter(ct => ct.treatmentType === 'iv').length > 0 && (
                <View style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Droplets size={14} color="#60a5fa" />
                    <Text style={styles.categoryTitle}>IV Optimization</Text>
                  </View>
                  {confirmedTreatments
                    .filter(ct => ct.treatmentType === 'iv')
                    .map((ct, index) => {
                      const t = ct.treatment as IVOptimization;
                      return (
                        <View key={index} style={[styles.treatmentItem, styles.treatmentItemBlue]}>
                          <View style={styles.treatmentItemHeader}>
                            <CheckCircle size={14} color={Colors.success} />
                            <Text style={styles.treatmentItemName}>{t.name}</Text>
                            <Text style={styles.treatmentItemDuration}>{t.duration}</Text>
                          </View>
                          <Text style={styles.treatmentItemBenefit}>{t.benefit}</Text>
                        </View>
                      );
                    })}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.treatmentsSection}>
              <View style={styles.treatmentsSectionHeader}>
                <Sparkles size={18} color={Colors.gold} />
                <Text style={styles.treatmentsSectionTitle}>RECOMMENDED TREATMENTS</Text>
                <View style={styles.treatmentCountBadge}>
                  <Text style={styles.treatmentCountText}>{totalTreatments}</Text>
                </View>
              </View>

              {lead.roadmap && lead.roadmap.length > 0 && (
                <View style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Syringe size={14} color={Colors.gold} />
                    <Text style={styles.categoryTitle}>Clinical Procedures</Text>
                  </View>
                  {lead.roadmap.map((proc, index) => (
                    <View key={index} style={styles.treatmentItem}>
                      <View style={styles.treatmentItemHeader}>
                        <Text style={styles.treatmentItemName}>{proc.name}</Text>
                        <Text style={styles.treatmentItemPrice}>{proc.price}</Text>
                      </View>
                      <Text style={styles.treatmentItemBenefit}>{proc.benefit}</Text>
                    </View>
                  ))}
                </View>
              )}

              {lead.peptides && lead.peptides.length > 0 && (
                <View style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <FlaskConical size={14} color={Colors.success} />
                    <Text style={styles.categoryTitle}>Peptide Therapies</Text>
                  </View>
                  {lead.peptides.map((p, index) => (
                    <View key={index} style={[styles.treatmentItem, styles.treatmentItemGreen]}>
                      <View style={styles.treatmentItemHeader}>
                        <Text style={styles.treatmentItemName}>{p.name}</Text>
                        <Text style={styles.treatmentItemFreq}>{p.frequency}</Text>
                      </View>
                      <Text style={styles.treatmentItemBenefit}>{p.goal}</Text>
                    </View>
                  ))}
                </View>
              )}

              {lead.ivDrips && lead.ivDrips.length > 0 && (
                <View style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Droplets size={14} color="#60a5fa" />
                    <Text style={styles.categoryTitle}>IV Optimization</Text>
                  </View>
                  {lead.ivDrips.map((iv, index) => (
                    <View key={index} style={[styles.treatmentItem, styles.treatmentItemBlue]}>
                      <View style={styles.treatmentItemHeader}>
                        <Text style={styles.treatmentItemName}>{iv.name}</Text>
                        <Text style={styles.treatmentItemDuration}>{iv.duration}</Text>
                      </View>
                      <Text style={styles.treatmentItemBenefit}>{iv.benefit}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>ESTIMATED TREATMENT VALUE</Text>
            <Text style={styles.totalValue}>${lead.estimatedValue?.toLocaleString() || '0'}</Text>
          </View>

          {(lead.signatureLog && lead.signatureLog.length > 0) || lead.patientConsent ? (
            <View style={styles.signatureLogSection}>
              <View style={styles.signatureLogHeader}>
                <FileSignature size={18} color={Colors.gold} />
                <Text style={styles.signatureLogTitle}>SIGNATURE LOG</Text>
                <View style={styles.signatureCountBadge}>
                  <Text style={styles.signatureCountText}>
                    {(lead.signatureLog?.length || 0) + (lead.patientConsent && !lead.signatureLog?.some(s => s.type === 'patient_consent') ? 1 : 0)}
                  </Text>
                </View>
              </View>

              {lead.patientConsent && (
                <View style={styles.consentCard}>
                  <View style={styles.consentHeader}>
                    <Shield size={16} color={Colors.success} />
                    <Text style={styles.consentTitle}>AI Consent Form</Text>
                    <Text style={styles.consentStatus}>
                      {lead.patientConsent.optedOutOfAI ? 'OPTED OUT' : 'CONSENTED'}
                    </Text>
                  </View>
                  <View style={styles.consentDetails}>
                    <View style={styles.signatureRow}>
                      <User size={12} color={Colors.textMuted} />
                      <Text style={styles.signatureLabel}>Patient:</Text>
                      <Text style={styles.signatureValue}>{lead.patientConsent.patientSignature}</Text>
                    </View>
                    <View style={styles.signatureRow}>
                      <Stethoscope size={12} color={Colors.textMuted} />
                      <Text style={styles.signatureLabel}>Provider:</Text>
                      <Text style={styles.signatureValue}>{lead.patientConsent.providerSignature}</Text>
                    </View>
                    <View style={styles.signatureRow}>
                      <Clock size={12} color={Colors.textMuted} />
                      <Text style={styles.signatureLabel}>Signed:</Text>
                      <Text style={styles.signatureTimestamp}>{lead.patientConsent.timestamp}</Text>
                    </View>
                  </View>
                </View>
              )}

              {lead.signatureLog && lead.signatureLog.filter(s => s.type === 'treatment_signoff').length > 0 && (
                <View style={styles.treatmentSignoffsSection}>
                  <Text style={styles.treatmentSignoffsTitle}>Treatment Sign-offs</Text>
                  {lead.signatureLog
                    .filter(s => s.type === 'treatment_signoff')
                    .map((sig, index) => (
                      <View key={index} style={styles.treatmentSignoffCard}>
                        <View style={styles.treatmentSignoffHeader}>
                          <CheckCircle size={14} color={Colors.success} />
                          <Text style={styles.treatmentSignoffName}>{sig.treatmentName}</Text>
                        </View>
                        <View style={styles.treatmentSignoffDetails}>
                          <View style={styles.signatureRow}>
                            <Stethoscope size={12} color={Colors.textMuted} />
                            <Text style={styles.signatureLabel}>Practitioner:</Text>
                            <Text style={styles.signatureValue}>{sig.practitionerSignature}</Text>
                          </View>
                          <View style={styles.signatureRow}>
                            <Clock size={12} color={Colors.textMuted} />
                            <Text style={styles.signatureLabel}>Signed:</Text>
                            <Text style={styles.signatureTimestamp}>{sig.timestamp}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              This summary is for informational purposes only. Please consult with your provider for final treatment plans and pricing.
            </Text>
          </View>
        </ScrollView>
      </View>
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
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  actionButtonTextSecondary: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextLarge: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 6,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  patientMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  scoreBadgeLarge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  scoreBadgeLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  scoreBadgeValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.gold,
  },
  skinIQSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skinIQHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  skinIQTitle: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
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
    padding: 12,
  },
  skinIQLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  skinIQValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  treatmentsSection: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  treatmentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  treatmentsSectionTitle: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 1,
    flex: 1,
  },
  treatmentCountBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  treatmentCountText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  treatmentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  treatmentItemGreen: {
    borderLeftColor: Colors.success,
  },
  treatmentItemBlue: {
    borderLeftColor: '#60a5fa',
  },
  treatmentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  treatmentItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  treatmentItemPrice: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  treatmentItemFreq: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  treatmentItemDuration: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#60a5fa',
  },
  treatmentItemBenefit: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  notesBox: {
    marginTop: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 8,
    padding: 10,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  totalCard: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.black,
  },
  disclaimer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  signatureLogSection: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  signatureLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  signatureLogTitle: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
    flex: 1,
  },
  signatureCountBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  signatureCountText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  consentCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  consentTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  consentStatus: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.success,
    letterSpacing: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  consentDetails: {
    gap: 8,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signatureLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    width: 75,
  },
  signatureValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
    fontStyle: 'italic',
  },
  signatureTimestamp: {
    flex: 1,
    fontSize: 11,
    color: Colors.text,
  },
  treatmentSignoffsSection: {
    marginTop: 4,
  },
  treatmentSignoffsTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  treatmentSignoffCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  treatmentSignoffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  treatmentSignoffName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  treatmentSignoffDetails: {
    gap: 6,
    paddingLeft: 22,
  },
});
