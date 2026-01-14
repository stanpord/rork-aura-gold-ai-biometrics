import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { AnalysisResult, Lead, ViewMode, PatientHealthProfile, PatientConsent, TermsOfServiceAcknowledgment, SelectedTreatment } from '@/types';
import { trpc } from '@/lib/trpc';

const STORAGE_KEYS = {
  LEADS: 'aura_gold_leads',
  INTRO_COMPLETE: 'aura_gold_intro_complete',
  HEALTH_PROFILE: 'aura_gold_health_profile',
  PATIENT_CONSENT: 'aura_gold_patient_consent',
  TOS_ACKNOWLEDGMENT: 'aura_gold_tos_acknowledgment',
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

  useEffect(() => {
    if (leadsQuery.data?.success && leadsQuery.data.leads) {
      console.log('Loaded leads from backend:', leadsQuery.data.leads.length);
      const parsedLeads = leadsQuery.data.leads.map((l: Record<string, unknown>) => ({
        ...l,
        createdAt: new Date(l.createdAt as string),
      })) as Lead[];
      setLeads(parsedLeads);
    }
  }, [leadsQuery.data]);

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

  const parsePrice = (priceStr: string): number => {
    const cleanedPrice = priceStr.replace(/[^0-9,-]/g, '');
    const parts = cleanedPrice.split('-').map(p => parseFloat(p.replace(/,/g, '')) || 0);
    if (parts.length === 2) {
      return (parts[0] + parts[1]) / 2;
    }
    return parts[0] || 0;
  };

  const addLead = useCallback(async (name: string, phone: string): Promise<void> => {
    if (!currentAnalysis) return;

    const roadmapValue = currentAnalysis.clinicalRoadmap.reduce((acc, proc) => {
      return acc + parsePrice(proc.price);
    }, 0);

    const peptideValue = currentAnalysis.peptideTherapy.reduce((acc) => {
      return acc + 350;
    }, 0);

    const ivValue = currentAnalysis.ivOptimization.reduce((acc) => {
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
      roadmap: currentAnalysis.clinicalRoadmap,
      peptides: currentAnalysis.peptideTherapy,
      ivDrips: currentAnalysis.ivOptimization,
      status: 'new',
      createdAt: new Date(),
    };

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    setHasUnlockedResults(true);

    console.log('Creating lead on backend:', newLead.name);
    createLeadMutation.mutate({
      id: leadId,
      name,
      phone,
      auraScore: currentAnalysis.auraScore,
      faceType: currentAnalysis.faceType,
      estimatedValue,
      roadmap: currentAnalysis.clinicalRoadmap,
      peptides: currentAnalysis.peptideTherapy,
      ivDrips: currentAnalysis.ivOptimization,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
  }, [currentAnalysis, leads, createLeadMutation]);

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

  const stats = isStaffAuthenticated ? {
    pipeline: leads.reduce((acc, lead) => acc + (lead.estimatedValue || 0), 0),
    scans: leads.length,
    conversion: leads.length > 0
      ? Math.round((leads.filter(l => l.status === 'contacted').length / leads.length) * 100)
      : 0,
    treatmentsSignedOff,
  } : {
    pipeline: 0,
    scans: 0,
    conversion: 0,
    treatmentsSignedOff: 0,
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
  };
});
