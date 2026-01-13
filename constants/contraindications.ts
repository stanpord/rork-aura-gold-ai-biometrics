export interface ContraindicationRule {
  treatment: string;
  absoluteRedFlags: string[];
  cautionFlags: string[];
  requiresLabWork?: boolean;
  labWorkType?: string[];
}

export interface TreatmentInteractionRule {
  treatment: string;
  incompatibleWith: string[];
  waitPeriodDays: number;
  warningMessage: string;
}

export interface TreatmentRecommendationRule {
  triggerTreatment: string;
  recommendTreatment: string;
  reason: string;
  isPostCare: boolean;
}

export const CONTRAINDICATION_MATRIX: ContraindicationRule[] = [
  {
    treatment: 'Morpheus8',
    absoluteRedFlags: [
      'pacemaker',
      'internal_defibrillator',
      'active_skin_cancer',
      'pregnancy',
      'keloid_history',
    ],
    cautionFlags: [
      'recent_tan',
      'accutane_6months',
      'metal_implants_face',
    ],
  },
  {
    treatment: 'Botox Cosmetic',
    absoluteRedFlags: [
      'myasthenia_gravis',
      'als',
      'eaton_lambert',
      'infection_injection_site',
      'pregnancy',
    ],
    cautionFlags: [
      'recent_facial_surgery',
      'aminoglycoside_antibiotics',
      'blood_thinners',
    ],
  },
  {
    treatment: 'HydraFacial',
    absoluteRedFlags: [
      'shellfish_allergy',
      'accutane_12months',
      'severe_active_acne',
    ],
    cautionFlags: [
      'retinol_48h',
      'recent_botox_fillers_14days',
      'sunburn',
    ],
  },
  {
    treatment: 'Dermal Fillers',
    absoluteRedFlags: [
      'active_skin_infection',
      'pregnancy',
      'autoimmune_disease_active',
      'bleeding_disorder',
    ],
    cautionFlags: [
      'blood_thinners',
      'recent_dental_work',
      'cold_sores_history',
    ],
  },
  {
    treatment: 'IPL',
    absoluteRedFlags: [
      'pregnancy',
      'active_skin_cancer',
      'photosensitivity_disorder',
      'seizure_disorder_light_triggered',
      'fitzpatrick_v_vi',
    ],
    cautionFlags: [
      'recent_tan',
      'accutane_6months',
      'melasma',
      'fitzpatrick_iv',
    ],
  },
  {
    treatment: 'Red Light Therapy',
    absoluteRedFlags: [
      'active_skin_cancer',
      'photosensitivity_disorder',
      'seizure_disorder_light_triggered',
    ],
    cautionFlags: [
      'retinol_48h',
      'pregnancy',
    ],
  },
  {
    treatment: 'LED Therapy',
    absoluteRedFlags: [
      'active_skin_cancer',
      'photosensitivity_disorder',
      'seizure_disorder_light_triggered',
    ],
    cautionFlags: [
      'retinol_48h',
      'pregnancy',
    ],
  },
  {
    treatment: 'Clear + Brilliant',
    absoluteRedFlags: [
      'pregnancy',
      'active_skin_infection',
      'accutane_6months',
      'keloid_history',
    ],
    cautionFlags: [
      'recent_tan',
      'upcoming_event_3days',
      'retinol_48h',
      'melasma',
    ],
  },
  {
    treatment: 'MOXI Laser',
    absoluteRedFlags: [
      'pregnancy',
      'active_skin_infection',
      'accutane_6months',
      'keloid_history',
    ],
    cautionFlags: [
      'recent_tan',
      'upcoming_event_3days',
      'retinol_48h',
      'fitzpatrick_v_vi',
    ],
  },
  {
    treatment: 'Chemical Peel',
    absoluteRedFlags: [
      'pregnancy',
      'active_herpes_outbreak',
      'open_wounds',
      'accutane_12months',
    ],
    cautionFlags: [
      'retinol_48h',
      'recent_waxing',
      'eczema_psoriasis',
    ],
  },
  {
    treatment: 'Microneedling',
    absoluteRedFlags: [
      'active_skin_infection',
      'keloid_history',
      'blood_clotting_disorder',
      'accutane_6months',
    ],
    cautionFlags: [
      'blood_thinners',
      'active_acne',
      'eczema_psoriasis',
    ],
  },
  {
    treatment: 'Microdermabrasion',
    absoluteRedFlags: [
      'active_cystic_acne',
      'thin_fragile_skin',
      'rosacea_active',
      'active_skin_infection',
      'eczema_psoriasis',
    ],
    cautionFlags: [
      'active_acne',
      'recent_tan',
      'retinol_48h',
      'blood_thinners',
    ],
  },
  {
    treatment: 'Dermaplaning',
    absoluteRedFlags: [
      'active_cystic_acne',
      'active_skin_infection',
      'blood_clotting_disorder',
    ],
    cautionFlags: [
      'active_acne',
      'recent_deep_peel',
      'eczema_psoriasis',
      'retinol_48h',
    ],
  },
  {
    treatment: 'PDO Threads',
    absoluteRedFlags: [
      'autoimmune_disease_active',
      'active_infection',
      'pregnancy',
      'blood_clotting_disorder',
      'keloid_history',
      'active_dental_infection',
    ],
    cautionFlags: [
      'blood_thinners',
      'recent_facial_surgery',
      'diabetes_uncontrolled',
    ],
  },
  {
    treatment: 'Radiesse',
    absoluteRedFlags: [
      'allergy_to_calcium_hydroxylapatite',
      'active_skin_infection',
      'keloid_history',
      'autoimmune_disease_active',
      'pregnancy',
    ],
    cautionFlags: [
      'blood_thinners',
      'immunosuppressed',
      'recent_filler_4weeks',
      'recent_rf_treatment',
    ],
    requiresLabWork: false,
  },
  {
    treatment: 'Exosome Therapy',
    absoluteRedFlags: [
      'active_malignancy',
      'active_skin_infection',
      'immunosuppressed_severe',
    ],
    cautionFlags: [
      'autoimmune_disease',
      'pregnancy',
      'immunosuppressed',
    ],
    requiresLabWork: false,
  },
  {
    treatment: 'Baby Botox',
    absoluteRedFlags: [
      'myasthenia_gravis',
      'als',
      'eaton_lambert',
      'infection_injection_site',
      'pregnancy',
    ],
    cautionFlags: [
      'recent_facial_surgery',
      'aminoglycoside_antibiotics',
      'blood_thinners',
    ],
  },
  {
    treatment: 'Lip Flip',
    absoluteRedFlags: [
      'myasthenia_gravis',
      'als',
      'eaton_lambert',
      'infection_injection_site',
      'pregnancy',
    ],
    cautionFlags: [
      'cold_sores_history',
      'recent_facial_surgery',
      'blood_thinners',
    ],
  },
  {
    treatment: 'Kybella',
    absoluteRedFlags: [
      'infection_treatment_area',
      'pregnancy',
      'difficulty_swallowing',
      'bleeding_disorder',
    ],
    cautionFlags: [
      'prior_neck_surgery',
      'blood_thinners',
      'enlarged_thyroid',
    ],
  },
  {
    treatment: 'Sculptra',
    absoluteRedFlags: [
      'allergy_to_plla',
      'active_skin_infection',
      'keloid_history',
      'autoimmune_disease_active',
    ],
    cautionFlags: [
      'blood_thinners',
      'immunosuppressed',
      'recent_filler_4weeks',
      'recent_rf_treatment',
    ],
  },
  {
    treatment: 'Wrinkle Relaxers',
    absoluteRedFlags: [
      'myasthenia_gravis',
      'als',
      'eaton_lambert',
      'infection_injection_site',
      'pregnancy',
    ],
    cautionFlags: [
      'recent_facial_surgery',
      'aminoglycoside_antibiotics',
      'blood_thinners',
    ],
  },
  {
    treatment: 'Botox',
    absoluteRedFlags: [
      'myasthenia_gravis',
      'als',
      'eaton_lambert',
      'infection_injection_site',
      'pregnancy',
    ],
    cautionFlags: [
      'recent_facial_surgery',
      'aminoglycoside_antibiotics',
      'blood_thinners',
    ],
  },
  {
    treatment: 'Dermal Filler',
    absoluteRedFlags: [
      'active_skin_infection',
      'pregnancy',
      'autoimmune_disease_active',
      'bleeding_disorder',
    ],
    cautionFlags: [
      'blood_thinners',
      'recent_dental_work',
      'cold_sores_history',
    ],
  },
  {
    treatment: 'Lip Filler',
    absoluteRedFlags: [
      'active_skin_infection',
      'pregnancy',
      'autoimmune_disease_active',
      'bleeding_disorder',
      'active_herpes_outbreak',
    ],
    cautionFlags: [
      'blood_thinners',
      'cold_sores_history',
      'recent_dental_work',
    ],
  },
  {
    treatment: 'Plasma BioFiller',
    absoluteRedFlags: [
      'active_skin_infection',
      'pregnancy',
      'bleeding_disorder',
      'blood_clotting_disorder',
      'active_malignancy',
      'platelet_dysfunction',
    ],
    cautionFlags: [
      'blood_thinners',
      'nsaid_use_recent',
      'anemia',
      'autoimmune_disease',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'Platelet Count'],
  },
  {
    treatment: 'Stellar IPL',
    absoluteRedFlags: [
      'pregnancy',
      'active_skin_cancer',
      'photosensitivity_disorder',
      'seizure_disorder_light_triggered',
      'fitzpatrick_v_vi',
    ],
    cautionFlags: [
      'recent_tan',
      'accutane_6months',
      'melasma',
      'fitzpatrick_iv',
      'retinol_48h',
    ],
  },
  {
    treatment: 'ResurFX',
    absoluteRedFlags: [
      'pregnancy',
      'active_skin_infection',
      'accutane_6months',
      'keloid_history',
      'active_herpes_outbreak',
    ],
    cautionFlags: [
      'recent_tan',
      'fitzpatrick_iv',
      'fitzpatrick_v_vi',
      'retinol_48h',
      'eczema_psoriasis',
    ],
  },
  {
    treatment: 'RF Microneedling',
    absoluteRedFlags: [
      'pacemaker',
      'internal_defibrillator',
      'active_skin_infection',
      'keloid_history',
      'blood_clotting_disorder',
      'accutane_6months',
      'pregnancy',
    ],
    cautionFlags: [
      'blood_thinners',
      'active_acne',
      'eczema_psoriasis',
      'metal_implants_face',
    ],
  },
  {
    treatment: 'Endolift',
    absoluteRedFlags: [
      'pregnancy',
      'active_skin_infection',
      'bleeding_disorder',
      'autoimmune_disease_active',
      'pacemaker',
      'internal_defibrillator',
    ],
    cautionFlags: [
      'blood_thinners',
      'recent_facial_surgery',
      'diabetes_uncontrolled',
      'immunosuppressed',
    ],
  },
  {
    treatment: 'PDO Thread Lift',
    absoluteRedFlags: [
      'autoimmune_disease_active',
      'active_infection',
      'pregnancy',
      'blood_clotting_disorder',
      'keloid_history',
      'active_dental_infection',
    ],
    cautionFlags: [
      'blood_thinners',
      'recent_facial_surgery',
      'diabetes_uncontrolled',
    ],
  },
  {
    treatment: 'DiamondGlow',
    absoluteRedFlags: [
      'active_skin_infection',
      'active_herpes_outbreak',
      'open_wounds',
    ],
    cautionFlags: [
      'retinol_48h',
      'recent_botox_fillers_14days',
      'sunburn',
      'rosacea_active',
      'eczema_psoriasis',
    ],
  },
  {
    treatment: 'Facials',
    absoluteRedFlags: [
      'active_skin_infection',
      'active_herpes_outbreak',
      'open_wounds',
    ],
    cautionFlags: [
      'retinol_48h',
      'recent_deep_peel',
      'sunburn',
      'rosacea_active',
    ],
  },
  {
    treatment: 'Chemical Peels',
    absoluteRedFlags: [
      'pregnancy',
      'active_herpes_outbreak',
      'open_wounds',
      'accutane_12months',
    ],
    cautionFlags: [
      'retinol_48h',
      'recent_waxing',
      'eczema_psoriasis',
      'fitzpatrick_v_vi',
    ],
  },
  {
    treatment: 'Anti-Aging Treatments',
    absoluteRedFlags: [
      'pregnancy',
      'active_skin_infection',
    ],
    cautionFlags: [
      'retinol_48h',
      'recent_tan',
      'autoimmune_disease',
    ],
  },
];

export const PEPTIDE_CONTRAINDICATIONS: ContraindicationRule[] = [
  {
    treatment: 'BPC-157',
    absoluteRedFlags: [
      'active_malignancy',
      'tumor_history',
      'kidney_disease_stage3plus',
    ],
    cautionFlags: [
      'diabetes_uncontrolled',
      'cardiovascular_disease',
      'autoimmune_flare',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP'],
  },
  {
    treatment: 'GHK-Cu',
    absoluteRedFlags: [
      'active_malignancy',
      'copper_sensitivity',
    ],
    cautionFlags: [
      'wilson_disease',
      'liver_disease',
    ],
    requiresLabWork: false,
  },
  {
    treatment: 'Epithalon',
    absoluteRedFlags: [
      'active_malignancy',
      'tumor_history',
      'pregnancy',
    ],
    cautionFlags: [
      'autoimmune_disease',
      'hormone_sensitive_conditions',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP', 'Thyroid Panel'],
  },
  {
    treatment: 'TB-500',
    absoluteRedFlags: [
      'active_malignancy',
      'tumor_history',
      'pregnancy',
    ],
    cautionFlags: [
      'cardiovascular_disease',
      'autoimmune_flare',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP'],
  },
  {
    treatment: 'Thymosin Alpha-1',
    absoluteRedFlags: [
      'organ_transplant_immunosuppressed',
      'active_malignancy',
    ],
    cautionFlags: [
      'autoimmune_disease',
      'pregnancy',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP', 'Immune Panel'],
  },
  {
    treatment: 'Ipamorelin',
    absoluteRedFlags: [
      'active_malignancy',
      'tumor_history',
      'diabetic_retinopathy',
    ],
    cautionFlags: [
      'diabetes_uncontrolled',
      'cardiovascular_disease',
      'carpal_tunnel',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP', 'IGF-1', 'HbA1c'],
  },
];

export const IV_CONTRAINDICATIONS: ContraindicationRule[] = [
  {
    treatment: 'Glow Drip',
    absoluteRedFlags: [
      'congestive_heart_failure',
      'kidney_failure_esrd',
      'sulfa_allergy',
    ],
    cautionFlags: [
      'diabetes',
      'pregnancy',
      'kidney_disease',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP'],
  },
  {
    treatment: 'NAD+ Infusion',
    absoluteRedFlags: [
      'congestive_heart_failure',
      'kidney_failure_esrd',
    ],
    cautionFlags: [
      'bipolar_disorder',
      'anxiety_disorder',
      'pregnancy',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP'],
  },
  {
    treatment: 'Myers Cocktail',
    absoluteRedFlags: [
      'congestive_heart_failure',
      'kidney_failure_esrd',
      'g6pd_deficiency',
    ],
    cautionFlags: [
      'diabetes',
      'pregnancy',
      'magnesium_sensitivity',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP'],
  },
  {
    treatment: 'Glutathione Push',
    absoluteRedFlags: [
      'sulfa_allergy',
      'asthma_severe',
    ],
    cautionFlags: [
      'pregnancy',
      'breastfeeding',
    ],
    requiresLabWork: false,
  },
  {
    treatment: 'Vitamin C Drip',
    absoluteRedFlags: [
      'g6pd_deficiency',
      'kidney_failure_esrd',
      'hemochromatosis',
      'oxalate_kidney_stones',
    ],
    cautionFlags: [
      'kidney_disease',
      'diabetes',
      'pregnancy',
    ],
    requiresLabWork: true,
    labWorkType: ['CBC', 'CMP', 'G6PD Screen'],
  },
];

export interface HealthCondition {
  id: string;
  label: string;
  category: 'medical' | 'medication' | 'allergy' | 'lifestyle' | 'lab';
  severity: 'absolute' | 'caution';
}

export const HEALTH_CONDITIONS: HealthCondition[] = [
  { id: 'pacemaker', label: 'Pacemaker or internal defibrillator', category: 'medical', severity: 'absolute' },
  { id: 'internal_defibrillator', label: 'Internal defibrillator', category: 'medical', severity: 'absolute' },
  { id: 'active_skin_cancer', label: 'Active skin cancer', category: 'medical', severity: 'absolute' },
  { id: 'pregnancy', label: 'Pregnant or possibly pregnant', category: 'medical', severity: 'absolute' },
  { id: 'breastfeeding', label: 'Currently breastfeeding', category: 'medical', severity: 'caution' },
  { id: 'keloid_history', label: 'History of keloid scarring', category: 'medical', severity: 'absolute' },
  { id: 'myasthenia_gravis', label: 'Myasthenia Gravis', category: 'medical', severity: 'absolute' },
  { id: 'als', label: 'ALS (Amyotrophic Lateral Sclerosis)', category: 'medical', severity: 'absolute' },
  { id: 'eaton_lambert', label: 'Eaton-Lambert Syndrome', category: 'medical', severity: 'absolute' },
  { id: 'autoimmune_disease_active', label: 'Active autoimmune disease flare', category: 'medical', severity: 'absolute' },
  { id: 'autoimmune_disease', label: 'Autoimmune disease (controlled)', category: 'medical', severity: 'caution' },
  { id: 'active_malignancy', label: 'Active cancer/malignancy', category: 'medical', severity: 'absolute' },
  { id: 'tumor_history', label: 'History of tumors', category: 'medical', severity: 'absolute' },
  { id: 'kidney_disease_stage3plus', label: 'Stage 3+ kidney disease', category: 'medical', severity: 'absolute' },
  { id: 'kidney_failure_esrd', label: 'End-stage renal disease (ESRD)', category: 'medical', severity: 'absolute' },
  { id: 'kidney_disease', label: 'Kidney disease (mild)', category: 'medical', severity: 'caution' },
  { id: 'congestive_heart_failure', label: 'Congestive heart failure', category: 'medical', severity: 'absolute' },
  { id: 'cardiovascular_disease', label: 'Cardiovascular disease', category: 'medical', severity: 'caution' },
  { id: 'diabetes_uncontrolled', label: 'Uncontrolled diabetes', category: 'medical', severity: 'caution' },
  { id: 'diabetes', label: 'Diabetes (controlled)', category: 'medical', severity: 'caution' },
  { id: 'g6pd_deficiency', label: 'G6PD deficiency', category: 'medical', severity: 'absolute' },
  { id: 'bleeding_disorder', label: 'Bleeding/clotting disorder', category: 'medical', severity: 'absolute' },
  { id: 'blood_clotting_disorder', label: 'Blood clotting disorder', category: 'medical', severity: 'absolute' },
  { id: 'seizure_disorder_light_triggered', label: 'Light-triggered seizure disorder', category: 'medical', severity: 'absolute' },
  { id: 'photosensitivity_disorder', label: 'Photosensitivity disorder', category: 'medical', severity: 'absolute' },
  { id: 'liver_disease', label: 'Liver disease', category: 'medical', severity: 'caution' },
  { id: 'difficulty_swallowing', label: 'Difficulty swallowing', category: 'medical', severity: 'absolute' },
  
  { id: 'infection_injection_site', label: 'Active infection at treatment site', category: 'medical', severity: 'absolute' },
  { id: 'active_skin_infection', label: 'Active skin infection', category: 'medical', severity: 'absolute' },
  { id: 'active_infection', label: 'Active systemic infection', category: 'medical', severity: 'absolute' },
  { id: 'severe_active_acne', label: 'Severe active acne', category: 'medical', severity: 'absolute' },
  { id: 'active_acne', label: 'Active acne (mild/moderate)', category: 'medical', severity: 'caution' },
  { id: 'active_herpes_outbreak', label: 'Active herpes/cold sore outbreak', category: 'medical', severity: 'absolute' },
  { id: 'cold_sores_history', label: 'History of cold sores', category: 'medical', severity: 'caution' },
  { id: 'eczema_psoriasis', label: 'Eczema or psoriasis', category: 'medical', severity: 'caution' },
  { id: 'open_wounds', label: 'Open wounds in treatment area', category: 'medical', severity: 'absolute' },
  { id: 'sunburn', label: 'Current sunburn', category: 'medical', severity: 'caution' },
  { id: 'melasma', label: 'Melasma', category: 'medical', severity: 'caution' },
  
  { id: 'accutane_6months', label: 'Accutane use (within last 6 months)', category: 'medication', severity: 'absolute' },
  { id: 'accutane_12months', label: 'Accutane use (within last 12 months)', category: 'medication', severity: 'absolute' },
  { id: 'blood_thinners', label: 'Blood thinners (Warfarin, Aspirin, etc.)', category: 'medication', severity: 'caution' },
  { id: 'aminoglycoside_antibiotics', label: 'Aminoglycoside antibiotics', category: 'medication', severity: 'caution' },
  { id: 'retinol_48h', label: 'Retinol/AHA use (last 48 hours)', category: 'medication', severity: 'caution' },
  { id: 'immunosuppressed', label: 'Immunosuppressive medications', category: 'medication', severity: 'caution' },
  
  { id: 'shellfish_allergy', label: 'Shellfish allergy', category: 'allergy', severity: 'absolute' },
  { id: 'sulfa_allergy', label: 'Sulfa drug allergy', category: 'allergy', severity: 'absolute' },
  { id: 'allergy_to_plla', label: 'Allergy to PLLA', category: 'allergy', severity: 'absolute' },
  { id: 'copper_sensitivity', label: 'Copper sensitivity', category: 'allergy', severity: 'absolute' },
  { id: 'magnesium_sensitivity', label: 'Magnesium sensitivity', category: 'allergy', severity: 'caution' },
  
  { id: 'recent_tan', label: 'Recent sun tan (last 2 weeks)', category: 'lifestyle', severity: 'caution' },
  { id: 'recent_facial_surgery', label: 'Recent facial surgery', category: 'lifestyle', severity: 'caution' },
  { id: 'recent_botox_fillers_14days', label: 'Botox/Fillers within 14 days', category: 'lifestyle', severity: 'caution' },
  { id: 'recent_dental_work', label: 'Recent dental work', category: 'lifestyle', severity: 'caution' },
  { id: 'recent_waxing', label: 'Recent waxing in treatment area', category: 'lifestyle', severity: 'caution' },
  { id: 'metal_implants_face', label: 'Metal implants in face', category: 'lifestyle', severity: 'caution' },
  { id: 'upcoming_event_3days', label: 'Important event within 3 days', category: 'lifestyle', severity: 'caution' },
  { id: 'recent_filler_4weeks', label: 'Dermal filler within last 4 weeks', category: 'lifestyle', severity: 'caution' },
  { id: 'recent_rf_treatment', label: 'Recent radiofrequency treatment', category: 'lifestyle', severity: 'caution' },
  { id: 'recent_deep_peel', label: 'Deep chemical peel (same day)', category: 'lifestyle', severity: 'caution' },
  
  { id: 'fitzpatrick_iv', label: 'Fitzpatrick Skin Type IV', category: 'medical', severity: 'caution' },
  { id: 'fitzpatrick_v_vi', label: 'Fitzpatrick Skin Type V or VI (darker skin)', category: 'medical', severity: 'absolute' },
  { id: 'active_cystic_acne', label: 'Active cystic acne', category: 'medical', severity: 'absolute' },
  { id: 'thin_fragile_skin', label: 'Thin or fragile skin', category: 'medical', severity: 'absolute' },
  { id: 'rosacea_active', label: 'Active rosacea flare', category: 'medical', severity: 'absolute' },
  { id: 'active_dental_infection', label: 'Active dental infection', category: 'medical', severity: 'absolute' },
  { id: 'immunosuppressed_severe', label: 'Severely immunosuppressed', category: 'medical', severity: 'absolute' },
  { id: 'allergy_to_calcium_hydroxylapatite', label: 'Allergy to calcium hydroxylapatite', category: 'allergy', severity: 'absolute' },
  
  { id: 'lab_work_available', label: 'Recent lab work available (CBC/CMP)', category: 'lab', severity: 'caution' },
  { id: 'lab_work_unavailable', label: 'No recent lab work', category: 'lab', severity: 'caution' },
  
  { id: 'platelet_dysfunction', label: 'Platelet dysfunction', category: 'medical', severity: 'absolute' },
  { id: 'anemia', label: 'Anemia', category: 'medical', severity: 'caution' },
  { id: 'nsaid_use_recent', label: 'NSAID use (last 7 days)', category: 'medication', severity: 'caution' },
  { id: 'asthma_severe', label: 'Severe asthma', category: 'medical', severity: 'absolute' },
  { id: 'hemochromatosis', label: 'Hemochromatosis (iron overload)', category: 'medical', severity: 'absolute' },
  { id: 'oxalate_kidney_stones', label: 'History of oxalate kidney stones', category: 'medical', severity: 'absolute' },
  { id: 'bipolar_disorder', label: 'Bipolar disorder', category: 'medical', severity: 'caution' },
  { id: 'anxiety_disorder', label: 'Anxiety disorder', category: 'medical', severity: 'caution' },
  { id: 'wilson_disease', label: 'Wilson disease', category: 'medical', severity: 'caution' },
  { id: 'hormone_sensitive_conditions', label: 'Hormone-sensitive conditions', category: 'medical', severity: 'caution' },
  { id: 'autoimmune_flare', label: 'Autoimmune flare-up', category: 'medical', severity: 'caution' },
  { id: 'carpal_tunnel', label: 'Carpal tunnel syndrome', category: 'medical', severity: 'caution' },
  { id: 'organ_transplant_immunosuppressed', label: 'Organ transplant recipient', category: 'medical', severity: 'absolute' },
  { id: 'diabetic_retinopathy', label: 'Diabetic retinopathy', category: 'medical', severity: 'absolute' },
  { id: 'prior_neck_surgery', label: 'Prior neck surgery', category: 'lifestyle', severity: 'caution' },
  { id: 'enlarged_thyroid', label: 'Enlarged thyroid', category: 'medical', severity: 'caution' },
  { id: 'infection_treatment_area', label: 'Infection in treatment area', category: 'medical', severity: 'absolute' },
];

export interface SafetyCheckResult {
  treatment: string;
  isBlocked: boolean;
  blockedReasons: string[];
  hasCautions: boolean;
  cautionReasons: string[];
  requiresLabWork: boolean;
  requiredLabTests: string[];
  isConditional: boolean;
  conditionalMessage?: string;
}

export function checkTreatmentSafety(
  treatment: string,
  patientConditions: string[],
  hasLabWork: boolean = false
): SafetyCheckResult {
  const allRules = [
    ...CONTRAINDICATION_MATRIX,
    ...PEPTIDE_CONTRAINDICATIONS,
    ...IV_CONTRAINDICATIONS,
  ];

  const rule = allRules.find(
    (r) => r.treatment.toLowerCase() === treatment.toLowerCase()
  );

  if (!rule) {
    return {
      treatment,
      isBlocked: false,
      blockedReasons: [],
      hasCautions: false,
      cautionReasons: [],
      requiresLabWork: false,
      requiredLabTests: [],
      isConditional: false,
    };
  }

  const blockedReasons: string[] = [];
  const cautionReasons: string[] = [];

  for (const flag of rule.absoluteRedFlags) {
    if (patientConditions.includes(flag)) {
      const condition = HEALTH_CONDITIONS.find((c) => c.id === flag);
      blockedReasons.push(condition?.label || flag);
    }
  }

  for (const flag of rule.cautionFlags) {
    if (patientConditions.includes(flag)) {
      const condition = HEALTH_CONDITIONS.find((c) => c.id === flag);
      cautionReasons.push(condition?.label || flag);
    }
  }

  const requiresLabWork = rule.requiresLabWork || false;
  const requiredLabTests = rule.labWorkType || [];
  const isConditional = requiresLabWork && !hasLabWork;

  let conditionalMessage: string | undefined;
  if (isConditional) {
    conditionalMessage = `${treatment} recommendation is conditional pending review of ${requiredLabTests.join(', ')} lab results.`;
  }

  return {
    treatment,
    isBlocked: blockedReasons.length > 0,
    blockedReasons,
    hasCautions: cautionReasons.length > 0,
    cautionReasons,
    requiresLabWork,
    requiredLabTests,
    isConditional,
    conditionalMessage,
  };
}

export function getExplainableReason(
  treatment: string,
  blockedReasons: string[]
): string {
  if (blockedReasons.length === 0) return '';
  
  const reasonList = blockedReasons.join(', ');
  return `${treatment} is contraindicated due to your reported history of ${reasonList}, which increases the risk of adverse reactions.`;
}

export const TREATMENT_INTERACTIONS: TreatmentInteractionRule[] = [
  {
    treatment: 'Sculptra',
    incompatibleWith: ['Dermal Fillers', 'Radiesse'],
    waitPeriodDays: 28,
    warningMessage: 'Wait 4 weeks after dermal filler before biostimulator in the same area.',
  },
  {
    treatment: 'Radiesse',
    incompatibleWith: ['Dermal Fillers', 'Sculptra'],
    waitPeriodDays: 28,
    warningMessage: 'Wait 4 weeks after dermal filler before biostimulator in the same area.',
  },
  {
    treatment: 'Dermaplaning',
    incompatibleWith: ['Chemical Peel'],
    waitPeriodDays: 1,
    warningMessage: 'Do not schedule dermaplaning on the same day as a deep chemical peel to avoid over-exfoliation.',
  },
  {
    treatment: 'Sculptra',
    incompatibleWith: ['Morpheus8'],
    waitPeriodDays: 0,
    warningMessage: 'Do not combine biostimulators with same-day radiofrequency treatments.',
  },
  {
    treatment: 'Radiesse',
    incompatibleWith: ['Morpheus8'],
    waitPeriodDays: 0,
    warningMessage: 'Do not combine biostimulators with same-day radiofrequency treatments.',
  },
];

export const TREATMENT_RECOMMENDATIONS: TreatmentRecommendationRule[] = [
  {
    triggerTreatment: 'Morpheus8',
    recommendTreatment: 'Red Light Therapy',
    reason: 'LED/Red Light therapy post-microneedling reduces inflammation and accelerates healing.',
    isPostCare: true,
  },
  {
    triggerTreatment: 'Microneedling',
    recommendTreatment: 'Exosome Therapy',
    reason: 'Exosomes applied after microneedling can speed up recovery by up to 50%.',
    isPostCare: true,
  },
  {
    triggerTreatment: 'Microneedling',
    recommendTreatment: 'Red Light Therapy',
    reason: 'LED therapy post-procedure reduces redness and promotes faster healing.',
    isPostCare: true,
  },
  {
    triggerTreatment: 'Chemical Peel',
    recommendTreatment: 'Red Light Therapy',
    reason: 'Red light therapy accelerates skin recovery after chemical exfoliation.',
    isPostCare: true,
  },
];

export function checkTreatmentInteraction(
  selectedTreatment: string,
  existingTreatments: string[]
): { hasConflict: boolean; conflictMessage?: string } {
  const interactions = TREATMENT_INTERACTIONS.filter(
    (rule) => rule.treatment.toLowerCase() === selectedTreatment.toLowerCase()
  );

  for (const interaction of interactions) {
    for (const existing of existingTreatments) {
      if (interaction.incompatibleWith.some(t => t.toLowerCase() === existing.toLowerCase())) {
        return {
          hasConflict: true,
          conflictMessage: interaction.warningMessage,
        };
      }
    }
  }

  return { hasConflict: false };
}

export function getPostCareRecommendations(treatment: string): TreatmentRecommendationRule[] {
  return TREATMENT_RECOMMENDATIONS.filter(
    (rule) => rule.triggerTreatment.toLowerCase() === treatment.toLowerCase() && rule.isPostCare
  );
}

export function shouldBlockIPLForSkinType(patientConditions: string[]): boolean {
  return patientConditions.includes('fitzpatrick_v_vi');
}

export function requiresAntiviralForLipFlip(patientConditions: string[]): boolean {
  return patientConditions.includes('cold_sores_history');
}
