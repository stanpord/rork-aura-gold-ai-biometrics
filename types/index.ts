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

export interface SignatureRecord {
  type: 'patient_consent' | 'treatment_signoff';
  patientSignature?: string;
  practitionerSignature: string;
  treatmentName?: string;
  signedAt: Date;
  timestamp: string;
}

export interface ScanRecord {
  id: string;
  scanDate: Date;
  auraScore: number;
  faceType: string;
  skinIQ?: SkinIQ;
  volumeAssessment?: VolumeZoneAnalysis[];
  fitzpatrickAssessment?: FitzpatrickAssessment;
  roadmap: ClinicalProcedure[];
  peptides: PeptideTherapy[];
  ivDrips: IVOptimization[];
  capturedImage?: string;
  notes?: string;
}

export interface ScanComparison {
  metric: string;
  previousValue: string | number;
  currentValue: string | number;
  change: 'improved' | 'declined' | 'stable';
  changeAmount?: number;
}

export interface BiometricProfile {
  faceEmbedding?: string;
  capturedAt: Date;
  deviceInfo?: string;
  verificationLevel: 'basic' | 'verified' | 'enhanced';
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  auraScore: number;
  faceType: string;
  estimatedValue: number;
  roadmap: ClinicalProcedure[];
  peptides: PeptideTherapy[];
  ivDrips: IVOptimization[];
  skinIQ?: SkinIQ;
  volumeAssessment?: VolumeZoneAnalysis[];
  fitzpatrickAssessment?: FitzpatrickAssessment;
  status: 'new' | 'contacted' | 'converted';
  createdAt: Date;
  selectedTreatments?: SelectedTreatment[];
  patientConsent?: PatientConsent;
  signatureLog?: SignatureRecord[];
  scanHistory?: ScanRecord[];
  lastScanDate?: Date;
  biometricProfile?: BiometricProfile;
  lastCheckIn?: Date;
  profileImage?: string;
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

export interface PatientBasicInfo {
  name: string;
  phone: string;
  email?: string;
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

export interface TreatmentConfig {
  id: string;
  name: string;
  category: 'procedure' | 'peptide' | 'iv';
  enabled: boolean;
  customPrice?: string;
  defaultPrice: string;
}

export const DEFAULT_TREATMENT_CONFIGS: Omit<TreatmentConfig, 'enabled' | 'customPrice'>[] = [
  { id: 'morpheus8', name: 'Morpheus8', category: 'procedure', defaultPrice: '$800-1,200' },
  { id: 'botox', name: 'Botox Cosmetic', category: 'procedure', defaultPrice: '$12-15/unit' },
  { id: 'baby_botox', name: 'Baby Botox', category: 'procedure', defaultPrice: '$200-400' },
  { id: 'lip_flip', name: 'Lip Flip', category: 'procedure', defaultPrice: '$150-200' },
  { id: 'wrinkle_relaxers', name: 'Wrinkle Relaxers', category: 'procedure', defaultPrice: '$10-15/unit' },
  { id: 'dermal_filler', name: 'Dermal Filler', category: 'procedure', defaultPrice: '$650-900/syringe' },
  { id: 'lip_filler', name: 'Lip Filler', category: 'procedure', defaultPrice: '$500-800' },
  { id: 'plasma_biofiller', name: 'Plasma BioFiller', category: 'procedure', defaultPrice: '$900-1,500' },
  { id: 'sculptra', name: 'Sculptra', category: 'procedure', defaultPrice: '$900-1,200/vial' },
  { id: 'radiesse', name: 'Radiesse', category: 'procedure', defaultPrice: '$700-1,000/syringe' },
  { id: 'stellar_ipl', name: 'Stellar IPL', category: 'procedure', defaultPrice: '$300-500' },
  { id: 'resurfx', name: 'ResurFX', category: 'procedure', defaultPrice: '$500-800' },
  { id: 'rf_microneedling', name: 'RF Microneedling', category: 'procedure', defaultPrice: '$600-1,000' },
  { id: 'endolift', name: 'Endolift', category: 'procedure', defaultPrice: '$2,000-4,000' },
  { id: 'pdo_threads', name: 'PDO Thread Lift', category: 'procedure', defaultPrice: '$1,500-3,000' },
  { id: 'kybella', name: 'Kybella', category: 'procedure', defaultPrice: '$600-1,200' },
  { id: 'diamondglow', name: 'DiamondGlow', category: 'procedure', defaultPrice: '$150-250' },
  { id: 'hydrafacial', name: 'HydraFacial', category: 'procedure', defaultPrice: '$150-300' },
  { id: 'facials', name: 'Facials', category: 'procedure', defaultPrice: '$100-200' },
  { id: 'chemical_peels', name: 'Chemical Peels', category: 'procedure', defaultPrice: '$150-400' },
  { id: 'microneedling', name: 'Microneedling', category: 'procedure', defaultPrice: '$300-500' },
  { id: 'microdermabrasion', name: 'Microdermabrasion', category: 'procedure', defaultPrice: '$100-200' },
  { id: 'clear_brilliant', name: 'Clear + Brilliant', category: 'procedure', defaultPrice: '$400-600' },
  { id: 'moxi_laser', name: 'MOXI Laser', category: 'procedure', defaultPrice: '$500-800' },
  { id: 'red_light_therapy', name: 'Red Light Therapy', category: 'procedure', defaultPrice: '$50-100' },
  { id: 'led_therapy', name: 'LED Therapy', category: 'procedure', defaultPrice: '$50-100' },
  { id: 'exosome_therapy', name: 'Exosome Therapy', category: 'procedure', defaultPrice: '$500-1,000' },
  { id: 'anti_aging', name: 'Anti-Aging Treatments', category: 'procedure', defaultPrice: '$200-500' },
  { id: 'bpc157', name: 'BPC-157', category: 'peptide', defaultPrice: '$300-500/month' },
  { id: 'ghkcu', name: 'GHK-Cu', category: 'peptide', defaultPrice: '$250-400/month' },
  { id: 'epithalon', name: 'Epithalon', category: 'peptide', defaultPrice: '$400-600/cycle' },
  { id: 'tb500', name: 'TB-500', category: 'peptide', defaultPrice: '$300-500/month' },
  { id: 'thymosin_alpha1', name: 'Thymosin Alpha-1', category: 'peptide', defaultPrice: '$350-550/month' },
  { id: 'ipamorelin', name: 'Ipamorelin', category: 'peptide', defaultPrice: '$400-600/month' },
  { id: 'glow_drip', name: 'Glow Drip', category: 'iv', defaultPrice: '$200-350' },
  { id: 'nad_infusion', name: 'NAD+ Infusion', category: 'iv', defaultPrice: '$400-800' },
  { id: 'myers_cocktail', name: 'Myers Cocktail', category: 'iv', defaultPrice: '$150-275' },
  { id: 'glutathione_push', name: 'Glutathione Push', category: 'iv', defaultPrice: '$50-100' },
  { id: 'vitamin_c_drip', name: 'Vitamin C Drip', category: 'iv', defaultPrice: '$150-250' },
];
