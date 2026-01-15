import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AnalysisResult, Lead, ViewMode, PatientHealthProfile, PatientConsent, TermsOfServiceAcknowledgment, SelectedTreatment, ClinicSettings, TreatmentPriceConfig } from '@/types';
import { trpc } from '@/lib/trpc';

const STORAGE_KEYS = {
  LEADS: 'aura_gold_leads',
  INTRO_COMPLETE: 'aura_gold_intro_complete',
  HEALTH_PROFILE: 'aura_gold_health_profile',
  PATIENT_CONSENT: 'aura_gold_patient_consent',
  TOS_ACKNOWLEDGMENT: 'aura_gold_tos_acknowledgment',
  CLINIC_SETTINGS: 'aura_gold_clinic_settings',
};

const DEFAULT_TREATMENTS: TreatmentPriceConfig[] = [
  { treatmentName: 'Wrinkle Relaxers', enabled: true, customPrice: '$300-$600', defaultPrice: '$300-$600', category: 'procedure' },
  { treatmentName: 'Botox', enabled: true, customPrice: '$300-$600', defaultPrice: '$300-$600', category: 'procedure' },
  { treatmentName: 'Dermal Fillers', enabled: true, customPrice: '$600-$1,200', defaultPrice: '$600-$1,200', category: 'procedure' },
  { treatmentName: 'Lip Filler', enabled: true, customPrice: '$500-$800', defaultPrice: '$500-$800', category: 'procedure' },
  { treatmentName: 'DiamondGlow', enabled: true, customPrice: '$175-$300', defaultPrice: '$175-$300', category: 'procedure' },
  { treatmentName: 'Chemical Peels', enabled: true, customPrice: '$150-$400', defaultPrice: '$150-$400', category: 'procedure' },
  { treatmentName: 'HydraFacial', enabled: true, customPrice: '$150-$350', defaultPrice: '$150-$350', category: 'procedure' },
  { treatmentName: 'Microneedling', enabled: true, customPrice: '$250-$700', defaultPrice: '$250-$700', category: 'procedure' },
  { treatmentName: 'RF Microneedling', enabled: true, customPrice: '$800-$1,500', defaultPrice: '$800-$1,500', category: 'procedure' },
  { treatmentName: 'Morpheus8', enabled: true, customPrice: '$1,000-$2,000', defaultPrice: '$1,000-$2,000', category: 'procedure' },
  { treatmentName: 'IPL', enabled: true, customPrice: '$300-$600', defaultPrice: '$300-$600', category: 'procedure' },
  { treatmentName: 'PDO Thread Lift', enabled: true, customPrice: '$1,500-$4,000', defaultPrice: '$1,500-$4,000', category: 'procedure' },
  { treatmentName: 'Sculptra', enabled: true, customPrice: '$800-$1,200', defaultPrice: '$800-$1,200', category: 'procedure' },
  { treatmentName: 'Kybella', enabled: true, customPrice: '$600-$1,200', defaultPrice: '$600-$1,200', category: 'procedure' },
  { treatmentName: 'Clear + Brilliant', enabled: true, customPrice: '$400-$700', defaultPrice: '$400-$700', category: 'procedure' },
  { treatmentName: 'MOXI Laser', enabled: true, customPrice: '$500-$900', defaultPrice: '$500-$900', category: 'procedure' },
  { treatmentName: 'Exosome Therapy', enabled: true, customPrice: '$500-$1,500', defaultPrice: '$500-$1,500', category: 'procedure' },
  { treatmentName: 'GHK-Cu', enabled: true, customPrice: '$350', defaultPrice: '$350', category: 'peptide' },
  { treatmentName: 'BPC-157', enabled: true, customPrice: '$350', defaultPrice: '$350', category: 'peptide' },
  { treatmentName: 'Epithalon', enabled: true, customPrice: '$400', defaultPrice: '$400', category: 'peptide' },
  { treatmentName: 'TB-500', enabled: true, customPrice: '$350', defaultPrice: '$350', category: 'peptide' },
  { treatmentName: 'Thymosin Alpha-1', enabled: true, customPrice: '$400', defaultPrice: '$400', category: 'peptide' },
  { treatmentName: 'NAD+ Infusion', enabled: true, customPrice: '$350-$600', defaultPrice: '$350-$600', category: 'iv' },
  { treatmentName: 'Myers Cocktail', enabled: true, customPrice: '$150-$300', defaultPrice: '$150-$300', category: 'iv' },
  { treatmentName: 'Glutathione Push', enabled: true, customPrice: '$50-$100', defaultPrice: '$50-$100', category: 'iv' },
  { treatmentName: 'Vitamin C Drip', enabled: true, customPrice: '$150-$250', defaultPrice: '$150-$250', category: 'iv' },
  { treatmentName: 'Glow Drip', enabled: true, customPrice: '$200-$350', defaultPrice: '$200-$350', category: 'iv' },
];

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
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);

  const leadsQuery = trpc.leads.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      console.log('Lead saved to backend successfully');
      leadsQuery.refetch();
    },
    onError: (error) => {
      console.log('Error saving lead to backend:', error);
    },
  });

  const deleteLeadMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      console.log('Lead deleted from backend successfully');
      leadsQuery.refetch();
    },
    onError: (error) => {
      console.log('Error deleting lead from backend:', error);
    },
  });

  const updateLeadMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      console.log('Lead updated on backend successfully');
      leadsQuery.refetch();
    },
    onError: (error) => {
      console.log('Error updating lead on backend:', error);
    },
  });

  const filterValidTreatments = useCallback(<T extends { name?: string; benefit?: string; goal?: string; clinicalReason?: string; price?: string }>(treatments: T[]): T[] => {
    if (!Array.isArray(treatments)) return [];
    const invalidPatterns = ['loading', 'please wait', 'analyzing', '---', 'generating', 'processing', '...'];
    return treatments.filter(t => {
      if (!t || !t.name) return false;
      const name = (t.name || '').toLowerCase().trim();
      const benefit = (t.benefit || (t as { goal?: string }).goal || '').toLowerCase().trim();
      const reason = ((t as { clinicalReason?: string }).clinicalReason || '').toLowerCase().trim();
      const hasInvalidName = invalidPatterns.some(p => name.includes(p)) || name === '' || name === '...';
      const hasInvalidBenefit = invalidPatterns.some(p => benefit.includes(p)) || benefit === '';
      const hasInvalidReason = invalidPatterns.some(p => reason.includes(p));
      const hasInvalidPrice = t.price === '---' || t.price === '';
      return !(hasInvalidName || hasInvalidBenefit || hasInvalidReason || hasInvalidPrice);
    });
  }, []);

  useEffect(() => {
    console.log('leadsQuery state - isLoading:', leadsQuery.isLoading, 'isError:', leadsQuery.isError, 'hasData:', !!leadsQuery.data);
    if (leadsQuery.isError) {
      console.log('leadsQuery error:', leadsQuery.error);
    }
    if (leadsQuery.data) {
      console.log('leadsQuery.data:', JSON.stringify(leadsQuery.data).substring(0, 300));
    }
    
    if (leadsQuery.data?.success && leadsQuery.data.leads) {
      console.log('Loaded leads from backend:', leadsQuery.data.leads.length);
      const parsedLeads = leadsQuery.data.leads.map((l: Record<string, unknown>) => {
        let roadmap = l.roadmap;
        if (!roadmap) roadmap = [];
        if (!Array.isArray(roadmap)) {
          console.log('Roadmap not array in context for', l.name, '- type:', typeof roadmap);
          roadmap = [];
        }
        
        let peptides = l.peptides;
        if (!peptides) peptides = [];
        if (!Array.isArray(peptides)) {
          console.log('Peptides not array in context for', l.name, '- type:', typeof peptides);
          peptides = [];
        }
        
        let ivDrips = l.ivDrips;
        if (!ivDrips) ivDrips = [];
        if (!Array.isArray(ivDrips)) {
          console.log('ivDrips not array in context for', l.name, '- type:', typeof ivDrips);
          ivDrips = [];
        }
        
        let selectedTreatments = l.selectedTreatments;
        if (!selectedTreatments) selectedTreatments = [];
        if (!Array.isArray(selectedTreatments)) {
          console.log('selectedTreatments not array in context for', l.name, '- type:', typeof selectedTreatments);
          selectedTreatments = [];
        }
        
        const filteredRoadmap = filterValidTreatments(roadmap as Lead['roadmap']);
        const filteredPeptides = filterValidTreatments(peptides as Lead['peptides']);
        const filteredIvDrips = filterValidTreatments(ivDrips as Lead['ivDrips']);
        
        console.log('Lead', l.name, '- raw roadmap:', (roadmap as unknown[]).length, 'filtered:', filteredRoadmap.length,
          '| raw peptides:', (peptides as unknown[]).length, 'filtered:', filteredPeptides.length,
          '| raw ivDrips:', (ivDrips as unknown[]).length, 'filtered:', filteredIvDrips.length);
        
        return {
          ...l,
          createdAt: new Date(l.createdAt as string),
          roadmap: filteredRoadmap,
          peptides: filteredPeptides,
          ivDrips: filteredIvDrips,
          selectedTreatments: selectedTreatments as Lead['selectedTreatments'],
        };
      }) as Lead[];
      
      const totalSelected = parsedLeads.reduce((acc, lead) => acc + (lead.selectedTreatments?.length || 0), 0);
      const totalRoadmap = parsedLeads.reduce((acc, lead) => acc + (lead.roadmap?.length || 0), 0);
      console.log('Total valid roadmap items across all leads:', totalRoadmap);
      console.log('Total treatments selected across all leads:', totalSelected);
      
      setLeads(parsedLeads);
    } else if (leadsQuery.data && !leadsQuery.data.success) {
      console.log('Backend returned error:', leadsQuery.data.error);
    }
  }, [leadsQuery.data, leadsQuery.isLoading, leadsQuery.isError, leadsQuery.error, filterValidTreatments]);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
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

      const settings = await AsyncStorage.getItem(STORAGE_KEYS.CLINIC_SETTINGS);
      if (settings) {
        const parsed = JSON.parse(settings);
        setClinicSettings({
          ...parsed,
          updatedAt: new Date(parsed.updatedAt),
        });
        console.log('Loaded clinic settings:', parsed.treatmentConfigs?.length, 'treatments configured');
      } else {
        const defaultSettings: ClinicSettings = {
          treatmentConfigs: DEFAULT_TREATMENTS,
          clinicName: '',
          onboardingComplete: false,
          updatedAt: new Date(),
        };
        setClinicSettings(defaultSettings);
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

  const saveClinicSettings = useCallback(async (settings: ClinicSettings) => {
    const updatedSettings = { ...settings, updatedAt: new Date() };
    setClinicSettings(updatedSettings);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CLINIC_SETTINGS, JSON.stringify(updatedSettings));
      console.log('Clinic settings saved:', settings.treatmentConfigs.length, 'treatments');
    } catch (error) {
      console.log('Error saving clinic settings:', error);
    }
  }, []);

  const updateTreatmentConfig = useCallback(async (treatmentName: string, updates: Partial<TreatmentPriceConfig>) => {
    if (!clinicSettings) return;
    
    const updatedConfigs = clinicSettings.treatmentConfigs.map(config => {
      if (config.treatmentName === treatmentName) {
        return { ...config, ...updates };
      }
      return config;
    });

    const exists = updatedConfigs.some(c => c.treatmentName === treatmentName);
    if (!exists && updates.treatmentName) {
      updatedConfigs.push({
        treatmentName: updates.treatmentName || treatmentName,
        enabled: updates.enabled ?? true,
        customPrice: updates.customPrice || '$0',
        defaultPrice: updates.defaultPrice || '$0',
        category: updates.category || 'procedure',
      });
    }

    const newSettings = { ...clinicSettings, treatmentConfigs: updatedConfigs };
    await saveClinicSettings(newSettings);
  }, [clinicSettings, saveClinicSettings]);

  const getTreatmentPrice = useCallback((treatmentName: string): string | null => {
    if (!clinicSettings) return null;
    const config = clinicSettings.treatmentConfigs.find(c => c.treatmentName === treatmentName);
    return config ? config.customPrice : null;
  }, [clinicSettings]);

  const isTreatmentEnabled = useCallback((treatmentName: string): boolean => {
    if (!clinicSettings) return true;
    const config = clinicSettings.treatmentConfigs.find(c => c.treatmentName === treatmentName);
    return config ? config.enabled : true;
  }, [clinicSettings]);

  const parsePrice = (priceStr: string): number => {
    const cleanedPrice = priceStr.replace(/[^0-9,-]/g, '');
    const parts = cleanedPrice.split('-').map(p => parseFloat(p.replace(/,/g, '')) || 0);
    if (parts.length === 2) {
      return (parts[0] + parts[1]) / 2;
    }
    return parts[0] || 0;
  };

  const isValidTreatmentData = useCallback((treatment: { name?: string; benefit?: string; goal?: string; clinicalReason?: string; price?: string }): boolean => {
    if (!treatment || !treatment.name) return false;
    const invalidPatterns = ['loading', 'please wait', 'analyzing', '---', 'generating', 'processing', '...'];
    const name = (treatment.name || '').toLowerCase().trim();
    const benefit = (treatment.benefit || treatment.goal || '').toLowerCase().trim();
    const reason = ((treatment as { clinicalReason?: string }).clinicalReason || '').toLowerCase().trim();
    
    const hasInvalidName = invalidPatterns.some(p => name.includes(p)) || name === '' || name === '...';
    const hasInvalidBenefit = invalidPatterns.some(p => benefit.includes(p)) || benefit === '';
    const hasInvalidReason = invalidPatterns.some(p => reason.includes(p));
    const hasInvalidPrice = treatment.price === '---' || treatment.price === '' || !treatment.price;
    
    const isInvalid = hasInvalidName || hasInvalidBenefit || hasInvalidReason || hasInvalidPrice;
    if (isInvalid) {
      console.log('Filtering invalid treatment before save:', treatment.name);
    }
    return !isInvalid;
  }, []);

  const addLead = useCallback(async (name: string, phone: string): Promise<void> => {
    if (!currentAnalysis) return;

    const validRoadmap = currentAnalysis.clinicalRoadmap.filter(t => isValidTreatmentData(t));
    const validPeptides = currentAnalysis.peptideTherapy.filter(t => isValidTreatmentData(t));
    const validIvDrips = currentAnalysis.ivOptimization.filter(t => isValidTreatmentData(t));

    console.log('Filtered treatments - roadmap:', validRoadmap.length, '/', currentAnalysis.clinicalRoadmap.length,
      'peptides:', validPeptides.length, '/', currentAnalysis.peptideTherapy.length,
      'ivDrips:', validIvDrips.length, '/', currentAnalysis.ivOptimization.length);

    if (validRoadmap.length === 0 && validPeptides.length === 0 && validIvDrips.length === 0) {
      console.log('ERROR: No valid treatments to save - all treatments had invalid/placeholder data');
    }

    const roadmapValue = validRoadmap.reduce((acc, proc) => {
      return acc + parsePrice(proc.price);
    }, 0);

    const peptideValue = validPeptides.reduce((acc) => {
      return acc + 350;
    }, 0);

    const ivValue = validIvDrips.reduce((acc) => {
      return acc + 275;
    }, 0);

    const estimatedValue = Math.round(roadmapValue + peptideValue + ivValue);
    const leadId = Date.now().toString();

    const newLead: Lead = {
      id: leadId,
      name,
      phone,
      auraScore: currentAnalysis.auraScore,
      faceType: currentAnalysis.faceType,
      estimatedValue,
      roadmap: validRoadmap,
      peptides: validPeptides,
      ivDrips: validIvDrips,
      status: 'new',
      createdAt: new Date(),
    };

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    setHasUnlockedResults(true);

    console.log('Creating lead on backend:', newLead.name, 'with', validRoadmap.length, 'roadmap,', validPeptides.length, 'peptides,', validIvDrips.length, 'ivDrips');
    createLeadMutation.mutate({
      id: leadId,
      name,
      phone,
      auraScore: currentAnalysis.auraScore,
      faceType: currentAnalysis.faceType,
      estimatedValue,
      roadmap: validRoadmap,
      peptides: validPeptides,
      ivDrips: validIvDrips,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
  }, [currentAnalysis, leads, createLeadMutation, isValidTreatmentData]);

  const resetScan = useCallback(() => {
    setCapturedImage(null);
    setSimulatedImage(null);
    setCurrentAnalysis(null);
    setHasUnlockedResults(false);
  }, []);

  const deleteLead = useCallback(async (leadId: string): Promise<void> => {
    const updatedLeads = leads.filter(lead => lead.id !== leadId);
    setLeads(updatedLeads);
    
    console.log('Deleting lead from backend:', leadId);
    deleteLeadMutation.mutate({ id: leadId });
  }, [leads, deleteLeadMutation]);

  const updateLeadTreatments = useCallback(async (leadId: string, selectedTreatments: SelectedTreatment[]): Promise<void> => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, selectedTreatments };
      }
      return lead;
    });
    setLeads(updatedLeads);
    
    console.log('Updating lead treatments on backend:', leadId);
    const serializedTreatments = selectedTreatments.map(t => ({
      treatment: t.treatment,
      treatmentType: t.treatmentType,
      dosing: t.dosing,
      selectedAt: t.selectedAt instanceof Date ? t.selectedAt.toISOString() : t.selectedAt,
      selectedBy: t.selectedBy,
      complianceSignOff: t.complianceSignOff ? {
        ...t.complianceSignOff,
        signedAt: t.complianceSignOff.signedAt instanceof Date 
          ? t.complianceSignOff.signedAt.toISOString() 
          : t.complianceSignOff.signedAt,
      } : undefined,
    }));
    updateLeadMutation.mutate({
      id: leadId,
      data: { selectedTreatments: serializedTreatments },
    });
  }, [leads, updateLeadMutation]);

  const treatmentsSignedOff = leads.reduce((acc, lead) => {
    if (!lead.selectedTreatments) return acc;
    return acc + lead.selectedTreatments.filter(t => t.complianceSignOff?.acknowledged).length;
  }, 0);

  const treatmentsSelected = leads.reduce((acc, lead) => {
    if (!lead.selectedTreatments) return acc;
    return acc + lead.selectedTreatments.length;
  }, 0);

  const stats = isStaffAuthenticated ? {
    pipeline: leads.reduce((acc, lead) => acc + (lead.estimatedValue || 0), 0),
    scans: leads.length,
    conversion: leads.length > 0
      ? Math.round((leads.filter(l => l.status === 'contacted').length / leads.length) * 100)
      : 0,
    treatmentsSignedOff,
    treatmentsSelected,
  } : {
    pipeline: 0,
    scans: 0,
    conversion: 0,
    treatmentsSignedOff: 0,
    treatmentsSelected: 0,
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
    isLoadingLeads: leadsQuery.isLoading,
    refetchLeads: leadsQuery.refetch,
    clinicSettings,
    saveClinicSettings,
    updateTreatmentConfig,
    getTreatmentPrice,
    isTreatmentEnabled,
  };
});
