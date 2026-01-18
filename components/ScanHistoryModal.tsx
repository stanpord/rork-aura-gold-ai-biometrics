import React, { useMemo } from 'react';
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
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Sparkles,
  Activity,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Lead, ScanComparison } from '@/types';
import { useApp } from '@/contexts/AppContext';

interface ScanHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export default function ScanHistoryModal({ visible, onClose, lead }: ScanHistoryModalProps) {
  const { getPatientScanHistory } = useApp();

  const scanHistory = useMemo(() => {
    if (!lead) return [];
    return getPatientScanHistory(lead.id);
  }, [lead, getPatientScanHistory]);

  const comparisons = useMemo(() => {
    if (scanHistory.length < 2) return null;

    const latest = scanHistory[0];
    const previous = scanHistory[1];

    const results: ScanComparison[] = [];

    const scoreDiff = latest.auraScore - previous.auraScore;
    results.push({
      metric: 'Aura Score',
      previousValue: previous.auraScore,
      currentValue: latest.auraScore,
      change: scoreDiff > 0 ? 'improved' : scoreDiff < 0 ? 'declined' : 'stable',
      changeAmount: Math.abs(scoreDiff),
    });

    if (latest.skinIQ && previous.skinIQ) {
      const skinMetrics = ['texture', 'pores', 'pigment', 'redness'] as const;
      skinMetrics.forEach(metric => {
        const prevVal = previous.skinIQ![metric];
        const currVal = latest.skinIQ![metric];
        if (prevVal !== currVal) {
          results.push({
            metric: `Skin ${metric.charAt(0).toUpperCase() + metric.slice(1)}`,
            previousValue: prevVal,
            currentValue: currVal,
            change: getSkinIQChangeDirection(prevVal, currVal),
          });
        }
      });
    }

    if (latest.volumeAssessment && previous.volumeAssessment) {
      latest.volumeAssessment.forEach(latestZone => {
        const prevZone = previous.volumeAssessment?.find(z => z.zone === latestZone.zone);
        if (prevZone && prevZone.volumeLoss !== latestZone.volumeLoss) {
          const diff = latestZone.volumeLoss - prevZone.volumeLoss;
          results.push({
            metric: `${latestZone.zone} Volume`,
            previousValue: `${prevZone.volumeLoss}%`,
            currentValue: `${latestZone.volumeLoss}%`,
            change: diff < 0 ? 'improved' : diff > 0 ? 'declined' : 'stable',
            changeAmount: Math.abs(diff),
          });
        }
      });
    }

    return results;
  }, [scanHistory]);

  const getSkinIQChangeDirection = (prev: string, curr: string): 'improved' | 'declined' | 'stable' => {
    const qualityOrder = ['Poor', 'Fair', 'Good', 'Excellent'];
    const prevIndex = qualityOrder.findIndex(q => prev.toLowerCase().includes(q.toLowerCase()));
    const currIndex = qualityOrder.findIndex(q => curr.toLowerCase().includes(q.toLowerCase()));
    
    if (currIndex > prevIndex) return 'improved';
    if (currIndex < prevIndex) return 'declined';
    return 'stable';
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateLong = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeSinceScan = (date: Date) => {
    const now = new Date();
    const scanDate = new Date(date);
    const diffMs = now.getTime() - scanDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getChangeIcon = (change: 'improved' | 'declined' | 'stable') => {
    switch (change) {
      case 'improved':
        return <TrendingUp size={14} color={Colors.success} />;
      case 'declined':
        return <TrendingDown size={14} color={Colors.error} />;
      default:
        return <Minus size={14} color={Colors.textMuted} />;
    }
  };

  const getChangeColor = (change: 'improved' | 'declined' | 'stable') => {
    switch (change) {
      case 'improved':
        return Colors.success;
      case 'declined':
        return Colors.error;
      default:
        return Colors.textMuted;
    }
  };

  if (!lead) return null;

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
            <History size={24} color={Colors.gold} />
            <View>
              <Text style={styles.headerTitle}>Scan History</Text>
              <Text style={styles.headerSubtitle}>{lead.name}</Text>
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
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>VISIT SUMMARY</Text>
              <View style={styles.visitCountBadge}>
                <Text style={styles.visitCountText}>{scanHistory.length} Scan{scanHistory.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>First Visit</Text>
                <Text style={styles.summaryStatValue}>
                  {scanHistory.length > 0 ? formatDate(scanHistory[scanHistory.length - 1].scanDate) : '-'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Latest Visit</Text>
                <Text style={styles.summaryStatValue}>
                  {scanHistory.length > 0 ? formatDate(scanHistory[0].scanDate) : '-'}
                </Text>
              </View>
            </View>
          </View>

          {comparisons && comparisons.length > 0 && (
            <View style={styles.changesSection}>
              <View style={styles.changesSectionHeader}>
                <Activity size={18} color={Colors.gold} />
                <Text style={styles.changesSectionTitle}>CHANGES SINCE LAST VISIT</Text>
              </View>
              
              {comparisons.map((comparison, index) => (
                <View key={index} style={styles.changeCard}>
                  <View style={styles.changeCardHeader}>
                    {getChangeIcon(comparison.change)}
                    <Text style={styles.changeMetricName}>{comparison.metric}</Text>
                    <View style={[styles.changeBadge, { backgroundColor: `${getChangeColor(comparison.change)}20` }]}>
                      <Text style={[styles.changeBadgeText, { color: getChangeColor(comparison.change) }]}>
                        {comparison.change.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.changeValues}>
                    <View style={styles.changeValueBox}>
                      <Text style={styles.changeValueLabel}>Previous</Text>
                      <Text style={styles.changeValueText}>{comparison.previousValue}</Text>
                    </View>
                    <View style={styles.changeArrow}>
                      {comparison.change === 'improved' ? (
                        <ArrowUpRight size={20} color={Colors.success} />
                      ) : comparison.change === 'declined' ? (
                        <ArrowDownRight size={20} color={Colors.error} />
                      ) : (
                        <ChevronRight size={20} color={Colors.textMuted} />
                      )}
                    </View>
                    <View style={styles.changeValueBox}>
                      <Text style={styles.changeValueLabel}>Current</Text>
                      <Text style={[styles.changeValueText, { color: getChangeColor(comparison.change) }]}>
                        {comparison.currentValue}
                      </Text>
                    </View>
                  </View>
                  {comparison.changeAmount !== undefined && comparison.changeAmount > 0 && (
                    <View style={styles.changeAmountRow}>
                      <Text style={[styles.changeAmountText, { color: getChangeColor(comparison.change) }]}>
                        {comparison.change === 'improved' ? '+' : '-'}{comparison.changeAmount} points
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>ALL SCANS</Text>
            
            {scanHistory.map((scan, index) => (
              <View key={scan.id} style={styles.scanCard}>
                <View style={styles.scanCardTimeline}>
                  <View style={[
                    styles.timelineDot,
                    index === 0 && styles.timelineDotLatest
                  ]} />
                  {index < scanHistory.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                
                <View style={styles.scanCardContent}>
                  <View style={styles.scanCardHeader}>
                    <View style={styles.scanDateRow}>
                      <Calendar size={14} color={Colors.textMuted} />
                      <Text style={styles.scanDateText}>{formatDateLong(scan.scanDate)}</Text>
                      {index === 0 && (
                        <View style={styles.latestBadge}>
                          <Text style={styles.latestBadgeText}>LATEST</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.scanTimeAgo}>{getTimeSinceScan(scan.scanDate)}</Text>
                  </View>

                  <View style={styles.scanScoreSection}>
                    <View style={styles.scanScoreBox}>
                      <Sparkles size={16} color={Colors.gold} />
                      <Text style={styles.scanScoreLabel}>Aura Score</Text>
                      <Text style={styles.scanScoreValue}>{scan.auraScore}</Text>
                    </View>
                    <View style={styles.scanFaceType}>
                      <Text style={styles.scanFaceTypeLabel}>Face Type</Text>
                      <Text style={styles.scanFaceTypeValue}>{scan.faceType}</Text>
                    </View>
                  </View>

                  {scan.skinIQ && (
                    <View style={styles.scanSkinIQ}>
                      <Text style={styles.scanSkinIQTitle}>Skin Analysis</Text>
                      <View style={styles.scanSkinIQGrid}>
                        <View style={styles.scanSkinIQItem}>
                          <Text style={styles.scanSkinIQLabel}>Texture</Text>
                          <Text style={styles.scanSkinIQValue}>{scan.skinIQ.texture}</Text>
                        </View>
                        <View style={styles.scanSkinIQItem}>
                          <Text style={styles.scanSkinIQLabel}>Pores</Text>
                          <Text style={styles.scanSkinIQValue}>{scan.skinIQ.pores}</Text>
                        </View>
                        <View style={styles.scanSkinIQItem}>
                          <Text style={styles.scanSkinIQLabel}>Pigment</Text>
                          <Text style={styles.scanSkinIQValue}>{scan.skinIQ.pigment}</Text>
                        </View>
                        <View style={styles.scanSkinIQItem}>
                          <Text style={styles.scanSkinIQLabel}>Redness</Text>
                          <Text style={styles.scanSkinIQValue}>{scan.skinIQ.redness}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.scanTreatmentsSummary}>
                    <View style={styles.scanTreatmentCount}>
                      <Text style={styles.scanTreatmentCountValue}>{scan.roadmap?.length || 0}</Text>
                      <Text style={styles.scanTreatmentCountLabel}>Procedures</Text>
                    </View>
                    <View style={styles.scanTreatmentCount}>
                      <Text style={[styles.scanTreatmentCountValue, { color: Colors.success }]}>
                        {scan.peptides?.length || 0}
                      </Text>
                      <Text style={styles.scanTreatmentCountLabel}>Peptides</Text>
                    </View>
                    <View style={styles.scanTreatmentCount}>
                      <Text style={[styles.scanTreatmentCountValue, { color: '#60a5fa' }]}>
                        {scan.ivDrips?.length || 0}
                      </Text>
                      <Text style={styles.scanTreatmentCountLabel}>IV Drips</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {scanHistory.length === 1 && (
            <View style={styles.noHistoryNote}>
              <History size={24} color={Colors.textMuted} />
              <Text style={styles.noHistoryNoteTitle}>First Visit</Text>
              <Text style={styles.noHistoryNoteText}>
                This is the patient&apos;s first scan. Future visits will show changes and trends over time.
              </Text>
            </View>
          )}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  visitCountBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  visitCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  changesSection: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  changesSectionTitle: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  changeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  changeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  changeMetricName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeValueBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
  },
  changeValueLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  changeValueText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  changeArrow: {
    paddingHorizontal: 12,
  },
  changeAmountRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  changeAmountText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  historySection: {
    marginBottom: 20,
  },
  historySectionTitle: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  scanCard: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  scanCardTimeline: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  timelineDotLatest: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  scanCardContent: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scanDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanDateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  latestBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  latestBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 0.5,
  },
  scanTimeAgo: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  scanScoreSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  scanScoreBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  scanScoreLabel: {
    fontSize: 11,
    color: Colors.text,
  },
  scanScoreValue: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.gold,
    marginLeft: 'auto',
  },
  scanFaceType: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  scanFaceTypeLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  scanFaceTypeValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  scanSkinIQ: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scanSkinIQTitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  scanSkinIQGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scanSkinIQItem: {
    flex: 1,
    minWidth: '45%',
  },
  scanSkinIQLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  scanSkinIQValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  scanTreatmentsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  scanTreatmentCount: {
    alignItems: 'center',
  },
  scanTreatmentCountValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  scanTreatmentCountLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noHistoryNote: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noHistoryNoteTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 12,
    marginBottom: 8,
  },
  noHistoryNoteText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
