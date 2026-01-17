import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AnalysisResult, Lead, ViewMode, PatientHealthProfile, PatientConsent, TermsOfServiceAcknowledgment, SelectedTreatment, TreatmentConfig, DEFAULT_TREATMENT_CONFIGS, PatientBasicInfo, ClinicalProcedure, SignatureRecord } from '@/types';
import { encryptObject, decryptObject, isEncryptedData, getEncryptionStatus, EncryptionStatus } from '@/utils/encryption';

const APP_VERSION = '1.0.6';

const STORAGE_KEYS = {
  LEADS: 'aura_gold_leads_encrypted',
  INTRO_COMPLETE: 'aura_gold_intro_complete',
  HEALTH_PROFILE: 'aura_gold_health_profile_encrypted',
  PATIENT_CONSENT: 'aura_gold_patient_consent_encrypted',
  TOS_ACKNOWLEDGMENT: 'aura_gold_tos_acknowledgment',
  TREATMENT_CONFIGS: 'aura_gold_treatment_configs',
  APP_VERSION: 'aura_gold_app_version',
  PATIENT_BASIC_INFO: 'aura_gold_patient_basic_info_encrypted',
};

const LEGACY_STORAGE_KEYS = {
  LEADS: 'aura_gold_leads',
  HEALTH_PROFILE: 'aura_gold_health_profile',
  PATIENT_CONSENT: 'aura_gold_patient_consent',
  PATIENT_BASIC_INFO: 'aura_gold_patient_basic_info',
};

const getDefaultTreatmentConfigs = (): TreatmentConfig[] => {
  return DEFAULT_TREATMENT_CONFIGS.map(t => ({
    ...t,
    enabled: true,
    customPrice: undefined,
  }));
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
  const [hasUnlockedResults, setHasUnlockedResults] = useState(false);
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [isLoadingIntro, setIsLoadingIntro] = useState(true);
  const [patientHealthProfile, setPatientHealthProfile] = useState<PatientHealthProfile | null>(null);
  const [patientConsent, setPatientConsent] = useState<PatientConsent | null>(null);
  const [tosAcknowledgment, setTosAcknowledgment] = useState<TermsOfServiceAcknowledgment | null>(null);
  const [treatmentConfigs, setTreatmentConfigs] = useState<TreatmentConfig[]>(getDefaultTreatmentConfigs());
  const [isDevMode, setIsDevMode] = useState(false);
  const [patientBasicInfo, setPatientBasicInfo] = useState<PatientBasicInfo | null>(null);
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus | null>(null);

  useEffect(() => {
    loadStoredData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStoredData = async () => {
    try {
      console.log('[AppContext] Loading stored data, current version:', APP_VERSION);
      
      const status = await getEncryptionStatus();
      setEncryptionStatus(status);
      console.log('[AppContext] Encryption status:', status);
      
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      if (storedVersion !== APP_VERSION) {
        console.log('[AppContext] Version mismatch, migrating data to encrypted storage');
        await migrateToEncryptedStorage();
        await AsyncStorage.removeItem(STORAGE_KEYS.TREATMENT_CONFIGS);
        await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
      }
      
      const storedLeads = await AsyncStorage.getItem(STORAGE_KEYS.LEADS);
      if (storedLeads) {
        try {
          let parsed: Lead[];
          if (isEncryptedData(storedLeads)) {
            parsed = await decryptObject<Lead[]>(storedLeads);
            console.log('[AppContext] Leads decrypted successfully');
          } else {
            parsed = JSON.parse(storedLeads);
          }
          const restoredLeads = parsed.map((l: Lead) => ({
            ...l,
            createdAt: new Date(l.createdAt),
            roadmap: l.roadmap || [],
            peptides: l.peptides || [],
            ivDrips: l.ivDrips || [],
          }));
          setLeads(restoredLeads);
          console.log('[AppContext] Leads restored:', restoredLeads.length, 'leads');
        } catch (decryptError) {
          console.log('[AppContext] Error decrypting leads:', decryptError);
        }
      }

      const introComplete = await AsyncStorage.getItem(STORAGE_KEYS.INTRO_COMPLETE);
      if (introComplete === 'true') {
        setHasCompletedIntro(true);
      }

      const healthProfile = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_PROFILE);
      if (healthProfile) {
        try {
          let parsed: PatientHealthProfile;
          if (isEncryptedData(healthProfile)) {
            parsed = await decryptObject<PatientHealthProfile>(healthProfile);
            console.log('[AppContext] Health profile decrypted successfully');
          } else {
            parsed = JSON.parse(healthProfile);
          }
          setPatientHealthProfile({
            ...parsed,
            completedAt: new Date(parsed.completedAt),
          });
        } catch (decryptError) {
          console.log('[AppContext] Error decrypting health profile:', decryptError);
        }
      }

      const consent = await AsyncStorage.getItem(STORAGE_KEYS.PATIENT_CONSENT);
      if (consent) {
        try {
          let parsed: PatientConsent;
          if (isEncryptedData(consent)) {
            parsed = await decryptObject<PatientConsent>(consent);
            console.log('[AppContext] Patient consent decrypted successfully');
          } else {
            parsed = JSON.parse(consent);
          }
          setPatientConsent({
            ...parsed,
            consentedAt: new Date(parsed.consentedAt),
          });
        } catch (decryptError) {
          console.log('[AppContext] Error decrypting consent:', decryptError);
        }
      }

      const tos = await AsyncStorage.getItem(STORAGE_KEYS.TOS_ACKNOWLEDGMENT);
      if (tos) {
        const parsed = JSON.parse(tos);
        setTosAcknowledgment({
          ...parsed,
          acknowledgedAt: new Date(parsed.acknowledgedAt),
        });
      }

      const storedTreatmentConfigs = await AsyncStorage.getItem(STORAGE_KEYS.TREATMENT_CONFIGS);
      if (storedTreatmentConfigs) {
        const parsed = JSON.parse(storedTreatmentConfigs);
        const defaultConfigs = getDefaultTreatmentConfigs();
        const mergedConfigs = defaultConfigs.map(defaultConfig => {
          const stored = parsed.find((p: TreatmentConfig) => p.id === defaultConfig.id);
          return stored ? { ...defaultConfig, enabled: stored.enabled, customPrice: stored.customPrice } : defaultConfig;
        });
        setTreatmentConfigs(mergedConfigs);
        console.log('[AppContext] Treatment configs loaded:', mergedConfigs.length);
      }

      const storedBasicInfo = await AsyncStorage.getItem(STORAGE_KEYS.PATIENT_BASIC_INFO);
      if (storedBasicInfo) {
        try {
          let parsed: PatientBasicInfo;
          if (isEncryptedData(storedBasicInfo)) {
            parsed = await decryptObject<PatientBasicInfo>(storedBasicInfo);
            console.log('[AppContext] Patient basic info decrypted successfully');
          } else {
            parsed = JSON.parse(storedBasicInfo);
          }
          setPatientBasicInfo(parsed);
          console.log('[AppContext] Patient basic info loaded:', parsed.name);
        } catch (decryptError) {
          console.log('[AppContext] Error decrypting basic info:', decryptError);
        }
      }
      setIsLoadingIntro(false);
    } catch (error) {
      setIsLoadingIntro(false);
      console.log('[AppContext] Error loading stored data:', error);
    }
  };

  const migrateToEncryptedStorage = async () => {
    console.log('[AppContext] Starting migration to encrypted storage...');
    try {
      const legacyLeads = await AsyncStorage.getItem(LEGACY_STORAGE_KEYS.LEADS);
      if (legacyLeads && !isEncryptedData(legacyLeads)) {
        const encrypted = await encryptObject(JSON.parse(legacyLeads));
        await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.LEADS);
        console.log('[AppContext] Leads migrated to encrypted storage');
      }

      const legacyHealth = await AsyncStorage.getItem(LEGACY_STORAGE_KEYS.HEALTH_PROFILE);
      if (legacyHealth && !isEncryptedData(legacyHealth)) {
        const encrypted = await encryptObject(JSON.parse(legacyHealth));
        await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_PROFILE, encrypted);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.HEALTH_PROFILE);
        console.log('[AppContext] Health profile migrated to encrypted storage');
      }

      const legacyConsent = await AsyncStorage.getItem(LEGACY_STORAGE_KEYS.PATIENT_CONSENT);
      if (legacyConsent && !isEncryptedData(legacyConsent)) {
        const encrypted = await encryptObject(JSON.parse(legacyConsent));
        await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_CONSENT, encrypted);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.PATIENT_CONSENT);
        console.log('[AppContext] Patient consent migrated to encrypted storage');
      }

      const legacyBasicInfo = await AsyncStorage.getItem(LEGACY_STORAGE_KEYS.PATIENT_BASIC_INFO);
      if (legacyBasicInfo && !isEncryptedData(legacyBasicInfo)) {
        const encrypted = await encryptObject(JSON.parse(legacyBasicInfo));
        await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_BASIC_INFO, encrypted);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.PATIENT_BASIC_INFO);
        console.log('[AppContext] Patient basic info migrated to encrypted storage');
      }

      console.log('[AppContext] Migration to encrypted storage complete');
    } catch (error) {
      console.log('[AppContext] Migration error:', error);
    }
  };

  const authenticateStaff = useCallback((passcode: string): boolean => {
    if (passcode === '2026') {
      setIsStaffAuthenticated(true);
      setViewMode('clinic');
      return true;
    }
    return false;
  }, []);

  const logoutStaff = useCallback(() => {
    setIsStaffAuthenticated(false);
    setViewMode('client');
  }, []);

  const completeIntro = useCallback(async () => {
    setHasCompletedIntro(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INTRO_COMPLETE, 'true');
    } catch (error) {
      console.log('Error saving intro state:', error);
    }
  }, []);

  const saveHealthProfile = useCallback(async (profile: PatientHealthProfile) => {
    setPatientHealthProfile(profile);
    try {
      const encrypted = await encryptObject(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_PROFILE, encrypted);
      console.log('[AppContext] Health profile encrypted and saved');
    } catch (error) {
      console.log('[AppContext] Error saving health profile:', error);
    }
  }, []);

  const clearHealthProfile = useCallback(async () => {
    setPatientHealthProfile(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.HEALTH_PROFILE);
    } catch (error) {
      console.log('Error clearing health profile:', error);
    }
  }, []);

  const savePatientConsent = useCallback(async (consent: PatientConsent) => {
    setPatientConsent(consent);
    try {
      const encrypted = await encryptObject(consent);
      await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_CONSENT, encrypted);
      console.log('[AppContext] Patient consent encrypted and saved');
    } catch (error) {
      console.log('[AppContext] Error saving patient consent:', error);
    }
  }, []);

  const clearPatientConsent = useCallback(async () => {
    setPatientConsent(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PATIENT_CONSENT);
    } catch (error) {
      console.log('Error clearing patient consent:', error);
    }
  }, []);

  const saveTosAcknowledgment = useCallback(async (acknowledgment: TermsOfServiceAcknowledgment) => {
    setTosAcknowledgment(acknowledgment);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOS_ACKNOWLEDGMENT, JSON.stringify(acknowledgment));
      console.log('ToS acknowledgment saved:', acknowledgment);
    } catch (error) {
      console.log('Error saving ToS acknowledgment:', error);
    }
  }, []);

  const clearTosAcknowledgment = useCallback(async () => {
    setTosAcknowledgment(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOS_ACKNOWLEDGMENT);
    } catch (error) {
      console.log('Error clearing ToS acknowledgment:', error);
    }
  }, []);

  const savePatientBasicInfo = useCallback(async (info: PatientBasicInfo) => {
    setPatientBasicInfo(info);
    try {
      const encrypted = await encryptObject(info);
      await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_BASIC_INFO, encrypted);
      console.log('[AppContext] Patient basic info encrypted and saved');
    } catch (error) {
      console.log('[AppContext] Error saving patient basic info:', error);
    }
  }, []);

  const updatePatientEmail = useCallback(async (email: string) => {
    const updatedInfo = patientBasicInfo ? { ...patientBasicInfo, email } : null;
    if (updatedInfo) {
      setPatientBasicInfo(updatedInfo);
      try {
        const encrypted = await encryptObject(updatedInfo);
        await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_BASIC_INFO, encrypted);
        console.log('[AppContext] Patient email encrypted and updated');
      } catch (error) {
        console.log('[AppContext] Error updating patient email:', error);
      }
    }
  }, [patientBasicInfo]);

  const clearPatientBasicInfo = useCallback(async () => {
    setPatientBasicInfo(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PATIENT_BASIC_INFO);
    } catch (error) {
      console.log('Error clearing patient basic info:', error);
    }
  }, []);

  const updateTreatmentConfig = useCallback(async (treatmentId: string, updates: Partial<Pick<TreatmentConfig, 'enabled' | 'customPrice'>>) => {
    const updatedConfigs = treatmentConfigs.map(config => {
      if (config.id === treatmentId) {
        return { ...config, ...updates };
      }
      return config;
    });
    setTreatmentConfigs(updatedConfigs);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TREATMENT_CONFIGS, JSON.stringify(updatedConfigs));
      console.log('Treatment config updated:', treatmentId, updates);
    } catch (error) {
      console.log('Error saving treatment config:', error);
    }
  }, [treatmentConfigs]);

  const toggleAllTreatments = useCallback(async (category: 'procedure' | 'peptide' | 'iv' | 'all', enabled: boolean) => {
    const updatedConfigs = treatmentConfigs.map(config => {
      if (category === 'all' || config.category === category) {
        return { ...config, enabled };
      }
      return config;
    });
    setTreatmentConfigs(updatedConfigs);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TREATMENT_CONFIGS, JSON.stringify(updatedConfigs));
      console.log('All treatments toggled:', category, enabled);
    } catch (error) {
      console.log('Error saving treatment configs:', error);
    }
  }, [treatmentConfigs]);

  const resetTreatmentConfigs = useCallback(async () => {
    const defaultConfigs = getDefaultTreatmentConfigs();
    setTreatmentConfigs(defaultConfigs);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TREATMENT_CONFIGS, JSON.stringify(defaultConfigs));
      console.log('Treatment configs reset to defaults');
    } catch (error) {
      console.log('Error resetting treatment configs:', error);
    }
  }, []);

  const isTreatmentEnabled = useCallback((treatmentName: string): boolean => {
    const normalizedName = treatmentName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const config = treatmentConfigs.find(c => {
      const configNormalized = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return configNormalized === normalizedName || c.id.replace(/_/g, '') === normalizedName;
    });
    return config?.enabled ?? true;
  }, [treatmentConfigs]);

  const getTreatmentPrice = useCallback((treatmentName: string): string => {
    const normalizedName = treatmentName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const config = treatmentConfigs.find(c => {
      const configNormalized = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return configNormalized === normalizedName || c.id.replace(/_/g, '') === normalizedName;
    });
    return config?.customPrice || config?.defaultPrice || '';
  }, [treatmentConfigs]);

  const clearAllCache = useCallback(async () => {
    console.log('[AppContext] Clearing all cache...');
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LEADS,
        STORAGE_KEYS.INTRO_COMPLETE,
        STORAGE_KEYS.HEALTH_PROFILE,
        STORAGE_KEYS.PATIENT_CONSENT,
        STORAGE_KEYS.TOS_ACKNOWLEDGMENT,
        STORAGE_KEYS.TREATMENT_CONFIGS,
        STORAGE_KEYS.PATIENT_BASIC_INFO,
      ]);
      setLeads([]);
      setHasCompletedIntro(false);
      setPatientHealthProfile(null);
      setPatientConsent(null);
      setTosAcknowledgment(null);
      setTreatmentConfigs(getDefaultTreatmentConfigs());
      setPatientBasicInfo(null);
      setCurrentAnalysis(null);
      setCapturedImage(null);
      setSimulatedImage(null);
      setHasUnlockedResults(false);
      console.log('[AppContext] Cache cleared successfully');
    } catch (error) {
      console.log('[AppContext] Error clearing cache:', error);
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    console.log('[AppContext] Force refreshing data...');
    await loadStoredData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsePrice = (priceStr: string): number => {
    const cleanedPrice = priceStr.replace(/[^0-9,-]/g, '');
    const parts = cleanedPrice.split('-').map(p => parseFloat(p.replace(/,/g, '')) || 0);
    if (parts.length === 2) {
      return (parts[0] + parts[1]) / 2;
    }
    return parts[0] || 0;
  };

  const addLead = useCallback(async (name: string, phone: string): Promise<void> => {
    if (!currentAnalysis) {
      console.log('Cannot add lead: No current analysis available');
      return;
    }

    console.log('Adding lead with analysis data:', {
      roadmapCount: currentAnalysis.clinicalRoadmap?.length || 0,
      peptidesCount: currentAnalysis.peptideTherapy?.length || 0,
      ivCount: currentAnalysis.ivOptimization?.length || 0,
    });

    const roadmapData = currentAnalysis.clinicalRoadmap || [];
    const peptideData = currentAnalysis.peptideTherapy || [];
    const ivData = currentAnalysis.ivOptimization || [];

    const roadmapValue = roadmapData.reduce((acc, proc) => {
      return acc + parsePrice(proc.price || '0');
    }, 0);

    const peptideValue = peptideData.reduce((acc, peptide) => {
      return acc + 350;
    }, 0);

    const ivValue = ivData.reduce((acc, iv) => {
      return acc + 275;
    }, 0);

    const estimatedValue = Math.round(roadmapValue + peptideValue + ivValue);

    const newLead: Lead = {
      id: Date.now().toString(),
      name,
      phone,
      auraScore: currentAnalysis.auraScore,
      faceType: currentAnalysis.faceType,
      estimatedValue,
      roadmap: roadmapData.map(proc => ({
        name: proc.name,
        benefit: proc.benefit,
        price: proc.price,
        clinicalReason: proc.clinicalReason,
        safetyStatus: proc.safetyStatus,
      })),
      peptides: peptideData.map(p => ({
        name: p.name,
        goal: p.goal,
        mechanism: p.mechanism,
        frequency: p.frequency,
        safetyStatus: p.safetyStatus,
      })),
      ivDrips: ivData.map(iv => ({
        name: iv.name,
        benefit: iv.benefit,
        ingredients: iv.ingredients,
        duration: iv.duration,
        safetyStatus: iv.safetyStatus,
      })),
      skinIQ: currentAnalysis.skinIQ,
      volumeAssessment: currentAnalysis.volumeAssessment,
      fitzpatrickAssessment: currentAnalysis.fitzpatrickAssessment,
      status: 'new',
      createdAt: new Date(),
    };

    console.log('New lead created:', {
      id: newLead.id,
      name: newLead.name,
      roadmapItems: newLead.roadmap?.length || 0,
      peptideItems: newLead.peptides?.length || 0,
      ivItems: newLead.ivDrips?.length || 0,
    });

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    setHasUnlockedResults(true);

    try {
      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      console.log('[AppContext] Lead encrypted and saved successfully');
    } catch (error) {
      console.log('[AppContext] Error saving lead:', error);
    }
  }, [currentAnalysis, leads]);

  const resetScan = useCallback(() => {
    setCapturedImage(null);
    setSimulatedImage(null);
    setCurrentAnalysis(null);
    setHasUnlockedResults(false);
  }, []);

  const deleteLead = useCallback(async (leadId: string): Promise<void> => {
    const updatedLeads = leads.filter(lead => lead.id !== leadId);
    setLeads(updatedLeads);
    try {
      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      console.log('[AppContext] Lead deleted:', leadId);
    } catch (error) {
      console.log('[AppContext] Error deleting lead:', error);
    }
  }, [leads]);

  const updateLeadTreatments = useCallback(async (leadId: string, selectedTreatments: SelectedTreatment[]): Promise<void> => {
    const signedTreatments = selectedTreatments.filter(t => t.complianceSignOff?.acknowledged);
    const hasSignedTreatments = signedTreatments.length > 0;
    
    let newEstimatedValue = 0;
    if (hasSignedTreatments) {
      signedTreatments.forEach(st => {
        if (st.treatmentType === 'procedure') {
          const proc = st.treatment as ClinicalProcedure;
          newEstimatedValue += parsePrice(proc.price || '0');
        } else if (st.treatmentType === 'peptide') {
          newEstimatedValue += 350;
        } else if (st.treatmentType === 'iv') {
          newEstimatedValue += 275;
        }
      });
    }

    const newSignatureRecords: SignatureRecord[] = signedTreatments
      .filter(st => st.complianceSignOff)
      .map(st => ({
        type: 'treatment_signoff' as const,
        practitionerSignature: st.complianceSignOff!.practitionerSignature,
        treatmentName: 'name' in st.treatment ? st.treatment.name : '',
        signedAt: new Date(st.complianceSignOff!.signedAt),
        timestamp: st.complianceSignOff!.timestamp,
      }));
    
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        const existingSignatures = lead.signatureLog || [];
        const existingTreatmentNames = existingSignatures
          .filter(s => s.type === 'treatment_signoff')
          .map(s => s.treatmentName);
        const uniqueNewSignatures = newSignatureRecords.filter(
          s => !existingTreatmentNames.includes(s.treatmentName)
        );
        
        return { 
          ...lead, 
          selectedTreatments,
          status: hasSignedTreatments ? 'contacted' as const : lead.status,
          estimatedValue: hasSignedTreatments ? Math.round(newEstimatedValue) : lead.estimatedValue,
          patientConsent: lead.patientConsent || patientConsent || undefined,
          signatureLog: [...existingSignatures, ...uniqueNewSignatures],
        };
      }
      return lead;
    });
    setLeads(updatedLeads);
    try {
      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      console.log('[AppContext] Lead treatments encrypted and updated:', leadId);
    } catch (error) {
      console.log('[AppContext] Error updating lead treatments:', error);
    }
  }, [leads, patientConsent]);

  const getLeadById = useCallback((leadId: string): Lead | undefined => {
    return leads.find(lead => lead.id === leadId);
  }, [leads]);

  const attachConsentToLead = useCallback(async (leadId: string, consent: PatientConsent): Promise<void> => {
    const consentSignature: SignatureRecord = {
      type: 'patient_consent',
      patientSignature: consent.patientSignature,
      practitionerSignature: consent.providerSignature,
      signedAt: new Date(consent.consentedAt),
      timestamp: consent.timestamp,
    };

    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        const existingSignatures = lead.signatureLog || [];
        const hasConsentSignature = existingSignatures.some(s => s.type === 'patient_consent');
        
        return {
          ...lead,
          patientConsent: consent,
          signatureLog: hasConsentSignature ? existingSignatures : [consentSignature, ...existingSignatures],
        };
      }
      return lead;
    });
    setLeads(updatedLeads);
    try {
      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      console.log('[AppContext] Patient consent encrypted and attached to lead:', leadId);
    } catch (error) {
      console.log('[AppContext] Error attaching consent to lead:', error);
    }
  }, [leads]);

  const updateLeadEmail = useCallback(async (leadId: string, email: string): Promise<void> => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, email };
      }
      return lead;
    });
    setLeads(updatedLeads);
    try {
      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      console.log('[AppContext] Lead email encrypted and updated:', leadId);
    } catch (error) {
      console.log('[AppContext] Error updating lead email:', error);
    }
  }, [leads]);

  const stats = isStaffAuthenticated ? {
    pipeline: leads.reduce((acc, lead) => acc + (lead.estimatedValue || 0), 0),
    scans: leads.length,
    conversion: leads.length > 0
      ? Math.round((leads.filter(l => l.status === 'contacted').length / leads.length) * 100)
      : 0,
  } : {
    pipeline: 0,
    scans: 0,
    conversion: 0,
  };

  const protectedLeads = isStaffAuthenticated ? leads : [];

  return {
    viewMode,
    setViewMode,
    isStaffAuthenticated,
    authenticateStaff,
    logoutStaff,
    leads: protectedLeads,
    currentAnalysis,
    setCurrentAnalysis,
    capturedImage,
    setCapturedImage,
    simulatedImage,
    setSimulatedImage,
    hasUnlockedResults,
    setHasUnlockedResults,
    addLead,
    deleteLead,
    updateLeadTreatments,
    getLeadById,
    attachConsentToLead,
    updateLeadEmail,
    resetScan,
    stats,
    hasCompletedIntro,
    isLoadingIntro,
    completeIntro,
    patientHealthProfile,
    saveHealthProfile,
    clearHealthProfile,
    patientConsent,
    savePatientConsent,
    clearPatientConsent,
    tosAcknowledgment,
    saveTosAcknowledgment,
    clearTosAcknowledgment,
    treatmentConfigs,
    updateTreatmentConfig,
    toggleAllTreatments,
    resetTreatmentConfigs,
    isTreatmentEnabled,
    getTreatmentPrice,
    clearAllCache,
    forceRefresh,
    isDevMode,
    setIsDevMode,
    patientBasicInfo,
    savePatientBasicInfo,
    updatePatientEmail,
    clearPatientBasicInfo,
    encryptionStatus,
  };
});
