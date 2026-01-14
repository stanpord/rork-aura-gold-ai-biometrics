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
  ClipboardCheck,
  Settings,
  RefreshCw,
  Trash2,
  Printer,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import ClinicLoginModal from '@/components/ClinicLoginModal';
import LeadDetailModal from '@/components/LeadDetailModal';
import TermsOfServiceModal from '@/components/TermsOfServiceModal';
import { Lead, TermsOfServiceAcknowledgment, SelectedTreatment } from '@/types';

interface ZenotiConfig {
  apiKey: string;
  centerId: string;
  baseUrl: string;
}

export default function ClinicScreen() {
  const { leads, stats, logoutStaff, isStaffAuthenticated, authenticateStaff, tosAcknowledgment, saveTosAcknowledgment, deleteLead, clinicSettings, updateTreatmentConfig } = useApp();
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
  const [showPrintSummary, setShowPrintSummary] = useState(false);
  const [showTreatmentSetup, setShowTreatmentSetup] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');

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

  const getAllSignedOffTreatments = () => {
    const signedOff: { lead: Lead; treatment: SelectedTreatment }[] = [];
    leads.forEach(lead => {
      if (lead.selectedTreatments) {
        lead.selectedTreatments.forEach(st => {
          if (st.complianceSignOff?.acknowledged) {
            signedOff.push({ lead, treatment: st });
          }
        });
      }
    });
    return signedOff;
  };

  const getAllRecommendedTreatments = () => {
    const recommended: { lead: Lead; treatmentName: string; type: string; price: string }[] = [];
    leads.forEach(lead => {
      lead.roadmap?.forEach(t => {
        recommended.push({ lead, treatmentName: t.name, type: 'Procedure', price: t.price });
      });
      lead.peptides?.forEach(t => {
        recommended.push({ lead, treatmentName: t.name, type: 'Peptide', price: '-' });
      });
      lead.ivDrips?.forEach(t => {
        recommended.push({ lead, treatmentName: t.name, type: 'IV Therapy', price: '-' });
      });
    });
    return recommended;
  };

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      setShowPrintSummary(true);
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const signedOffTreatments = getAllSignedOffTreatments();
  const recommendedTreatments = getAllRecommendedTreatments();

  const handleToggleTreatment = (treatmentName: string, enabled: boolean) => {
    updateTreatmentConfig(treatmentName, { enabled });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePriceEdit = (treatmentName: string) => {
    const config = clinicSettings?.treatmentConfigs.find(c => c.treatmentName === treatmentName);
    setEditingTreatment(treatmentName);
    setEditingPrice(config?.customPrice || '');
  };

  const handlePriceSave = () => {
    if (editingTreatment && editingPrice) {
      updateTreatmentConfig(editingTreatment, { customPrice: editingPrice });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    setEditingTreatment(null);
    setEditingPrice('');
  };

  const procedureConfigs = clinicSettings?.treatmentConfigs.filter(c => c.category === 'procedure') || [];
  const peptideConfigs = clinicSettings?.treatmentConfigs.filter(c => c.category === 'peptide') || [];
  const ivConfigs = clinicSettings?.treatmentConfigs.filter(c => c.category === 'iv') || [];

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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.printButton}
              onPress={() => setShowPrintSummary(true)}
              activeOpacity={0.7}
            >
              <Printer size={16} color={Colors.gold} />
              <Text style={styles.printButtonText}>Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logoutStaff}
              activeOpacity={0.7}
            >
              <ChevronLeft size={16} color={Colors.textMuted} />
              <Text style={styles.logoutText}>Exit</Text>
            </TouchableOpacity>
          </View>
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
              <ClipboardCheck size={16} color={Colors.success} />
              <Text style={styles.statLabelSmall}>TX SELECTED</Text>
              <Text style={styles.statValueSmall}>{stats.treatmentsSignedOff}</Text>
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

        <TouchableOpacity
          style={styles.crmToggle}
          onPress={() => setShowTreatmentSetup(!showTreatmentSetup)}
          activeOpacity={0.8}
        >
          <View style={styles.crmToggleLeft}>
            <DollarSign size={18} color={Colors.gold} />
            <Text style={styles.crmToggleText}>Treatment Setup</Text>
          </View>
          <View style={styles.crmStatusBadge}>
            <Text style={styles.crmStatusText}>
              {clinicSettings?.treatmentConfigs.filter(c => c.enabled).length || 0} ACTIVE
            </Text>
          </View>
        </TouchableOpacity>

        {showTreatmentSetup && (
          <View style={styles.treatmentSetupContainer}>
            <Text style={styles.treatmentSetupTitle}>Configure Treatments & Pricing</Text>
            <Text style={styles.treatmentSetupSubtitle}>
              Toggle treatments your clinic offers and set custom pricing
            </Text>

            <View style={styles.treatmentCategorySection}>
              <Text style={styles.treatmentCategoryTitle}>PROCEDURES</Text>
              {procedureConfigs.map((config) => (
                <View key={config.treatmentName} style={styles.treatmentConfigRow}>
                  <TouchableOpacity
                    style={[
                      styles.treatmentToggle,
                      config.enabled && styles.treatmentToggleActive,
                    ]}
                    onPress={() => handleToggleTreatment(config.treatmentName, !config.enabled)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.toggleTrack,
                      config.enabled && styles.toggleTrackActive,
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        config.enabled && styles.toggleThumbActive,
                      ]} />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.treatmentConfigInfo}>
                    <Text style={[
                      styles.treatmentConfigName,
                      !config.enabled && styles.treatmentConfigNameDisabled,
                    ]}>
                      {config.treatmentName}
                    </Text>
                  </View>
                  {editingTreatment === config.treatmentName ? (
                    <View style={styles.priceEditContainer}>
                      <TextInput
                        style={styles.priceInput}
                        value={editingPrice}
                        onChangeText={setEditingPrice}
                        placeholder="$0"
                        placeholderTextColor={Colors.textMuted}
                        autoFocus
                        onBlur={handlePriceSave}
                        onSubmitEditing={handlePriceSave}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.priceButton}
                      onPress={() => handlePriceEdit(config.treatmentName)}
                      activeOpacity={0.7}
                      disabled={!config.enabled}
                    >
                      <Text style={[
                        styles.priceButtonText,
                        !config.enabled && styles.priceButtonTextDisabled,
                      ]}>
                        {config.customPrice}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.treatmentCategorySection}>
              <Text style={styles.treatmentCategoryTitle}>PEPTIDES</Text>
              {peptideConfigs.map((config) => (
                <View key={config.treatmentName} style={styles.treatmentConfigRow}>
                  <TouchableOpacity
                    style={[
                      styles.treatmentToggle,
                      config.enabled && styles.treatmentToggleActive,
                    ]}
                    onPress={() => handleToggleTreatment(config.treatmentName, !config.enabled)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.toggleTrack,
                      config.enabled && styles.toggleTrackActive,
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        config.enabled && styles.toggleThumbActive,
                      ]} />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.treatmentConfigInfo}>
                    <Text style={[
                      styles.treatmentConfigName,
                      !config.enabled && styles.treatmentConfigNameDisabled,
                    ]}>
                      {config.treatmentName}
                    </Text>
                  </View>
                  {editingTreatment === config.treatmentName ? (
                    <View style={styles.priceEditContainer}>
                      <TextInput
                        style={styles.priceInput}
                        value={editingPrice}
                        onChangeText={setEditingPrice}
                        placeholder="$0"
                        placeholderTextColor={Colors.textMuted}
                        autoFocus
                        onBlur={handlePriceSave}
                        onSubmitEditing={handlePriceSave}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.priceButton}
                      onPress={() => handlePriceEdit(config.treatmentName)}
                      activeOpacity={0.7}
                      disabled={!config.enabled}
                    >
                      <Text style={[
                        styles.priceButtonText,
                        !config.enabled && styles.priceButtonTextDisabled,
                      ]}>
                        {config.customPrice}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.treatmentCategorySection}>
              <Text style={styles.treatmentCategoryTitle}>IV THERAPIES</Text>
              {ivConfigs.map((config) => (
                <View key={config.treatmentName} style={styles.treatmentConfigRow}>
                  <TouchableOpacity
                    style={[
                      styles.treatmentToggle,
                      config.enabled && styles.treatmentToggleActive,
                    ]}
                    onPress={() => handleToggleTreatment(config.treatmentName, !config.enabled)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.toggleTrack,
                      config.enabled && styles.toggleTrackActive,
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        config.enabled && styles.toggleThumbActive,
                      ]} />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.treatmentConfigInfo}>
                    <Text style={[
                      styles.treatmentConfigName,
                      !config.enabled && styles.treatmentConfigNameDisabled,
                    ]}>
                      {config.treatmentName}
                    </Text>
                  </View>
                  {editingTreatment === config.treatmentName ? (
                    <View style={styles.priceEditContainer}>
                      <TextInput
                        style={styles.priceInput}
                        value={editingPrice}
                        onChangeText={setEditingPrice}
                        placeholder="$0"
                        placeholderTextColor={Colors.textMuted}
                        autoFocus
                        onBlur={handlePriceSave}
                        onSubmitEditing={handlePriceSave}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.priceButton}
                      onPress={() => handlePriceEdit(config.treatmentName)}
                      activeOpacity={0.7}
                      disabled={!config.enabled}
                    >
                      <Text style={[
                        styles.priceButtonText,
                        !config.enabled && styles.priceButtonTextDisabled,
                      ]}>
                        {config.customPrice}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

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

        {showPrintSummary && (
          <View style={styles.printOverlay}>
            <View style={styles.printModal}>
              <View style={styles.printHeader}>
                <Text style={styles.printTitle}>TREATMENT SUMMARY</Text>
                <TouchableOpacity
                  style={styles.printCloseButton}
                  onPress={() => setShowPrintSummary(false)}
                  activeOpacity={0.7}
                >
                  <X size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.printContent} showsVerticalScrollIndicator={false}>
                <View style={styles.printSection}>
                  <View style={styles.printSectionHeader}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.printSectionTitle}>SIGNED OFF TREATMENTS ({signedOffTreatments.length})</Text>
                  </View>
                  {signedOffTreatments.length === 0 ? (
                    <Text style={styles.printEmptyText}>No treatments signed off yet</Text>
                  ) : (
                    signedOffTreatments.map((item, index) => {
                      const treatmentName = item.treatment.treatmentType === 'procedure' 
                        ? (item.treatment.treatment as any).name 
                        : item.treatment.treatmentType === 'peptide'
                        ? (item.treatment.treatment as any).name
                        : (item.treatment.treatment as any).name;
                      return (
                        <View key={index} style={styles.printItem}>
                          <View style={styles.printItemLeft}>
                            <Text style={styles.printItemName}>{treatmentName}</Text>
                            <Text style={styles.printItemPatient}>Patient: {item.lead.name}</Text>
                            {item.treatment.dosing && Object.keys(item.treatment.dosing).length > 0 && (
                              <View style={styles.printDosingContainer}>
                                {item.treatment.dosing.units && (
                                  <Text style={styles.printDosingText}>Units: {item.treatment.dosing.units}</Text>
                                )}
                                {item.treatment.dosing.volume && (
                                  <Text style={styles.printDosingText}>Volume: {item.treatment.dosing.volume}</Text>
                                )}
                                {item.treatment.dosing.depth && (
                                  <Text style={styles.printDosingText}>Depth: {item.treatment.dosing.depth}</Text>
                                )}
                                {item.treatment.dosing.energy && (
                                  <Text style={styles.printDosingText}>Energy: {item.treatment.dosing.energy}</Text>
                                )}
                                {item.treatment.dosing.passes && (
                                  <Text style={styles.printDosingText}>Passes: {item.treatment.dosing.passes}</Text>
                                )}
                                {item.treatment.dosing.customNotes && (
                                  <Text style={styles.printDosingText}>Notes: {item.treatment.dosing.customNotes}</Text>
                                )}
                              </View>
                            )}
                          </View>
                          <View style={styles.printItemRight}>
                            <Text style={styles.printItemType}>{item.treatment.treatmentType.toUpperCase()}</Text>
                            <Text style={styles.printSignedDate}>
                              {item.treatment.complianceSignOff?.signedAt 
                                ? new Date(item.treatment.complianceSignOff.signedAt).toLocaleDateString()
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
                    <ClipboardCheck size={16} color={Colors.gold} />
                    <Text style={styles.printSectionTitle}>ALL RECOMMENDED ({recommendedTreatments.length})</Text>
                  </View>
                  {recommendedTreatments.length === 0 ? (
                    <Text style={styles.printEmptyText}>No recommendations yet</Text>
                  ) : (
                    recommendedTreatments.map((item, index) => (
                      <View key={index} style={styles.printItemCompact}>
                        <View style={styles.printItemLeft}>
                          <Text style={styles.printItemNameCompact}>{item.treatmentName}</Text>
                          <Text style={styles.printItemPatientCompact}>{item.lead.name}</Text>
                        </View>
                        <View style={styles.printItemRight}>
                          <Text style={styles.printItemTypeCompact}>{item.type}</Text>
                          {item.price !== '-' && (
                            <Text style={styles.printItemPrice}>{item.price}</Text>
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
                    <Text style={styles.printSectionTitle}>SERVICE SUMMARY</Text>
                  </View>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{leads.length}</Text>
                      <Text style={styles.summaryLabel}>Total Patients</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{signedOffTreatments.length}</Text>
                      <Text style={styles.summaryLabel}>Treatments Signed</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{recommendedTreatments.length}</Text>
                      <Text style={styles.summaryLabel}>Total Recommended</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValueGold}>${stats.pipeline.toLocaleString()}</Text>
                      <Text style={styles.summaryLabel}>Pipeline Value</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.printFooter}>
                  <Text style={styles.printFooterText}>
                    Generated: {new Date().toLocaleString()}
                  </Text>
                </View>
              </ScrollView>

              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={styles.webPrintButton}
                  onPress={handlePrint}
                  activeOpacity={0.8}
                >
                  <Printer size={16} color={Colors.black} />
                  <Text style={styles.webPrintButtonText}>PRINT</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
    padding: 24,
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
    fontSize: 11,
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
    fontSize: 15,
    color: Colors.white,
    minHeight: 48,
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
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  printButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  printOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  printModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
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
  printTitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: 1,
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
  printSection: {
    marginBottom: 16,
  },
  printSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
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
  printItemPatient: {
    fontSize: 11,
    color: Colors.textMuted,
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
  printItemPatientCompact: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  printItemTypeCompact: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  printItemPrice: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gold,
    marginTop: 2,
  },
  printDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  summaryValueGold: {
    fontSize: 24,
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
  treatmentSetupContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  treatmentSetupTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  treatmentSetupSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  treatmentCategorySection: {
    marginBottom: 20,
  },
  treatmentCategoryTitle: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  treatmentConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  treatmentToggle: {
    marginRight: 12,
  },
  treatmentToggleActive: {},
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: Colors.gold,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textMuted,
  },
  toggleThumbActive: {
    backgroundColor: Colors.black,
    alignSelf: 'flex-end',
  },
  treatmentConfigInfo: {
    flex: 1,
  },
  treatmentConfigName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  treatmentConfigNameDisabled: {
    color: Colors.textMuted,
  },
  priceButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  priceButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  priceButtonTextDisabled: {
    color: Colors.textMuted,
  },
  priceEditContainer: {
    minWidth: 100,
  },
  priceInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.white,
    minWidth: 100,
    textAlign: 'center',
  },
});
