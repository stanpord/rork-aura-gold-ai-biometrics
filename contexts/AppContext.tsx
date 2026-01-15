import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AnalysisResult, Lead, ViewMode, PatientHealthProfile, PatientConsent, TermsOfServiceAcknowledgment, SelectedTreatment, TreatmentConfig, DEFAULT_TREATMENT_CONFIGS } from '@/types';

const APP_VERSION = '1.0.5';

const STORAGE_KEYS = {
  LEADS: 'aura_gold_leads',
  INTRO_COMPLETE: 'aura_gold_intro_complete',
  HEALTH_PROFILE: 'aura_gold_health_profile',
  PATIENT_CONSENT: 'aura_gold_patient_consent',
  TOS_ACKNOWLEDGMENT: 'aura_gold_tos_acknowledgment',
  TREATMENT_CONFIGS: 'aura_gold_treatment_configs',
  APP_VERSION: 'aura_gold_app_version',
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

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      console.log('[AppContext] Loading stored data, current version:', APP_VERSION);
      
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      if (storedVersion !== APP_VERSION) {
        console.log('[AppContext] Version mismatch, clearing treatment configs cache');
        await AsyncStorage.removeItem(STORAGE_KEYS.TREATMENT_CONFIGS);
        await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
      }
      
      const storedLeads = await AsyncStorage.getItem(STORAGE_KEYS.LEADS);

      if (storedLeads) {
        const parsed = JSON.parse(storedLeads);
        const restoredLeads = parsed.map((l: Lead) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          roadmap: l.roadmap || [],
          peptides: l.peptides || [],
          ivDrips: l.ivDrips || [],
        }));
        setLeads(restoredLeads);
        console.log('Leads restored from storage:', restoredLeads.length, 'leads');
        restoredLeads.forEach((lead: Lead) => {
          console.log(`Lead ${lead.name}: roadmap=${lead.roadmap?.length || 0}, peptides=${lead.peptides?.length || 0}, ivDrips=${lead.ivDrips?.length || 0}`);
        });
      }

      const introComplete = await AsyncStorage.getItem(STORAGE_KEYS.INTRO_COMPLETE);
      if (introComplete === 'true') {
        setHasCompletedIntro(true);
      }

      const healthProfile = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_PROFILE);
      if (healthProfile) {
        const parsed = JSON.parse(healthProfile);
        setPatientHealthProfile({
          ...parsed,
          completedAt: new Date(parsed.completedAt),
        });
      }

      const consent = await AsyncStorage.getItem(STORAGE_KEYS.PATIENT_CONSENT);
      if (consent) {
        const parsed = JSON.parse(consent);
        setPatientConsent({
          ...parsed,
          consentedAt: new Date(parsed.consentedAt),
        });
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
        console.log('Treatment configs loaded:', mergedConfigs.length);
      }
      setIsLoadingIntro(false);
    } catch (error) {
      setIsLoadingIntro(false);
      console.log('Error loading stored data:', error);
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
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_PROFILE, JSON.stringify(profile));
      console.log('Health profile saved:', profile);
    } catch (error) {
      console.log('Error saving health profile:', error);
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
      await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_CONSENT, JSON.stringify(consent));
      console.log('Patient consent saved:', consent);
    } catch (error) {
      console.log('Error saving patient consent:', error);
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
      ]);
      setLeads([]);
      setHasCompletedIntro(false);
      setPatientHealthProfile(null);
      setPatientConsent(null);
      setTosAcknowledgment(null);
      setTreatmentConfigs(getDefaultTreatmentConfigs());
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
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updatedLeads));
      console.log('Lead saved to storage successfully');
    } catch (error) {
      console.log('Error saving lead:', error);
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
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updatedLeads));
      console.log('Lead deleted:', leadId);
    } catch (error) {
      console.log('Error deleting lead:', error);
    }
  }, [leads]);

  const updateLeadTreatments = useCallback(async (leadId: string, selectedTreatments: SelectedTreatment[]): Promise<void> => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, selectedTreatments };
      }
      return lead;
    });
    setLeads(updatedLeads);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updatedLeads));
      console.log('Lead treatments updated:', leadId, selectedTreatments);
    } catch (error) {
      console.log('Error updating lead treatments:', error);
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
  };
});
