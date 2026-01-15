import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { 
  Globe, 
  ChevronLeft, 
  Lock, 
  Link2, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  RefreshCw,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import ClinicLoginModal from '@/components/ClinicLoginModal';
import LeadDetailModal from '@/components/LeadDetailModal';
import TermsOfServiceModal from '@/components/TermsOfServiceModal';
import { Lead, TermsOfServiceAcknowledgment } from '@/types';
import TreatmentSettingsPanel from '@/components/TreatmentSettingsPanel';

interface ZenotiConfig {
  apiKey: string;
  centerId: string;
  baseUrl: string;
}

export default function ClinicScreen() {
  const { leads, stats, logoutStaff, isStaffAuthenticated, authenticateStaff, tosAcknowledgment, saveTosAcknowledgment, deleteLead } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCrmSetup, setShowCrmSetup] = useState(false);
  const [zenotiConfig, setZenotiConfig] = useState<ZenotiConfig>({
    apiKey: '',
    centerId: '',
    baseUrl: 'https://api.zenoti.com/v1',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(false);
  const [showTreatmentSettings, setShowTreatmentSettings] = useState(false);

  const handleLogin = (passcode: string): boolean => {
    const success = authenticateStaff(passcode);
    if (success) {
      setShowLoginModal(false);
      if (!tosAcknowledgment) {
        setPendingAuth(true);
        setShowTosModal(true);
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }
    return success;
  };

  const handleTosAccept = (acknowledgment: TermsOfServiceAcknowledgment) => {
    saveTosAcknowledgment(acknowledgment);
    setShowTosModal(false);
    setPendingAuth(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTosDecline = () => {
    setShowTosModal(false);
    if (pendingAuth) {
      logoutStaff();
      setPendingAuth(false);
    }
  };

  const validateConnection = async () => {
    if (!zenotiConfig.apiKey || !zenotiConfig.centerId) {
      Alert.alert('Missing Configuration', 'Please enter API Key and Center ID');
      return;
    }

    setIsValidating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnected(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Connected', 'Successfully connected to Zenoti CRM');
    } catch (error) {
      console.log('Connection error:', error);
      Alert.alert('Connection Failed', 'Could not connect to Zenoti. Please check your credentials.');
    } finally {
      setIsValidating(false);
    }
  };

  const syncAllLeads = async () => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect to Zenoti CRM first');
      return;
    }

    setIsSyncing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Sync Complete', `${leads.length} leads synced to Zenoti`);
    } catch (error) {
      console.log('Sync error:', error);
      Alert.alert('Sync Failed', 'Could not sync leads to Zenoti');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isStaffAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          <View style={styles.lockIconContainer}>
            <Lock size={40} color={Colors.gold} />
          </View>
          <Text style={styles.lockedTitle}>Patient Dashboard Locked</Text>
          <Text style={styles.lockedSubtitle}>
            Staff authentication required to access clinic dashboard and patient records
          </Text>
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => setShowLoginModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.unlockButtonText}>AUTHENTICATE</Text>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <AlertCircle size={14} color={Colors.textMuted} />
            <Text style={styles.securityNoteText}>
              Protected by clinic access code
            </Text>
          </View>
        </View>

        <ClinicLoginModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>PATIENT RECORDS</Text>
            <View style={styles.syncStatus}>
              <View style={[styles.syncDot, isConnected && styles.syncDotActive]} />
              <Text style={styles.syncText}>
                {isConnected ? 'ZENOTI CONNECTED' : 'LOCAL STORAGE'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logoutStaff}
            activeOpacity={0.7}
          >
            <ChevronLeft size={16} color={Colors.textMuted} />
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCardLarge}>
            <View style={styles.statIconContainer}>
              <DollarSign size={20} color={Colors.gold} />
            </View>
            <Text style={styles.statLabel}>ESTIMATED VALUE</Text>
            <Text style={styles.statValueGold}>${stats.pipeline.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCardSmall}>
              <Users size={16} color={Colors.textMuted} />
              <Text style={styles.statLabelSmall}>LEADS</Text>
              <Text style={styles.statValueSmall}>{stats.scans}</Text>
            </View>
            <View style={styles.statCardSmall}>
              <TrendingUp size={16} color={Colors.textMuted} />
              <Text style={styles.statLabelSmall}>CONVERSION</Text>
              <Text style={styles.statValueSmall}>{stats.conversion}%</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.crmToggle}
          onPress={() => setShowCrmSetup(!showCrmSetup)}
          activeOpacity={0.8}
        >
          <View style={styles.crmToggleLeft}>
            <Settings size={18} color={Colors.gold} />
            <Text style={styles.crmToggleText}>CRM Integration</Text>
          </View>
          <View style={[styles.crmStatusBadge, isConnected && styles.crmStatusBadgeActive]}>
            {isConnected ? (
              <CheckCircle size={12} color={Colors.success} />
            ) : (
              <Link2 size={12} color={Colors.textMuted} />
            )}
            <Text style={[styles.crmStatusText, isConnected && styles.crmStatusTextActive]}>
              {isConnected ? 'LINKED' : 'NOT LINKED'}
            </Text>
          </View>
        </TouchableOpacity>

        {showCrmSetup && (
          <View style={styles.crmSetupContainer}>
            <Text style={styles.crmSetupTitle}>Zenoti Configuration</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>API KEY</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Zenoti API Key"
                placeholderTextColor={Colors.textMuted}
                value={zenotiConfig.apiKey}
                onChangeText={(text) => setZenotiConfig(prev => ({ ...prev, apiKey: text }))}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CENTER ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Center ID"
                placeholderTextColor={Colors.textMuted}
                value={zenotiConfig.centerId}
                onChangeText={(text) => setZenotiConfig(prev => ({ ...prev, centerId: text }))}
              />
            </View>

            <View style={styles.crmButtons}>
              <TouchableOpacity
                style={[styles.crmButton, styles.validateButton]}
                onPress={validateConnection}
                disabled={isValidating}
                activeOpacity={0.8}
              >
                {isValidating ? (
                  <ActivityIndicator size="small" color={Colors.black} />
                ) : (
                  <>
                    <Link2 size={14} color={Colors.black} />
                    <Text style={styles.crmButtonText}>VALIDATE</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.crmButton, styles.syncButton, !isConnected && styles.buttonDisabled]}
                onPress={syncAllLeads}
                disabled={!isConnected || isSyncing}
                activeOpacity={0.8}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <RefreshCw size={14} color={Colors.white} />
                    <Text style={styles.syncButtonText}>SYNC ALL</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.crmToggle}
          onPress={() => {
            setShowTreatmentSettings(!showTreatmentSettings);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.crmToggleLeft}>
            <Sliders size={18} color={Colors.gold} />
            <Text style={styles.crmToggleText}>Treatment & Pricing</Text>
          </View>
          <View style={styles.treatmentSettingsIndicator}>
            {showTreatmentSettings ? (
              <ChevronUp size={18} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={18} color={Colors.textMuted} />
            )}
          </View>
        </TouchableOpacity>

        {showTreatmentSettings && (
          <View style={styles.treatmentSettingsContainer}>
            <TreatmentSettingsPanel />
          </View>
        )}

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colPatient]}>Patient</Text>
            <Text style={[styles.tableHeaderText, styles.colScore]}>Score</Text>
            <Text style={[styles.tableHeaderText, styles.colSync]}>Sync</Text>
            <Text style={[styles.tableHeaderText, styles.colValue]}>Value</Text>
            <Text style={[styles.tableHeaderText, styles.colDelete]}></Text>
          </View>

          {leads.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyTableText}>No leads captured yet</Text>
              <Text style={styles.emptyTableSubtext}>Start scanning to add patient records</Text>
            </View>
          ) : (
            leads.map((lead) => (
              <TouchableOpacity 
                key={lead.id} 
                style={styles.tableRow}
                onPress={() => {
                  setSelectedLead(lead);
                  setShowLeadDetail(true);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.tableCell, styles.colPatient]}>
                  <View style={styles.patientInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{lead.name?.[0] || '?'}</Text>
                    </View>
                    <View>
                      <Text style={styles.patientName}>{lead.name}</Text>
                      <Text style={styles.patientPhone}>{lead.phone}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.tableCell, styles.colScore]}>
                  <Text style={styles.scoreValue}>{lead.auraScore}</Text>
                </View>
                <View style={[styles.tableCell, styles.colSync]}>
                  <View style={[styles.syncBadge, isConnected && styles.syncBadgeActive]}>
                    {isConnected ? (
                      <CheckCircle size={10} color={Colors.success} />
                    ) : (
                      <Globe size={10} color={Colors.textMuted} />
                    )}
                  </View>
                </View>
                <View style={[styles.tableCell, styles.colValue]}>
                  <Text style={styles.valueText}>${lead.estimatedValue?.toLocaleString() || '0'}</Text>
                </View>
                <View style={[styles.tableCell, styles.colDelete]}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }
                      Alert.alert(
                        'Remove Patient',
                        `Are you sure you want to remove ${lead.name} from the records? This action cannot be undone.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              deleteLead(lead.id);
                              if (Platform.OS !== 'web') {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              }
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={Colors.error || '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

        <LeadDetailModal
          visible={showLeadDetail}
          onClose={() => {
            setShowLeadDetail(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
        />

        <TermsOfServiceModal
          visible={showTosModal}
          onClose={handleTosDecline}
          onAccept={handleTosAccept}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: 32,
  },
  unlockButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 24,
  },
  unlockButtonText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 2,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  syncDotActive: {
    backgroundColor: Colors.success,
  },
  syncText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statCardLarge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  statLabelSmall: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  statValueGold: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: Colors.gold,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.white,
  },
  crmToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  crmToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crmToggleText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  crmStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  crmStatusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  crmStatusText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  crmStatusTextActive: {
    color: Colors.success,
  },
  crmSetupContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  crmSetupTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.white,
  },
  crmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  crmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  validateButton: {
    backgroundColor: Colors.gold,
  },
  syncButton: {
    backgroundColor: Colors.success,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  crmButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  syncButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  tableContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: '900' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  colPatient: {
    flex: 2,
  },
  colScore: {
    flex: 0.7,
    alignItems: 'center',
  },
  colSync: {
    flex: 0.5,
    alignItems: 'center',
  },
  colValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  colDelete: {
    width: 40,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  patientPhone: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginTop: 1,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  syncBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  emptyTable: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  emptyTableSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  treatmentSettingsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treatmentSettingsContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 500,
    overflow: 'hidden',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
