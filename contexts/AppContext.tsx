import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { AnalysisResult, Lead, ViewMode, PatientHealthProfile, PatientConsent, TermsOfServiceAcknowledgment, SelectedTreatment, TreatmentConfig, DEFAULT_TREATMENT_CONFIGS, PatientBasicInfo, ClinicalProcedure, SignatureRecord, ScanRecord, BiometricProfile, SafetyStatus } from '@/types';
import { encryptObject, decryptObject, isEncryptedData, getEncryptionStatus, EncryptionStatus } from '@/utils/encryption';
import { checkTreatmentSafety, getExplainableReason, PatientDemographics, SafetyCheckResult } from '@/constants/contraindications';
import { initializeAuditLog, logAuditEvent, logAuthEvent, logPHIAccess, logConsentEvent, getAuditSummary } from '@/utils/auditLog';

const APP_VERSION = '1.0.7';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaffAuthenticated]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isStaffAuthenticated
      ) {
        const now = Date.now();
        const timeSinceActivity = now - lastActivityRef.current;
        if (timeSinceActivity >= SESSION_TIMEOUT_MS) {
          handleSessionTimeout();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaffAuthenticated]);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showSessionWarning) {
      setShowSessionWarning(false);
    }
  }, [showSessionWarning]);

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

  const extendSession = useCallback(() => {
    recordActivity();
    console.log('[HIPAA] Session extended by user action');
  }, [recordActivity]);

  const loadStoredData = async () => {
    const startTime = Date.now();
    const MIN_LOADING_TIME_MS = 3500;
    
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
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME_MS - elapsed);
      console.log('[AppContext] Data loaded, waiting', remainingTime, 'ms for biomarker animation');
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setIsLoadingIntro(false);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME_MS - elapsed);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
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

  const authenticateStaff = useCallback(async (passcode: string): Promise<boolean> => {
    if (passcode === '2026') {
      setIsStaffAuthenticated(true);
      setViewMode('clinic');
      lastActivityRef.current = Date.now();
      await logAuthEvent('LOGIN_SUCCESS', 'staff');
      console.log('[HIPAA] Staff login successful');
      return true;
    }
    await logAuthEvent('LOGIN_FAILURE', 'staff', { reason: 'Invalid passcode' });
    console.log('[HIPAA] Staff login failed - invalid passcode');
    return false;
  }, []);

  const logoutStaff = useCallback(async () => {
    await logAuthEvent('LOGOUT', 'staff');
    console.log('[HIPAA] Staff logout');
    setIsStaffAuthenticated(false);
    setViewMode('client');
    setSessionTimeRemaining(null);
    setShowSessionWarning(false);
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
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
      await logConsentEvent(
        consent.optedOutOfAI ? 'signed' : 'signed',
        undefined,
        consent.optedOutOfAI ? 'Opted out of AI' : 'AI-assisted treatment'
      );
      console.log('[HIPAA] Patient consent encrypted and saved with audit trail');
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

  const calculateAgeFromDOB = useCallback((dateOfBirth: string): number | undefined => {
    if (!dateOfBirth) return undefined;
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age >= 0 ? age : undefined;
    } catch {
      console.log('[AppContext] Invalid date of birth format');
      return undefined;
    }
  }, []);

  const getPatientDemographics = useCallback((): PatientDemographics => {
    const demographics: PatientDemographics = {};
    
    if (patientBasicInfo?.dateOfBirth) {
      demographics.patientAge = calculateAgeFromDOB(patientBasicInfo.dateOfBirth);
    }
    
    const fitzpatrick = currentAnalysis?.fitzpatrickAssessment?.type;
    if (fitzpatrick) {
      demographics.patientSkinType = fitzpatrick;
    }
    
    console.log('[AppContext] Patient demographics:', demographics);
    return demographics;
  }, [patientBasicInfo, currentAnalysis, calculateAgeFromDOB]);

  const getPatientConditions = useCallback((): string[] => {
    const conditions: string[] = [];
    
    if (patientHealthProfile?.conditions) {
      conditions.push(...patientHealthProfile.conditions);
    }
    
    const fitzpatrick = currentAnalysis?.fitzpatrickAssessment?.type;
    if (fitzpatrick === 'V' || fitzpatrick === 'VI') {
      if (!conditions.includes('fitzpatrick_v_vi')) {
        conditions.push('fitzpatrick_v_vi');
      }
    } else if (fitzpatrick === 'IV') {
      if (!conditions.includes('fitzpatrick_iv')) {
        conditions.push('fitzpatrick_iv');
      }
    }
    
    console.log('[AppContext] Patient conditions:', conditions.length, 'conditions');
    return conditions;
  }, [patientHealthProfile, currentAnalysis]);

  const checkTreatmentSafetyForPatient = useCallback((treatmentName: string): SafetyCheckResult => {
    const conditions = getPatientConditions();
    const demographics = getPatientDemographics();
    const hasLabWork = patientHealthProfile?.hasRecentLabWork ?? false;
    
    const result = checkTreatmentSafety(treatmentName, conditions, hasLabWork, demographics);
    
    if (result.isBlocked || result.hasCautions) {
      console.log('[AppContext] Safety check for', treatmentName, ':', {
        isBlocked: result.isBlocked,
        blockedReasons: result.blockedReasons,
        hasCautions: result.hasCautions,
        cautionReasons: result.cautionReasons,
      });
    }
    
    return result;
  }, [getPatientConditions, getPatientDemographics, patientHealthProfile]);

  const getTreatmentSafetyStatus = useCallback((treatmentName: string): SafetyStatus => {
    const result = checkTreatmentSafetyForPatient(treatmentName);
    
    let explainableReason: string | undefined;
    if (result.isBlocked) {
      explainableReason = getExplainableReason(treatmentName, result.blockedReasons);
    }
    
    return {
      isBlocked: result.isBlocked,
      blockedReasons: result.blockedReasons,
      hasCautions: result.hasCautions,
      cautionReasons: result.cautionReasons,
      requiresLabWork: result.requiresLabWork,
      requiredLabTests: result.requiredLabTests,
      isConditional: result.isConditional,
      conditionalMessage: result.conditionalMessage,
      explainableReason,
    };
  }, [checkTreatmentSafetyForPatient]);

  const applyTreatmentSafetyToAnalysis = useCallback((analysis: AnalysisResult): AnalysisResult => {
    if (!patientHealthProfile) {
      console.log('[AppContext] No health profile - skipping safety application');
      return analysis;
    }
    
    console.log('[AppContext] Applying treatment safety checks to analysis');
    
    const updatedRoadmap = analysis.clinicalRoadmap.map(proc => ({
      ...proc,
      safetyStatus: getTreatmentSafetyStatus(proc.name),
    }));
    
    const updatedPeptides = analysis.peptideTherapy.map(peptide => ({
      ...peptide,
      safetyStatus: getTreatmentSafetyStatus(peptide.name),
    }));
    
    const updatedIV = analysis.ivOptimization.map(iv => ({
      ...iv,
      safetyStatus: getTreatmentSafetyStatus(iv.name),
    }));
    
    const blockedCount = [
      ...updatedRoadmap.filter(t => t.safetyStatus?.isBlocked),
      ...updatedPeptides.filter(t => t.safetyStatus?.isBlocked),
      ...updatedIV.filter(t => t.safetyStatus?.isBlocked),
    ].length;
    
    const cautionCount = [
      ...updatedRoadmap.filter(t => t.safetyStatus?.hasCautions && !t.safetyStatus?.isBlocked),
      ...updatedPeptides.filter(t => t.safetyStatus?.hasCautions && !t.safetyStatus?.isBlocked),
      ...updatedIV.filter(t => t.safetyStatus?.hasCautions && !t.safetyStatus?.isBlocked),
    ].length;
    
    console.log('[AppContext] Safety results:', { blockedCount, cautionCount });
    
    return {
      ...analysis,
      clinicalRoadmap: updatedRoadmap,
      peptideTherapy: updatedPeptides,
      ivOptimization: updatedIV,
    };
  }, [patientHealthProfile, getTreatmentSafetyStatus]);

  const hasCompletedHealthScreening = useCallback((): boolean => {
    return patientHealthProfile !== null;
  }, [patientHealthProfile]);

  const getHealthScreeningSummary = useCallback((): { 
    hasScreening: boolean;
    conditionCount: number;
    hasLabWork: boolean;
    hasCriticalConditions: boolean;
  } => {
    if (!patientHealthProfile) {
      return { hasScreening: false, conditionCount: 0, hasLabWork: false, hasCriticalConditions: false };
    }
    
    const conditions = patientHealthProfile.conditions || [];
    const criticalConditions = conditions.filter(c => 
      ['pregnancy', 'pacemaker', 'active_malignancy', 'active_skin_cancer', 'bleeding_disorder'].includes(c)
    );
    
    return {
      hasScreening: true,
      conditionCount: conditions.length,
      hasLabWork: patientHealthProfile.hasRecentLabWork,
      hasCriticalConditions: criticalConditions.length > 0,
    };
  }, [patientHealthProfile]);

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
      healthProfile: patientHealthProfile || undefined,
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
  }, [currentAnalysis, leads, patientHealthProfile]);

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
    const lead = leads.find(lead => lead.id === leadId);
    if (lead && isStaffAuthenticated) {
      logPHIAccess('View patient record', 'lead', leadId, 'staff');
      recordActivity();
    }
    return lead;
  }, [leads, isStaffAuthenticated, recordActivity]);

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
      await logAuditEvent('PHI_UPDATE', 'Patient consent attached to record', {
        userRole: 'staff',
        resourceType: 'lead',
        resourceId: leadId,
        phiAccessed: true,
      });
      console.log('[HIPAA] Patient consent encrypted and attached to lead with audit trail');
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

  const findPatientByPhone = useCallback((phone: string): Lead | undefined => {
    const normalizedPhone = phone.replace(/\D/g, '');
    return leads.find(lead => lead.phone.replace(/\D/g, '') === normalizedPhone);
  }, [leads]);

  const addScanToExistingPatient = useCallback(async (leadId: string, newScanData: Omit<ScanRecord, 'id' | 'scanDate'>): Promise<void> => {
    const newScan: ScanRecord = {
      ...newScanData,
      id: Date.now().toString(),
      scanDate: new Date(),
    };

    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        const previousScan: ScanRecord = {
          id: `prev_${lead.createdAt.getTime()}`,
          scanDate: lead.lastScanDate || lead.createdAt,
          auraScore: lead.auraScore,
          faceType: lead.faceType,
          skinIQ: lead.skinIQ,
          volumeAssessment: lead.volumeAssessment,
          fitzpatrickAssessment: lead.fitzpatrickAssessment,
          roadmap: lead.roadmap,
          peptides: lead.peptides,
          ivDrips: lead.ivDrips,
        };

        const existingHistory = lead.scanHistory || [];
        const hasCurrentInHistory = existingHistory.some(s => s.auraScore === lead.auraScore && s.faceType === lead.faceType);
        
        const updatedHistory = hasCurrentInHistory 
          ? [...existingHistory, newScan]
          : [...existingHistory, previousScan, newScan];

        return {
          ...lead,
          auraScore: newScan.auraScore,
          faceType: newScan.faceType,
          skinIQ: newScan.skinIQ,
          volumeAssessment: newScan.volumeAssessment,
          fitzpatrickAssessment: newScan.fitzpatrickAssessment,
          roadmap: newScan.roadmap,
          peptides: newScan.peptides,
          ivDrips: newScan.ivDrips,
          scanHistory: updatedHistory,
          lastScanDate: new Date(),
        };
      }
      return lead;
    });

    setLeads(updatedLeads);
    try {
      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      console.log('[AppContext] New scan added to patient:', leadId);
    } catch (error) {
      console.log('[AppContext] Error adding scan to patient:', error);
    }
  }, [leads]);

  const getPatientScanHistory = useCallback((leadId: string): ScanRecord[] => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return [];
    
    if (lead.scanHistory && lead.scanHistory.length > 0) {
      return lead.scanHistory.sort((a, b) => 
        new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime()
      );
    }
    
    return [{
      id: `initial_${lead.id}`,
      scanDate: lead.createdAt,
      auraScore: lead.auraScore,
      faceType: lead.faceType,
      skinIQ: lead.skinIQ,
      volumeAssessment: lead.volumeAssessment,
      fitzpatrickAssessment: lead.fitzpatrickAssessment,
      roadmap: lead.roadmap,
      peptides: lead.peptides,
      ivDrips: lead.ivDrips,
    }];
  }, [leads]);

  const checkInPatient = useCallback(async (leadId: string, profileImage?: string): Promise<void> => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          lastCheckIn: new Date(),
          profileImage: profileImage || lead.profileImage,
        };
      }
      return lead;
    });
    setLeads(updatedLeads);
    try {
      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      await logAuditEvent('PHI_ACCESS', 'Patient check-in via biometric verification', {
        userRole: 'staff',
        resourceType: 'lead',
        resourceId: leadId,
        phiAccessed: true,
      });
      console.log('[HIPAA] Patient checked in:', leadId);
    } catch (error) {
      console.log('[AppContext] Error checking in patient:', error);
    }
  }, [leads]);

  const createPatientWithBiometrics = useCallback(async (
    name: string,
    phone: string,
    email: string | undefined,
    biometricProfile: BiometricProfile,
    profileImage?: string
  ): Promise<Lead | null> => {
    try {
      const newLead: Lead = {
        id: Date.now().toString(),
        name,
        phone,
        email,
        auraScore: 0,
        faceType: 'Pending Analysis',
        estimatedValue: 0,
        roadmap: [],
        peptides: [],
        ivDrips: [],
        status: 'new',
        createdAt: new Date(),
        biometricProfile,
        profileImage,
        lastCheckIn: new Date(),
      };

      const updatedLeads = [newLead, ...leads];
      setLeads(updatedLeads);

      const encrypted = await encryptObject(updatedLeads);
      await AsyncStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
      await logAuditEvent('PHI_CREATE', 'New patient created with biometric verification', {
        userRole: 'staff',
        resourceType: 'lead',
        resourceId: newLead.id,
        phiAccessed: true,
      });
      console.log('[HIPAA] New patient created with biometrics:', newLead.id);
      return newLead;
    } catch (error) {
      console.log('[AppContext] Error creating patient with biometrics:', error);
      return null;
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
    setCurrentAnalysis: useCallback((analysis: AnalysisResult | null) => {
      if (analysis && patientHealthProfile) {
        const safeAnalysis = applyTreatmentSafetyToAnalysis(analysis);
        setCurrentAnalysis(safeAnalysis);
      } else {
        setCurrentAnalysis(analysis);
      }
    }, [patientHealthProfile, applyTreatmentSafetyToAnalysis]),
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
    findPatientByPhone,
    addScanToExistingPatient,
    getPatientScanHistory,
    checkInPatient,
    createPatientWithBiometrics,
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
    sessionTimeRemaining,
    showSessionWarning,
    extendSession,
    recordActivity,
    getAuditSummary,
    checkTreatmentSafetyForPatient,
    getTreatmentSafetyStatus,
    applyTreatmentSafetyToAnalysis,
    getPatientConditions,
    getPatientDemographics,
    hasCompletedHealthScreening,
    getHealthScreeningSummary,
  };
});
