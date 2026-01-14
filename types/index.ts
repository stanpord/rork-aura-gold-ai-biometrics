export interface SkinIQ {
  texture: string;
  pores: string;
  pigment: string;
  redness: string;
}

export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface FitzpatrickAssessment {
  type: FitzpatrickType;
  description: string;
  riskLevel: 'low' | 'caution' | 'high';
  detectedIndicators: string[];
}

export interface SafetyStatus {
  isBlocked: boolean;
  blockedReasons: string[];
  hasCautions: boolean;
  cautionReasons: string[];
  requiresLabWork: boolean;
  requiredLabTests: string[];
  isConditional: boolean;
  conditionalMessage?: string;
  explainableReason?: string;
}

export interface ClinicalProcedure {
  name: string;
  benefit: string;
  price: string;
  clinicalReason: string;
  safetyStatus?: SafetyStatus;
}

export interface PeptideTherapy {
  name: string;
  goal: string;
  mechanism: string;
  frequency: string;
  safetyStatus?: SafetyStatus;
}

export interface IVOptimization {
  name: string;
  benefit: string;
  ingredients: string;
  duration: string;
  safetyStatus?: SafetyStatus;
}

export interface VolumeZoneAnalysis {
  zone: string;
  volumeLoss: number;
  ageRelatedCause: string;
  recommendation: string;
}

export interface AnalysisResult {
  auraScore: number;
  faceType: string;
  skinIQ: SkinIQ;
  fitzpatrickAssessment: FitzpatrickAssessment;
  clinicalRoadmap: ClinicalProcedure[];
  peptideTherapy: PeptideTherapy[];
  ivOptimization: IVOptimization[];
  volumeAssessment: VolumeZoneAnalysis[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  auraScore: number;
  faceType: string;
  estimatedValue: number;
  roadmap: ClinicalProcedure[];
  peptides: PeptideTherapy[];
  ivDrips: IVOptimization[];
  status: 'new' | 'contacted' | 'converted';
  createdAt: Date;
  selectedTreatments?: SelectedTreatment[];
}

export interface TreatmentRecurrence {
  treatmentName: string;
  intervalMonths: number;
  annualSessions: number;
  pricePerSession: number;
  annualRecurringValue: number;
}

export const TREATMENT_RECURRENCE_MAP: Record<string, { intervalMonths: number; description: string }> = {
  // Wrinkle Relaxers
  'Wrinkle Relaxers': { intervalMonths: 3.5, description: 'Every 3-4 months' },
  'Botox': { intervalMonths: 3.5, description: 'Every 3-4 months' },
  'Botox Cosmetic': { intervalMonths: 3.5, description: 'Every 3-4 months' },
  'Baby Botox': { intervalMonths: 3, description: 'Every 3 months' },
  'Lip Flip': { intervalMonths: 3, description: 'Every 3 months' },
  // Fillers
  'Dermal Filler': { intervalMonths: 12, description: 'Every 12-18 months' },
  'Dermal Fillers': { intervalMonths: 12, description: 'Every 12-18 months' },
  'Lip Filler': { intervalMonths: 9, description: 'Every 9-12 months' },
  'Plasma BioFiller': { intervalMonths: 12, description: 'Every 12-18 months' },
  'Sculptra': { intervalMonths: 24, description: 'Every 2 years (after initial series)' },
  'Radiesse': { intervalMonths: 15, description: 'Every 12-18 months' },
  // Beauty & Surface
  'DiamondGlow': { intervalMonths: 1, description: 'Monthly' },
  'Facials': { intervalMonths: 1, description: 'Monthly' },
  'Chemical Peels': { intervalMonths: 1.5, description: 'Every 4-6 weeks' },
  'HydraFacial': { intervalMonths: 1, description: 'Monthly' },
  'Microdermabrasion': { intervalMonths: 1, description: 'Monthly' },
  'Chemical Peel': { intervalMonths: 1.5, description: 'Every 4-6 weeks' },
  'Microneedling': { intervalMonths: 1.5, description: 'Every 4-6 weeks (series of 3-6)' },
  // RF & Tightening
  'RF Microneedling': { intervalMonths: 12, description: 'Annually (after initial series)' },
  'Morpheus8': { intervalMonths: 12, description: 'Annually (after initial series)' },
  // Energy-Based
  'Red Light Therapy': { intervalMonths: 0.25, description: '2-3x per week ongoing' },
  'LED Therapy': { intervalMonths: 0.5, description: 'Weekly-Biweekly' },
  'Stellar IPL': { intervalMonths: 4, description: 'Every 4-6 months maintenance' },
  'IPL': { intervalMonths: 4, description: 'Every 4-6 months maintenance' },
  'Clear + Brilliant': { intervalMonths: 2, description: 'Every 6-8 weeks' },
  'MOXI Laser': { intervalMonths: 3, description: 'Every 3 months' },
  'ResurFX': { intervalMonths: 2, description: 'Every 4-8 weeks (series of 3-5)' },
  // Lifting
  'PDO Thread Lift': { intervalMonths: 18, description: 'Every 12-18 months' },
  'PDO Threads': { intervalMonths: 18, description: 'Every 12-18 months' },
  'Endolift': { intervalMonths: 24, description: 'Every 2-3 years' },
  'Kybella': { intervalMonths: 0, description: 'Permanent results (2-4 sessions total)' },
  'Exosome Therapy': { intervalMonths: 3, description: 'Every 3 months for maintenance' },
  // Anti-Aging
  'Anti-Aging Treatments': { intervalMonths: 1, description: 'Varies by treatment' },
  'Glow Drip': { intervalMonths: 1, description: 'Monthly' },
  'NAD+ Infusion': { intervalMonths: 0.5, description: 'Every 2 weeks initially, then monthly' },
  'Myers Cocktail': { intervalMonths: 0.5, description: 'Every 1-2 weeks' },
  'Glutathione Push': { intervalMonths: 0.5, description: 'Weekly-Biweekly' },
  'Vitamin C Drip': { intervalMonths: 0.5, description: 'Every 1-2 weeks' },
  'GHK-Cu': { intervalMonths: 3, description: 'Continuous or 3-month cycles' },
  'BPC-157': { intervalMonths: 2, description: '6-8 week cycles' },
  'Epithalon': { intervalMonths: 6, description: 'Every 6 months' },
  'TB-500': { intervalMonths: 2, description: '6-8 week cycles' },
  'Thymosin Alpha-1': { intervalMonths: 3, description: 'Ongoing or cycled' },
};

export interface PatientHealthProfile {
  conditions: string[];
  hasRecentLabWork: boolean;
  labWorkDate?: string;
  completedAt: Date;
}

export type ViewMode = 'client' | 'clinic';

export interface TreatmentDosingSettings {
  depth?: string;
  energy?: string;
  passes?: string;
  units?: string;
  volume?: string;
  dilution?: string;
  injectionSites?: string;
  customNotes?: string;
}

export interface SelectedTreatment {
  treatment: ClinicalProcedure | PeptideTherapy | IVOptimization;
  treatmentType: 'procedure' | 'peptide' | 'iv';
  dosing: TreatmentDosingSettings;
  selectedAt: Date;
  selectedBy?: string;
  complianceSignOff?: ComplianceSignOff;
}

export interface ComplianceSignOff {
  acknowledged: boolean;
  practitionerSignature: string;
  signedAt: Date;
  timestamp: string;
}

export interface TransparencyData {
  clinicalCriteria: string;
  dataSource: string;
  safetyInterlocks: SafetyInterlock[];
  guidelinesReference?: string;
}

export interface SafetyInterlock {
  type: 'cleared' | 'warning' | 'blocked';
  label: string;
  detected: boolean;
}

export interface PatientConsent {
  patientName: string;
  patientSignature: string;
  providerSignature: string;
  consentedAt: Date;
  timestamp: string;
  acknowledgedSections: {
    aiDisclosure: boolean;
    aiRole: boolean;
    dataPrivacy: boolean;
    risksLimitations: boolean;
    humanOnlyRight: boolean;
  };
  optedOutOfAI: boolean;
}

export interface TermsOfServiceAcknowledgment {
  acknowledgedAt: Date;
  timestamp: string;
  acknowledgedSections: {
    humanInTheLoop: boolean;
    regulatoryDisclosures: boolean;
    recommendationLimitations: boolean;
    dataPrivacy: boolean;
  };
  practitionerSignature: string;
  practitionerCredentials: string;
  clinicName?: string;
  stateJurisdiction: string;
}

export interface TreatmentPriceConfig {
  treatmentName: string;
  enabled: boolean;
  customPrice: string;
  defaultPrice: string;
  category: 'procedure' | 'peptide' | 'iv';
}

export interface ClinicSettings {
  treatmentConfigs: TreatmentPriceConfig[];
  clinicName: string;
  onboardingComplete: boolean;
  updatedAt: Date;
}
