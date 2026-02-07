import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { AnalysisResult, Lead, ViewMode, PatientHealthProfile, PatientConsent, TermsOfServiceAcknowledgment, SelectedTreatment, TreatmentConfig, DEFAULT_TREATMENT_CONFIGS, PatientBasicInfo, ClinicalProcedure, SignatureRecord, ScanRecord, BiometricProfile, SafetyStatus } from '@/types';
import { encryptObject, decryptObject, isEncryptedData, getEncryptionStatus, EncryptionStatus } from '@/utils/encryption';
import { checkTreatmentSafety, getExplainableReason, PatientDemographics, SafetyCheckResult } from '@/constants/contraindications';
import { initializeAuditLog, logAuditEvent, logAuthEvent, logPHIAccess, logConsentEvent, getAuditSummary } from '@/utils/auditLog';

const APP_VERSION = '1.0.8';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const SESSION_WARNING_MS = 2 * 60 * 1000;
const ACTIVITY_CHECK_INTERVAL_MS = 30 * 1000;

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
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  
  const lastActivityRef = useRef<number>(Date.now());
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    initializeAuditLog();
    loadStoredData();
  }, []);

  // --- Session Logic ---
  const handleSessionTimeout = useCallback(async () => {
    console.log('[HIPAA] Session timeout - auto-logout triggered');
    await logAuthEvent('SESSION_TIMEOUT', 'staff');
    setIsStaffAuthenticated(false);
    setViewMode('client');
    setSessionTimeRemaining(null);
    setShowSessionWarning(false);
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showSessionWarning) setShowSessionWarning(false);
  }, [showSessionWarning]);

  useEffect(() => {
    if (!isStaffAuthenticated) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setSessionTimeRemaining(null);
      setShowSessionWarning(false);
      return;
    }

    lastActivityRef.current = Date.now();
    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeRemaining = SESSION_TIMEOUT_MS - timeSinceActivity;

      if (timeRemaining <= 0) {
        handleSessionTimeout();
        return;
      }
      setSessionTimeRemaining(Math.ceil(timeRemaining / 1000));
      setShowSessionWarning(timeRemaining <= SESSION_WARNING_MS);
    };

    sessionTimerRef.current = setInterval(checkSession, ACTIVITY_CHECK_INTERVAL_MS);
    checkSession();

    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, [isStaffAuthenticated, handleSessionTimeout]);

  // --- Data Loading & Migration ---
  const loadStoredData = async () => {
    try {
      console.log('[AppContext] Loading stored data, current version:', APP_VERSION);
      const status = await getEncryptionStatus();
      setEncryptionStatus(status);
      
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      if (storedVersion !== APP_VERSION) {
        await migrateToEncryptedStorage();
        await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
      }
      
      // Basic Hydration
      const [leadsData, intro, health, consent, tos, configs, basic] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LEADS),
        AsyncStorage.getItem(STORAGE_KEYS.INTRO_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.HEALTH_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.PATIENT_CONSENT),
        AsyncStorage.getItem(STORAGE_KEYS.TOS_ACKNOWLEDGMENT),
        AsyncStorage.getItem(STORAGE_KEYS.TREATMENT_CONFIGS),
        AsyncStorage.getItem(STORAGE_KEYS.PATIENT_BASIC_INFO),
      ]);

      if (leadsData) {
        const decryptedLeads = isEncryptedData(leadsData) ? await decryptObject<Lead[]>(leadsData) : JSON.parse(leadsData);
        setLeads(decryptedLeads.map(l => ({ ...l, createdAt: new Date(l.createdAt) })));
      }
      if (intro === 'true') setHasCompletedIntro(true);
      if (health) {
        const decryptedHealth = isEncryptedData(health) ? await decryptObject<PatientHealthProfile>(health) : JSON.parse(health);
        setPatientHealthProfile({ ...decryptedHealth, completedAt: new Date(decryptedHealth.completedAt) });
      }
      if (consent) {
        const decryptedConsent = isEncryptedData(consent) ? await decryptObject<PatientConsent>(consent) : JSON.parse(consent);
        setPatientConsent({ ...decryptedConsent, consentedAt: new Date(decryptedConsent.consentedAt) });
      }
      if (tos) setTosAcknowledgment({ ...JSON.parse(tos), acknowledgedAt: new Date(JSON.parse(tos).acknowledgedAt) });
      if (configs) setTreatmentConfigs(JSON.parse(configs));
      if (basic) setPatientBasicInfo(isEncryptedData(basic) ? await decryptObject<PatientBasicInfo>(basic) : JSON.parse(basic));

      setIsLoadingIntro(false);
    } catch (error) {
      console.log('[AppContext] Error loading data:', error);
      setIsLoadingIntro(false);
    }
  };

  const migrateToEncryptedStorage = async () => {
    const keys = Object.keys(LEGACY_STORAGE_KEYS) as (keyof typeof LEGACY_STORAGE_KEYS)[];
    for (const key of keys) {
      const data = await AsyncStorage.getItem(LEGACY_STORAGE_KEYS[key]);
      if (data && !isEncryptedData(data)) {
        const encrypted = await encryptObject(JSON.parse(data));
        await AsyncStorage.setItem(STORAGE_KEYS[key], encrypted);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
      }
    }
  };

  // --- Clinical & Safety Helpers ---
  const calculateAgeFromDOB = useCallback((dateOfBirth: string) => {
    if (!dateOfBirth) return undefined;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
    return age >= 0 ? age : undefined;
  }, []);

  const getPatientConditions = useCallback(() => {
    const conditions = [...(patientHealthProfile?.conditions || [])];
    const fitz = currentAnalysis?.fitzpatrickAssessment?.type;
    if (fitz === 'V' || fitz === 'VI') conditions.push('fitzpatrick_v_vi');
    else if (fitz === 'IV') conditions.push('fitzpatrick_iv');
    return conditions;
  }, [patientHealthProfile, currentAnalysis]);

  const getTreatmentSafetyStatus = useCallback((treatmentName: string): SafetyStatus => {
    const demographics: PatientDemographics = {
      patientAge: patientBasicInfo?.dateOfBirth ? calculateAgeFromDOB(patientBasicInfo.dateOfBirth) : undefined,
      patientSkinType: currentAnalysis?.fitzpatrickAssessment?.type,
    };
    const result = checkTreatmentSafety(treatmentName, getPatientConditions(), patientHealthProfile?.hasRecentLabWork ?? false, demographics);
    return { ...result, explainableReason: result.isBlocked ? getExplainableReason(treatmentName, result.blockedReasons) : undefined };
  }, [patientBasicInfo, currentAnalysis, getPatientConditions, patientHealthProfile, calculateAgeFromDOB]);

  const applyTreatmentSafetyToAnalysis = useCallback((analysis: AnalysisResult): AnalysisResult => {
    if (!patientHealthProfile) return analysis;
    return {
      ...analysis,
      clinicalRoadmap: analysis.clinicalRoadmap.map(p => ({ ...p, safetyStatus: getTreatmentSafetyStatus(p.name) })),
      peptideTherapy: analysis.peptideTherapy.map(p => ({ ...p, safetyStatus: getTreatmentSafetyStatus(p.name) })),
      ivOptimization: analysis.ivOptimization.map(i => ({ ...i, safetyStatus: getTreatmentSafetyStatus(i.name) })),
    };
  }, [patientHealthProfile, getTreatmentSafetyStatus]);

  // --- Lead Management ---
  const addLead = useCallback(async (name: string, phone: string) => {
    if (!currentAnalysis) return;
    const roadmapValue = (currentAnalysis.clinicalRoadmap || []).reduce((acc, p) => acc + (parseFloat(p.price?.replace(/[^0-9.]/g, '') || '0')), 0);
    
    const newLead: Lead = {
      id: Date.now().toString(),
      name, phone,
      auraScore: currentAnalysis.auraScore,
      faceType: currentAnalysis.faceType,
      estimatedValue: Math.round(roadmapValue + ((currentAnalysis.peptideTherapy?.length || 0) * 350)),
      roadmap: currentAnalysis.clinicalRoadmap,
      peptides: currentAnalysis.peptideTherapy,
      ivDrips: currentAnalysis.ivOptimization,
      status: 'new',
      createdAt: new Date(),
      healthProfile: patientHealthProfile || undefined,
    };

    const updated = [newLead, ...leads];
    setLeads(updated);
    setHasUnlockedResults(true);
    await AsyncStorage.setItem(STORAGE_KEYS.LEADS, await encryptObject(updated));
  }, [currentAnalysis, leads, patientHealthProfile]);

  const deleteLead = useCallback(async (leadId: string) => {
    const updated = leads.filter(l => l.id !== leadId);
    setLeads(updated);
    try {
      const encrypted = await encryptObject(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      console.log('[AppContext] Lead deleted and storage updated');
    } catch (error) {
      console.log('[AppContext] Error deleting lead:', error);
    }
  }, [leads]);

  const authenticateStaff = useCallback(async (passcode: string) => {
    if (passcode === '2026') {
      setIsStaffAuthenticated(true);
      setViewMode('clinic');
      await logAuthEvent('LOGIN_SUCCESS', 'staff');
      return true;
    }
    return false;
  }, []);

  return {
    viewMode, setViewMode,
    isStaffAuthenticated, authenticateStaff,
    logoutStaff: useCallback(() => { setIsStaffAuthenticated(false); setViewMode('client'); }, []),
    leads, addLead, deleteLead,
    currentAnalysis, setCurrentAnalysis,
    capturedImage, setCapturedImage,
    simulatedImage, setSimulatedImage,
    hasUnlockedResults, setHasUnlockedResults,
    hasCompletedIntro, completeIntro: () => setHasCompletedIntro(true),
    isLoadingIntro,
    patientHealthProfile, saveHealthProfile: (p: PatientHealthProfile) => setPatientHealthProfile(p),
    patientBasicInfo, savePatientBasicInfo: (i: PatientBasicInfo) => setPatientBasicInfo(i),
    treatmentConfigs, updateTreatmentConfig: (id: string, up: any) => setTreatmentConfigs(prev => prev.map(c => c.id === id ? {...c, ...up} : c)),
    applyTreatmentSafetyToAnalysis,
    resetScan: () => { setCapturedImage(null); setCurrentAnalysis(null); setHasUnlockedResults(false); },
    clearAllCache: async () => { await AsyncStorage.clear(); setLeads([]); setHasCompletedIntro(false); }
  };
});
