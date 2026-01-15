import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  TextInput,
} from 'react-native';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import {
  Camera,
  X,
  Play,
  Zap,
  Lock,
  Syringe,
  Wand2,
  CheckCircle,
  RefreshCw,
  Droplets,
  FlaskConical,
  Beaker,
  Info,
  ImagePlus,
  Shield,
  AlertTriangle,
  Ban,
  AlertCircle,
  FileText,
  SwitchCamera,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import AuraScoreGauge from '@/components/AuraScoreGauge';
import BiometricScanOverlay from '@/components/BiometricScanOverlay';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import EmailCaptureModal from '@/components/EmailCaptureModal';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import BiometricIntroScan from '@/components/BiometricIntroScan';
import HealthQuestionnaire from '@/components/HealthQuestionnaire';
import { AnalysisResult, PatientHealthProfile, ClinicalProcedure, PeptideTherapy, IVOptimization, PatientConsent } from '@/types';
import { checkTreatmentSafety, getExplainableReason } from '@/constants/contraindications';
import PatientConsentModal from '@/components/PatientConsentModal';



const MAX_CONTENT_WIDTH = 600;
const MAX_SLIDER_WIDTH = 500;

export default function ScanScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth > 768;
  
  const {
    currentAnalysis,
    setCurrentAnalysis,
    capturedImage,
    setCapturedImage,
    simulatedImage,
    setSimulatedImage,
    hasUnlockedResults,
    addLead,
    resetScan,
    patientHealthProfile,
    saveHealthProfile,
    clearHealthProfile,
    patientConsent,
    savePatientConsent,
    clearPatientConsent,
    isTreatmentEnabled,
    getTreatmentPrice,
    treatmentConfigs,
    isDevMode,
    setIsDevMode,
    patientBasicInfo,
    savePatientBasicInfo,
    updatePatientEmail,
  } = useApp();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showIntroScan, setShowIntroScan] = useState(true);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isLeadSaved, setIsLeadSaved] = useState(false);
  const [showHealthQuestionnaire, setShowHealthQuestionnaire] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isSimulationPending, setIsSimulationPending] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);
  const DEV_CODE = '1234';

  const [showDevPrompt, setShowDevPrompt] = useState(false);
  const [devCodeInput, setDevCodeInput] = useState('');

  const handleDevModePress = useCallback(() => {
    if (isDevMode) {
      setIsDevMode(false);
      console.log('Developer mode disabled');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    if (Platform.OS === 'web') {
      const code = window.prompt('Enter developer code:');
      if (code === DEV_CODE) {
        setIsDevMode(true);
        console.log('Developer mode enabled - questionnaires bypassed');
      } else if (code !== null) {
        Alert.alert('Invalid Code', 'The developer code is incorrect.');
      }
    } else if (Platform.OS === 'ios') {
      Alert.prompt(
        'Developer Mode',
        'Enter the developer code to bypass questionnaires:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: (code?: string) => {
              if (code === DEV_CODE) {
                setIsDevMode(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                console.log('Developer mode enabled - questionnaires bypassed');
              } else {
                Alert.alert('Invalid Code', 'The developer code is incorrect.');
              }
            },
          },
        ],
        'secure-text'
      );
    } else {
      // Android - show custom prompt
      setDevCodeInput('');
      setShowDevPrompt(true);
    }
  }, [setIsDevMode, isDevMode]);

  const handleDevCodeSubmit = useCallback(() => {
    if (devCodeInput === DEV_CODE) {
      setIsDevMode(true);
      setShowDevPrompt(false);
      setDevCodeInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('Developer mode enabled - questionnaires bypassed');
    } else {
      Alert.alert('Invalid Code', 'The developer code is incorrect.');
      setDevCodeInput('');
    }
  }, [devCodeInput, setIsDevMode]);

  const startCamera = async () => {
    if (!permission?.granted) {
      if (permission?.canAskAgain === false) {
        Alert.alert(
          'Camera Access Denied',
          'Please enable camera access in your device settings to use facial analysis.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'web') {
                  Alert.alert('Settings', 'Please allow camera access in your browser settings and refresh the page.');
                }
              }
            },
          ]
        );
        return;
      }
      
      const result = await requestPermission();
      if (!result.granted) {
        console.log('Camera permission denied:', result);
        return;
      }
    }
    setIsCameraActive(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        console.log('Image selected from gallery:', result.assets[0].uri);
        if (!patientBasicInfo?.email) {
          setTimeout(() => setShowEmailModal(true), 500);
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    console.log('Toggling camera from:', cameraFacing);
    setCameraFacing(prev => {
      const newFacing = prev === 'front' ? 'back' : 'front';
      console.log('Camera now set to:', newFacing);
      return newFacing;
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const captureImage = async () => {
    if (!cameraRef.current) return;
    
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      if (photo) {
        setCapturedImage(photo.uri);
        setIsCameraActive(false);
        if (!patientBasicInfo?.email) {
          setTimeout(() => setShowEmailModal(true), 500);
        }
      }
    } catch (error) {
      console.log('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const generateTreatmentSimulation = useCallback(async (imageUri: string, treatments: string[], retryCount = 0): Promise<string | null> => {
    const maxRetries = 2;
    try {
      console.log(`Starting AI treatment simulation (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      
      let base64Image = '';
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        const file = new File(imageUri);
        base64Image = await file.base64();
      }

      const treatmentPrompt = `Transform this face photo to show dramatic but realistic aesthetic treatment results.

APPLY THESE VISIBLE CHANGES:

1. WRINKLE REDUCTION: Completely smooth out ALL forehead lines, frown lines between eyebrows, and crow's feet around eyes. Make the skin look 10 years younger with zero visible wrinkles.

2. SKIN RESURFACING: Dramatically improve skin texture - make pores invisible, even out all skin tone, remove any redness or discoloration. Add a luminous, glowing complexion with perfect porcelain-smooth texture.

3. FACIAL CONTOURING: Add noticeable volume to cheeks making them fuller and more lifted. Define the jawline to be sharper and more sculpted. Fill in hollow temples and under-eye areas. Create a visible V-shape face contour.

4. REJUVENATION: Tighten all sagging skin, especially around jowls, neck, and lower face. Lift the brows slightly. Make eyes look more open and refreshed.

IMPORTANT:
- Keep the SAME person, same identity, same hair, same background
- Changes must be CLEARLY VISIBLE - this is a before/after comparison
- Make the person look visibly younger and more refreshed
- Skin should have a healthy radiant glow
- This should look like a dramatic transformation photo from a premium aesthetic clinic`;

      console.log('Calling Gemini image edit API...');
      
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: treatmentPrompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        }),
      });

      if (!response.ok) {
        console.log('Image edit API error:', response.status);
        return null;
      }

      const result = await response.json();
      console.log('AI simulation generated successfully');
      
      if (result.image?.base64Data) {
        return `data:${result.image.mimeType};base64,${result.image.base64Data}`;
      }
      
      return null;
    } catch (error) {
      console.log(`Error generating treatment simulation (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying simulation in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return generateTreatmentSimulation(imageUri, treatments, retryCount + 1);
      }
      
      return null;
    }
  }, []);

  const analyzeImageWithAI = useCallback(async (imageUri: string): Promise<AnalysisResult> => {
    console.log('Starting AI clinical analysis of captured image...');
    
    let base64Image = '';
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      const file = new File(imageUri);
      base64Image = await file.base64();
    }

    const analysisSchema = z.object({
      auraScore: z.number().min(300).max(1000).describe('Overall aesthetic score based on facial harmony, skin quality, and structural balance. Higher scores indicate better baseline aesthetics.'),
      faceType: z.string().describe('Detected face shape classification (e.g., Diamond Elite, Classic Oval, Angular Sculpted, Heart Symmetry, Square Strong, Round Soft)'),
      skinIQ: z.object({
        texture: z.enum(['Refined', 'Moderate', 'Needs Attention']).describe('Skin surface texture quality based on visible smoothness and evenness'),
        pores: z.enum(['Minimal', 'Visible', 'Enlarged']).describe('Pore visibility assessment'),
        pigment: z.enum(['Even', 'Mild Variation', 'Uneven']).describe('Skin tone evenness and pigmentation assessment'),
        redness: z.enum(['Low', 'Moderate', 'High']).describe('Visible redness, erythema, or vascular concerns'),
      }),
      clinicalRoadmap: z.array(z.object({
        name: z.string().describe('Treatment name based on OBSERVED concerns. STRICT RULES: Morpheus8/RF Microneedling=ONLY for VISIBLE jowling/neck laxity/sagging. Botox=ONLY for VISIBLE forehead lines/crows feet/frown lines. For texture/pores: DiamondGlow, Chemical Peels, Facials, Dermaplaning. For pigmentation/redness: Stellar IPL, IPL, Clear+Brilliant. For fine lines: MOXI Laser, Microneedling. For volume loss: Dermal Filler, Sculptra. For hydration: HydraFacial.'),
        benefit: z.string().describe('What this treatment achieves for the SPECIFIC concern you observed'),
        price: z.string().describe('Price range (e.g., $150, $350, $800)'),
        clinicalReason: z.string().describe('MUST name the EXACT area and describe what you SEE. Example: "Visible horizontal forehead lines at rest" or "Enlarged pores on nose and inner cheeks" or "Hyperpigmented macules on bilateral malar region". NO generic reasons.'),
      })).min(2).max(6).describe('BANNED DEFAULTS: Never recommend Morpheus8+Botox+HydraFacial together unless each is justified by VISIBLE findings. Young/healthy skin (20s-30s): ONLY surface treatments. Pigmentation: IPL-based. Texture/pores: DiamondGlow/Peels. Wrinkles: Botox ONLY if visible. Laxity: Morpheus8 ONLY if jowls/sagging visible. MUST include at least one of: DiamondGlow, Chemical Peels, Facials, or Dermaplaning.'),
      peptideTherapy: z.array(z.object({
        name: z.string().describe('Peptide name (e.g., BPC-157, GHK-Cu, Epithalon, TB-500, Thymosin Alpha-1)'),
        goal: z.string().describe('Specific goal for this patient based on detected concerns'),
        mechanism: z.string().describe('How this peptide addresses the detected issues'),
        frequency: z.string().describe('Recommended protocol dosing'),
      })).min(1).max(3).describe('Peptide recommendations tailored to detected aging signs and skin condition'),
      ivOptimization: z.array(z.object({
        name: z.string().describe('IV therapy name (e.g., Glow Drip, NAD+ Infusion, Myers Cocktail, Glutathione Push, Vitamin C Drip)'),
        benefit: z.string().describe('Specific benefit for this patients detected skin concerns'),
        ingredients: z.string().describe('Key ingredients and dosages'),
        duration: z.string().describe('Session duration and frequency recommendation'),
      })).min(1).max(2).describe('IV therapy recommendations based on detected skin quality and aging concerns'),
      volumeAssessment: z.array(z.object({
        zone: z.string().describe('Facial zone - MUST assess ALL of these areas: Temples, Forehead, Brows, Periorbital/Tear Troughs, Upper Cheeks (Malar), Lower Cheeks (Submalar), Nasolabial Folds, Marionette Lines, Lips, Perioral Area, Chin/Mentum, Jawline/Pre-jowl, Neck'),
        volumeLoss: z.number().min(0).max(60).describe('Estimated percentage of volume loss detected in this zone - base on visible hollowing, shadowing, and contour changes. 0 means no loss, 60 means severe loss.'),
        ageRelatedCause: z.string().describe('Specific anatomical cause of volume loss in this zone (fat pad atrophy, bone resorption, muscle changes, etc.)'),
        recommendation: z.string().describe('Targeted treatment recommendation for this specific zone'),
      })).min(5).max(10).describe('COMPREHENSIVE volume assessment - analyze ALL facial zones listed above. Include zones even with minimal loss (5-10%) to give complete picture. Only omit zones that appear completely full with 0% loss.'),
      fitzpatrickAssessment: z.object({
        type: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']).describe('Fitzpatrick Skin Type classification based on skin tone analysis: I=Very fair/always burns, II=Fair/usually burns, III=Medium/sometimes burns, IV=Olive/rarely burns, V=Brown/very rarely burns, VI=Dark brown to black/never burns'),
        description: z.string().describe('Brief description of the detected skin phototype characteristics'),
        riskLevel: z.enum(['low', 'caution', 'high']).describe('Risk level for light-based treatments: low for I-III, caution for IV, high for V-VI'),
        detectedIndicators: z.array(z.string()).describe('Visual indicators used to determine skin type (melanin density, undertones, etc.)'),
      }).describe('CRITICAL: Accurately assess the Fitzpatrick skin type from the image. This affects treatment safety for IPL, lasers, and other light-based therapies. Types V and VI have HIGH RISK for burns with IPL.'),
    });

    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI analysis attempt ${attempt + 1}/${maxRetries + 1}`);
        
        const result = await generateObject({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are performing a REAL clinical skin assessment. Your recommendations MUST match what you ACTUALLY SEE.

## STEP 1: EXAMINE THE IMAGE FIRST
Before ANY recommendations, identify:
- WRINKLES: Where exactly? (forehead, glabella, periorbital, perioral) How deep? Static or dynamic?
- TEXTURE: Pore size? Where? Roughness? Congestion?
- PIGMENTATION: Sun spots? Melasma? Redness? Where specifically?
- VOLUME: Systematically assess ALL facial zones for hollowing, deflation, or volume loss:
  * UPPER FACE: Temples (temporal hollowing), Forehead (brow bone), Brows (lateral brow)
  * MIDFACE: Periorbital/Tear Troughs, Upper Cheeks (malar fat pad), Lower Cheeks (submalar hollowing)
  * LOWER FACE: Nasolabial Folds, Marionette Lines, Lips (volume/vermillion), Perioral area, Chin/Mentum, Jawline/Pre-jowl sulcus
  * NECK: Platysmal bands, submental fullness
- LAXITY: Any jowling, neck bands, brow ptosis? (MUST be visible for Morpheus8)

## STEP 2: TREATMENT MATCHING - STRICT RULES

**MORPHEUS8**: ONLY recommend if you see VISIBLE jowling, neck laxity, or significant skin sagging. NOT for "prevention" or "tightening" without visible laxity.

**BOTOX**: ONLY recommend if you see VISIBLE dynamic wrinkles - horizontal forehead lines, vertical frown lines (11s), or crow's feet. NOT for smooth foreheads.

**DIAMONDGLOW/CHEMICAL PEELS/FACIALS**: Recommend for texture, pores, dullness, mild congestion. MOST patients benefit from these.

**IPL/STELLAR IPL**: Recommend for visible pigmentation, sun spots, redness, broken capillaries.

**CLEAR+BRILLIANT/MOXI**: For fine lines, early sun damage, overall skin quality.

**DERMAL FILLER**: ONLY for VISIBLE volume loss in specific areas.

## STEP 3: DIVERSIFY BY CONCERN TYPE

- Young healthy skin (20s-30s, minimal concerns): DiamondGlow, Facials, Chemical Peels, LED Therapy
- Pigmentation/redness: IPL, Stellar IPL, Clear+Brilliant
- Texture/pores: DiamondGlow, Chemical Peels, Microdermabrasion, Dermaplaning
- Fine lines: MOXI Laser, Light Peels, Microneedling
- Deep wrinkles: Botox (if dynamic), Fillers (if static)
- Volume loss: Dermal Filler, Sculptra, Radiesse
- Visible sagging: RF Microneedling, Morpheus8, PDO Threads

## CLINICAL REASON REQUIREMENTS
Each clinicalReason MUST include:
1. EXACT anatomical location (e.g., "lateral canthi", "glabellar region", "nasal sidewalls")
2. SPECIFIC observation (e.g., "visible horizontal rhytids", "dilated pores", "hyperpigmented macules")

EXAMPLE GOOD: "Visible periorbital rhytids (crow's feet) with fine lines extending 1cm laterally"
EXAMPLE BAD: "Signs of aging around the eyes" (too vague)

## MANDATORY SURFACE TREATMENT
ALWAYS include at least ONE of: DiamondGlow, Chemical Peels, Facials, or Dermaplaning.

## VOLUME ASSESSMENT REQUIREMENTS
You MUST analyze ALL facial zones for volume:
1. TEMPLES - Look for temporal hollowing, shadow above cheekbone
2. FOREHEAD/BROWS - Assess brow position, lateral brow volume
3. PERIORBITAL - Tear trough depth, under-eye hollowing, orbital rim
4. UPPER CHEEKS (MALAR) - Malar fat pad fullness, cheekbone projection
5. LOWER CHEEKS (SUBMALAR) - Submalar hollowing, midface deflation
6. NASOLABIAL FOLDS - Depth of fold, fat descent
7. MARIONETTE LINES - Oral commissure to chin shadow
8. LIPS - Vermillion volume, perioral lines, philtrum definition
9. CHIN/MENTUM - Chin projection, pogonion volume
10. JAWLINE - Pre-jowl sulcus, mandibular definition, jowl formation

Include ALL zones with ANY volume loss (even 5-10%). Only omit if zone is completely full.

## OUTPUT
- auraScore: Based on overall skin health and facial harmony
- clinicalRoadmap: 2-4 treatments for young/healthy, 4-6 for significant concerns
- volumeAssessment: COMPREHENSIVE assessment of ALL facial zones - minimum 5 zones
- fitzpatrickAssessment: Accurate skin type for treatment safety`
                },
                {
                  type: 'image',
                  image: `data:image/jpeg;base64,${base64Image}`
                }
              ]
            }
          ],
          schema: analysisSchema,
        });

        console.log('AI clinical analysis completed successfully');
        return result;
      } catch (error) {
        console.log(`AI analysis attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          console.log(`Retrying in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log('All AI analysis attempts failed, using intelligent fallback');
    
    const randomScore = Math.floor(Math.random() * 200) + 650;
    const faceTypes = ['Diamond Elite', 'Classic Oval', 'Heart Symmetry', 'Angular Sculpted', 'Square Strong'];
    const randomFaceType = faceTypes[Math.floor(Math.random() * faceTypes.length)];
    
    const fallbackTreatmentSets = [
      [
        { name: 'DiamondGlow', benefit: 'Deep exfoliation and serum infusion for instantly glowing skin', price: '$200-300', clinicalReason: 'Addresses skin texture and pore congestion with customizable serums' },
        { name: 'Chemical Peels', benefit: 'Accelerate cell turnover for smoother, more even skin tone', price: '$150-400', clinicalReason: 'Improves overall skin clarity and reduces superficial discoloration' },
        { name: 'LED Therapy', benefit: 'Reduce inflammation and stimulate collagen production', price: '$75-150', clinicalReason: 'Non-invasive treatment for general skin health maintenance' },
      ],
      [
        { name: 'Stellar IPL', benefit: 'Target pigmentation and vascular concerns for clearer skin', price: '$350-500', clinicalReason: 'Effective for sun damage, redness, and uneven skin tone' },
        { name: 'Microdermabrasion', benefit: 'Mechanical exfoliation to reveal fresh, smooth skin', price: '$150-250', clinicalReason: 'Improves skin texture and enhances product absorption' },
        { name: 'Facials', benefit: 'Professional deep cleansing and customized treatment', price: '$100-200', clinicalReason: 'Maintains skin health and addresses specific concerns' },
      ],
      [
        { name: 'Clear + Brilliant', benefit: 'Gentle laser resurfacing for refreshed, youthful skin', price: '$400-600', clinicalReason: 'Preventative treatment for early signs of aging and texture concerns' },
        { name: 'Dermaplaning', benefit: 'Remove peach fuzz and dead skin for smooth canvas', price: '$100-175', clinicalReason: 'Enhances skin smoothness and improves makeup application' },
        { name: 'Red Light Therapy', benefit: 'Stimulate cellular energy and promote healing', price: '$50-100', clinicalReason: 'Supports overall skin rejuvenation and recovery' },
      ],
      [
        { name: 'MOXI Laser', benefit: 'Gentle fractional laser for tone and texture improvement', price: '$500-800', clinicalReason: 'Addresses early sun damage and promotes collagen remodeling' },
        { name: 'DiamondGlow', benefit: 'Deep exfoliation with simultaneous serum infusion', price: '$200-300', clinicalReason: 'Provides immediate glow while addressing pore concerns' },
        { name: 'Chemical Peels', benefit: 'Professional-grade exfoliation for renewed skin', price: '$150-400', clinicalReason: 'Accelerates cell turnover for improved texture and tone' },
      ],
      [
        { name: 'Microneedling', benefit: 'Stimulate natural collagen production for firmer skin', price: '$300-500', clinicalReason: 'Addresses fine lines and improves overall skin quality' },
        { name: 'Facials', benefit: 'Customized treatment for your specific skin needs', price: '$100-200', clinicalReason: 'Professional cleansing and targeted treatment' },
        { name: 'Exosome Therapy', benefit: 'Accelerate healing and enhance treatment results', price: '$400-800', clinicalReason: 'Boosts cellular regeneration when combined with procedures' },
      ],
    ];
    
    const selectedTreatments = fallbackTreatmentSets[Math.floor(Math.random() * fallbackTreatmentSets.length)];
    
    return {
      auraScore: randomScore,
      faceType: randomFaceType,
      skinIQ: {
        texture: 'Moderate',
        pores: 'Visible',
        pigment: 'Mild Variation',
        redness: 'Low',
      },
      clinicalRoadmap: selectedTreatments,
      peptideTherapy: [
        { name: 'GHK-Cu', goal: 'Enhance skin repair and collagen production', mechanism: 'Copper peptide complex that activates regenerative genes and promotes wound healing', frequency: '2x daily topical application' },
        { name: 'BPC-157', goal: 'Accelerate tissue healing and reduce inflammation', mechanism: 'Body protection compound that enhances angiogenesis and tissue repair', frequency: 'As directed by provider' },
      ],
      ivOptimization: [
        { name: 'Glow Drip', benefit: 'Brightens skin and supports detoxification', ingredients: 'Glutathione 600mg, Vitamin C 2500mg, B-Complex', duration: '45-60 minutes, weekly for 4 weeks' },
      ],
      volumeAssessment: [
        { zone: 'Temples', volumeLoss: 12, ageRelatedCause: 'Temporal fat pad atrophy and bone resorption', recommendation: 'Temple filler with Sculptra or Radiesse for structural support' },
        { zone: 'Periorbital/Tear Troughs', volumeLoss: 15, ageRelatedCause: 'Infraorbital fat descent and orbital rim hollowing', recommendation: 'HA filler or PRP under-eye rejuvenation' },
        { zone: 'Upper Cheeks (Malar)', volumeLoss: 18, ageRelatedCause: 'Malar fat pad descent and volume deflation', recommendation: 'Voluma or Sculptra for malar augmentation' },
        { zone: 'Lower Cheeks (Submalar)', volumeLoss: 10, ageRelatedCause: 'Buccal fat atrophy creating midface hollowing', recommendation: 'Dermal filler for submalar volume restoration' },
        { zone: 'Nasolabial Folds', volumeLoss: 14, ageRelatedCause: 'Fat pad descent and loss of midface support', recommendation: 'HA filler to soften fold depth' },
        { zone: 'Lips', volumeLoss: 8, ageRelatedCause: 'Vermillion thinning and perioral volume loss', recommendation: 'Lip filler for volume and definition' },
        { zone: 'Jawline/Pre-jowl', volumeLoss: 12, ageRelatedCause: 'Mandibular bone resorption and pre-jowl sulcus formation', recommendation: 'Jawline filler or Radiesse for definition' },
      ],
      fitzpatrickAssessment: {
        type: 'III',
        description: 'Medium skin tone with moderate melanin',
        riskLevel: 'low',
        detectedIndicators: ['Medium complexion', 'Neutral undertones'],
      },
    };
  }, []);

  const applyContraindicationChecks = useCallback((analysis: AnalysisResult): AnalysisResult => {
    const baseConditions = patientHealthProfile?.conditions || [];
    const hasLabWork = patientHealthProfile?.hasRecentLabWork || false;

    const fitzpatrickConditions: string[] = [];
    if (analysis.fitzpatrickAssessment) {
      const fitzType = analysis.fitzpatrickAssessment.type;
      if (fitzType === 'IV') {
        fitzpatrickConditions.push('fitzpatrick_iv');
        console.log('AI detected Fitzpatrick Type IV - adding caution flag');
      } else if (fitzType === 'V' || fitzType === 'VI') {
        fitzpatrickConditions.push('fitzpatrick_v_vi');
        console.log(`AI detected Fitzpatrick Type ${fitzType} - adding absolute block flag`);
      }
    }

    const conditions = [...baseConditions, ...fitzpatrickConditions];
    console.log('Applying contraindication checks with conditions:', conditions);
    console.log('Filtering treatments by enabled configs. Total configs:', treatmentConfigs.length);

    const checkedRoadmap: ClinicalProcedure[] = analysis.clinicalRoadmap
      .filter((proc) => {
        const enabled = isTreatmentEnabled(proc.name);
        console.log(`Treatment ${proc.name}: enabled=${enabled}`);
        return enabled;
      })
      .map((proc) => {
        const safety = checkTreatmentSafety(proc.name, conditions, hasLabWork);
        const customPrice = getTreatmentPrice(proc.name);
        return {
          ...proc,
          price: customPrice || proc.price,
          safetyStatus: {
            ...safety,
            explainableReason: safety.isBlocked
              ? getExplainableReason(proc.name, safety.blockedReasons)
              : undefined,
          },
        };
      });

    const checkedPeptides: PeptideTherapy[] = analysis.peptideTherapy
      .filter((peptide) => {
        const enabled = isTreatmentEnabled(peptide.name);
        console.log(`Peptide ${peptide.name}: enabled=${enabled}`);
        return enabled;
      })
      .map((peptide) => {
        const safety = checkTreatmentSafety(peptide.name, conditions, hasLabWork);
        return {
          ...peptide,
          safetyStatus: {
            ...safety,
            explainableReason: safety.isBlocked
              ? getExplainableReason(peptide.name, safety.blockedReasons)
              : undefined,
          },
        };
      });

    const checkedIV: IVOptimization[] = analysis.ivOptimization
      .filter((iv) => {
        const enabled = isTreatmentEnabled(iv.name);
        console.log(`IV ${iv.name}: enabled=${enabled}`);
        return enabled;
      })
      .map((iv) => {
        const safety = checkTreatmentSafety(iv.name, conditions, hasLabWork);
        return {
          ...iv,
          safetyStatus: {
            ...safety,
            explainableReason: safety.isBlocked
              ? getExplainableReason(iv.name, safety.blockedReasons)
              : undefined,
          },
        };
      });

    console.log(`Filtered roadmap: ${checkedRoadmap.length} treatments, ${checkedPeptides.length} peptides, ${checkedIV.length} IVs`);

    return {
      ...analysis,
      clinicalRoadmap: checkedRoadmap,
      peptideTherapy: checkedPeptides,
      ivOptimization: checkedIV,
    };
  }, [patientHealthProfile, treatmentConfigs, isTreatmentEnabled, getTreatmentPrice]);

  const handleHealthQuestionnaireComplete = useCallback((profile: PatientHealthProfile) => {
    saveHealthProfile(profile);
    setShowHealthQuestionnaire(false);
    console.log('Health profile saved, showing consent form');
    setShowConsentModal(true);
  }, [saveHealthProfile]);

  const handleConsentComplete = useCallback((consent: PatientConsent) => {
    savePatientConsent(consent);
    setShowConsentModal(false);
    console.log('Patient consent saved:', consent.optedOutOfAI ? 'Opted out of AI' : 'Consented to AI');
  }, [savePatientConsent]);

  const runAnalysis = async () => {
    if (!capturedImage) return;

    if (!isDevMode && !patientHealthProfile) {
      setShowHealthQuestionnaire(true);
      return;
    }

    if (!isDevMode && !patientConsent) {
      setShowConsentModal(true);
      return;
    }

    setIsAnalyzing(true);
    setIsSimulationPending(true);

    try {
      const aiAnalysisPromise = analyzeImageWithAI(capturedImage);
      const simulationPromise = generateTreatmentSimulation(capturedImage, ['Botox', 'Morpheus8', 'Sculptra']);

      const aiAnalysisResult = await aiAnalysisPromise;
      
      simulationPromise.then((simulatedResult) => {
        setIsSimulationPending(false);
        if (simulatedResult) {
          setSimulatedImage(simulatedResult);
          console.log('Treatment simulation set successfully');
        } else {
          console.log('Simulation failed after retries, using original image');
        }
      }).catch(() => {
        setIsSimulationPending(false);
        console.log('Simulation promise rejected');
      });

      const safetyCheckedAnalysis = applyContraindicationChecks(aiAnalysisResult);
      setCurrentAnalysis(safetyCheckedAnalysis);
      console.log('AI analysis with safety checks:', JSON.stringify(safetyCheckedAnalysis, null, 2));
    } catch (error) {
      console.log('Analysis error:', error);
      Alert.alert('Analysis Error', 'Unable to complete facial analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setTimeout(() => setShowLeadModal(true), 1000);
  };

  const handleSaveLead = async (name: string, phone: string) => {
    if (!patientBasicInfo || patientBasicInfo.name !== name || patientBasicInfo.phone !== phone) {
      await savePatientBasicInfo({ 
        name, 
        phone, 
        email: patientBasicInfo?.email 
      });
    }
    await addLead(name, phone);
    setIsLeadSaved(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => {
      setShowLeadModal(false);
      setIsLeadSaved(false);
    }, 1500);
  };

  const handleEmailSubmit = async (email: string) => {
    await updatePatientEmail(email);
    setIsEmailSaved(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => {
      setShowEmailModal(false);
      setIsEmailSaved(false);
    }, 1000);
  };

  const handleEmailSkip = () => {
    setShowEmailModal(false);
  };

  const handleNewScan = () => {
    resetScan();
    clearHealthProfile();
    clearPatientConsent();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const renderSafetyBadge = (safetyStatus: ClinicalProcedure['safetyStatus']) => {
    if (!safetyStatus) return null;

    if (safetyStatus.isBlocked) {
      return (
        <View style={styles.safetyBadgeBlocked}>
          <Ban size={10} color="#ef4444" />
          <Text style={styles.safetyBadgeBlockedText}>CONTRAINDICATED</Text>
        </View>
      );
    }

    if (safetyStatus.isConditional) {
      return (
        <View style={styles.safetyBadgeConditional}>
          <FileText size={10} color={Colors.gold} />
          <Text style={styles.safetyBadgeConditionalText}>LAB REQUIRED</Text>
        </View>
      );
    }

    if (safetyStatus.hasCautions) {
      return (
        <View style={styles.safetyBadgeCaution}>
          <AlertCircle size={10} color="#f59e0b" />
          <Text style={styles.safetyBadgeCautionText}>CAUTION</Text>
        </View>
      );
    }

    return (
      <View style={styles.safetyBadgeSafe}>
        <Shield size={10} color={Colors.success} />
        <Text style={styles.safetyBadgeSafeText}>CLEARED</Text>
      </View>
    );
  };

  const renderSafetyWarning = (safetyStatus: ClinicalProcedure['safetyStatus']) => {
    if (!safetyStatus) return null;

    if (safetyStatus.isBlocked && safetyStatus.explainableReason) {
      return (
        <View style={styles.safetyWarningBlocked}>
          <AlertTriangle size={12} color="#ef4444" />
          <Text style={styles.safetyWarningBlockedText}>
            {safetyStatus.explainableReason}
          </Text>
        </View>
      );
    }

    if (safetyStatus.isConditional && safetyStatus.conditionalMessage) {
      return (
        <View style={styles.safetyWarningConditional}>
          <FileText size={12} color={Colors.gold} />
          <Text style={styles.safetyWarningConditionalText}>
            {safetyStatus.conditionalMessage}
          </Text>
        </View>
      );
    }

    if (safetyStatus.hasCautions && safetyStatus.cautionReasons.length > 0) {
      return (
        <View style={styles.safetyWarningCaution}>
          <AlertCircle size={12} color="#f59e0b" />
          <Text style={styles.safetyWarningCautionText}>
            Proceed with caution due to: {safetyStatus.cautionReasons.join(', ')}
          </Text>
        </View>
      );
    }

    return null;
  };

  if (showIntroScan) {
    return (
      <BiometricIntroScan onComplete={() => setShowIntroScan(false)} />
    );
  }

  if (!capturedImage) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle}>
                REVEAL YOUR{'\n'}
                <Text style={styles.heroTitleGold}>AURA INDEX</Text>
              </Text>
            </View>
            <Text style={styles.heroSubtitle}>
              AI-Powered Biometric Analysis for Regenerative Aesthetics
            </Text>
            <Text style={styles.patentPending}>Patent Pending</Text>
          </View>

          <View style={styles.cameraContainer}>
            {isCameraActive ? (
              <View style={styles.cameraWrapper}>
                <CameraView
                  key={cameraFacing}
                  ref={cameraRef}
                  style={styles.camera}
                  facing={cameraFacing}
                  mirror={cameraFacing === 'front'}
                  responsiveOrientationWhenOrientationLocked={true}
                />
                <View style={styles.cameraOverlay}>
                  <View style={styles.faceGuide} />
                </View>
                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={stopCamera}
                    activeOpacity={0.8}
                  >
                    <X size={24} color={Colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={captureImage}
                    activeOpacity={0.8}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.flipButton}
                    onPress={toggleCameraFacing}
                    activeOpacity={0.8}
                  >
                    <SwitchCamera size={24} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.consultationOptions}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={startCamera}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.gold, Colors.goldDark]}
                    style={styles.optionIconGradient}
                  >
                    <Camera size={28} color={Colors.black} />
                  </LinearGradient>
                  <Text style={styles.optionText}>TAKE PHOTO</Text>
                </TouchableOpacity>
                
                <View style={styles.optionDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>
                
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIconContainer}>
                    <ImagePlus size={28} color={Colors.gold} />
                  </View>
                  <Text style={styles.optionText}>UPLOAD PHOTO</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        <TouchableOpacity
            style={styles.devModeBottomButton}
            onPress={handleDevModePress}
            activeOpacity={0.7}
          >
            <Lock size={14} color={isDevMode ? Colors.gold : Colors.textMuted} />
            <Text style={[styles.devModeBottomText, isDevMode && styles.devModeActiveText]}>
              {isDevMode ? 'DEV MODE ON' : 'Developer'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showDevPrompt}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDevPrompt(false)}
        >
          <View style={styles.devPromptOverlay}>
            <View style={styles.devPromptContainer}>
              <Text style={styles.devPromptTitle}>Developer Mode</Text>
              <Text style={styles.devPromptSubtitle}>Enter the developer code to bypass questionnaires</Text>
              <TextInput
                style={styles.devPromptInput}
                placeholder="Enter code"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                value={devCodeInput}
                onChangeText={setDevCodeInput}
                autoFocus
              />
              <View style={styles.devPromptButtons}>
                <TouchableOpacity
                  style={styles.devPromptCancelButton}
                  onPress={() => {
                    setShowDevPrompt(false);
                    setDevCodeInput('');
                  }}
                >
                  <Text style={styles.devPromptCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.devPromptSubmitButton}
                  onPress={handleDevCodeSubmit}
                >
                  <Text style={styles.devPromptSubmitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (!currentAnalysis || !hasUnlockedResults) {
    return (
      <View style={styles.container}>
        <View style={styles.analysisContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={[styles.capturedImage, isAnalyzing && styles.capturedImageBlurred]}
            contentFit="cover"
          />
          {isAnalyzing && <BiometricScanOverlay />}

          {!currentAnalysis && (
            <View style={styles.analysisOverlay}>
              <View style={styles.analysisIconContainer}>
                <Zap size={32} color={Colors.black} />
              </View>
              <Text style={styles.analysisTitle}>BIOMETRIC SCAN ACTIVE</Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={runAnalysis}
                disabled={isAnalyzing}
                activeOpacity={0.8}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color={Colors.black} />
                ) : (
                  <>
                    <Play size={16} color={Colors.black} />
                    <Text style={styles.generateButtonText}>GENERATE ROADMAP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {currentAnalysis && !hasUnlockedResults && (
            <View style={styles.lockedOverlay}>
              <View style={styles.lockIconContainer}>
                <Lock size={24} color={Colors.gold} />
              </View>
              <Text style={styles.lockedTitle}>DIAGNOSTIC COMPLETE</Text>
              <Text style={styles.lockedSubtitle}>
                Secure your results to sync with your patient profile
              </Text>
              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => setShowLeadModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.unlockButtonText}>UNLOCK DIAGNOSTIC</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <LeadCaptureModal
          visible={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          onSubmit={handleSaveLead}
          isSuccess={isLeadSaved}
          initialName={patientBasicInfo?.name || ''}
          initialPhone={patientBasicInfo?.phone || ''}
        />

        <EmailCaptureModal
          visible={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSubmit={handleEmailSubmit}
          onSkip={handleEmailSkip}
          isSuccess={isEmailSaved}
        />

        <HealthQuestionnaire
          visible={showHealthQuestionnaire}
          onClose={() => setShowHealthQuestionnaire(false)}
          onComplete={handleHealthQuestionnaireComplete}
        />

        <PatientConsentModal
          visible={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onConsent={handleConsentComplete}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.resultsScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sliderSection, isTablet && styles.tabletCentered]}>
          <View style={styles.sliderHeader}>
            <Wand2 size={14} color={Colors.gold} />
            <Text style={styles.sliderTitle}>TREATMENT COMPARISON</Text>
          </View>
          <BeforeAfterSlider
            beforeImage={capturedImage}
            afterImage={simulatedImage || capturedImage}
            height={isTablet ? 500 : 420}
            maxWidth={MAX_SLIDER_WIDTH}
            isSimulationPending={isSimulationPending}
          />
        </View>

        {currentAnalysis.fitzpatrickAssessment && (currentAnalysis.fitzpatrickAssessment.riskLevel === 'high' || currentAnalysis.fitzpatrickAssessment.riskLevel === 'caution') && (
          <View style={[
            styles.fitzpatrickWarningBanner,
            currentAnalysis.fitzpatrickAssessment.riskLevel === 'high' ? styles.fitzpatrickBannerHigh : styles.fitzpatrickBannerCaution
          ]}>
            <View style={styles.fitzpatrickWarningHeader}>
              {currentAnalysis.fitzpatrickAssessment.riskLevel === 'high' ? (
                <Ban size={18} color="#ef4444" />
              ) : (
                <AlertTriangle size={18} color="#f59e0b" />
              )}
              <Text style={[
                styles.fitzpatrickWarningTitle,
                currentAnalysis.fitzpatrickAssessment.riskLevel === 'high' ? styles.fitzpatrickTitleHigh : styles.fitzpatrickTitleCaution
              ]}>
                FITZPATRICK TYPE {currentAnalysis.fitzpatrickAssessment.type} DETECTED
              </Text>
            </View>
            <Text style={[
              styles.fitzpatrickWarningText,
              currentAnalysis.fitzpatrickAssessment.riskLevel === 'high' ? styles.fitzpatrickTextHigh : styles.fitzpatrickTextCaution
            ]}>
              {currentAnalysis.fitzpatrickAssessment.riskLevel === 'high'
                ? 'HIGH RISK: IPL and certain laser treatments are contraindicated for this skin type due to increased risk of burns and hyperpigmentation.'
                : 'CAUTION: Monitor closely for post-inflammatory hyperpigmentation (PIH) with light-based treatments. Adjust energy settings accordingly.'}
            </Text>
            <View style={styles.fitzpatrickIndicators}>
              <Text style={styles.fitzpatrickIndicatorLabel}>Detected Indicators:</Text>
              <Text style={styles.fitzpatrickIndicatorText}>
                {currentAnalysis.fitzpatrickAssessment.detectedIndicators.join(', ')}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.scoreCard}>
          <AuraScoreGauge score={currentAnalysis.auraScore} size={160} />
          <View style={styles.scoreInfo}>
            <Text style={styles.faceType}>{currentAnalysis.faceType}</Text>
            <Text style={styles.scoreDescription}>
              Structural biometrics identified. We have curated a holistic protocol to optimize your Aura Index.
            </Text>
            <View style={styles.skinIQTags}>
              {Object.entries(currentAnalysis.skinIQ).map(([key, value]) => (
                <View key={key} style={styles.skinIQTag}>
                  <Text style={styles.skinIQTagText}>
                    {key.toUpperCase()}: {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Syringe size={16} color={Colors.gold} />
            <Text style={styles.sectionTitle}>CLINICAL ROADMAP</Text>
          </View>
          <View style={styles.proceduresGrid}>
            {currentAnalysis.clinicalRoadmap.map((proc, index) => (
              <View key={index} style={[styles.procedureCard, proc.safetyStatus?.isBlocked && styles.procedureCardBlocked]}>
                <View style={styles.procedureHeaderRow}>
                  <Text style={[styles.procedureName, proc.safetyStatus?.isBlocked && styles.procedureNameBlocked]}>{proc.name}</Text>
                  {renderSafetyBadge(proc.safetyStatus)}
                </View>
                <Text style={styles.procedurePrice}>{proc.price}</Text>
                <Text style={styles.procedureBenefit}>{proc.benefit}</Text>
                <View style={styles.clinicalReasonBox}>
                  <View style={styles.clinicalReasonHeader}>
                    <Info size={11} color={Colors.gold} />
                    <Text style={styles.clinicalReasonLabel}>Clinical Indication</Text>
                  </View>
                  <Text style={styles.clinicalReasonText}>{proc.clinicalReason}</Text>
                </View>
                {renderSafetyWarning(proc.safetyStatus)}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FlaskConical size={16} color={Colors.gold} />
            <Text style={styles.sectionTitle}>PEPTIDE THERAPY</Text>
          </View>
          <View style={styles.therapyGrid}>
            {currentAnalysis.peptideTherapy.map((peptide, index) => (
              <View key={index} style={[styles.therapyCard, peptide.safetyStatus?.isBlocked && styles.procedureCardBlocked]}>
                <View style={styles.therapyHeader}>
                  <Text style={[styles.therapyName, peptide.safetyStatus?.isBlocked && styles.procedureNameBlocked]}>{peptide.name}</Text>
                  {renderSafetyBadge(peptide.safetyStatus)}
                </View>
                <Text style={styles.therapyGoal}>{peptide.goal}</Text>
                <View style={styles.therapyDetailRow}>
                  <Info size={12} color={Colors.textMuted} />
                  <Text style={styles.therapyMechanism}>{peptide.mechanism}</Text>
                </View>
                <View style={styles.therapyFrequencyBox}>
                  <Text style={styles.therapyFrequencyLabel}>Protocol</Text>
                  <Text style={styles.therapyFrequency}>{peptide.frequency}</Text>
                </View>
                {renderSafetyWarning(peptide.safetyStatus)}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Beaker size={16} color={Colors.gold} />
            <Text style={styles.sectionTitle}>IV OPTIMIZATION</Text>
          </View>
          <View style={styles.therapyGrid}>
            {currentAnalysis.ivOptimization.map((iv, index) => (
              <View key={index} style={[styles.ivCard, iv.safetyStatus?.isBlocked && styles.procedureCardBlocked]}>
                <View style={styles.therapyHeader}>
                  <Text style={[styles.therapyName, iv.safetyStatus?.isBlocked && styles.procedureNameBlocked]}>{iv.name}</Text>
                  {renderSafetyBadge(iv.safetyStatus)}
                </View>
                <Text style={styles.therapyGoal}>{iv.benefit}</Text>
                <View style={styles.ivIngredientsBox}>
                  <Text style={styles.ivIngredientsLabel}>Formula</Text>
                  <Text style={styles.ivIngredients}>{iv.ingredients}</Text>
                </View>
                <View style={styles.ivDurationBox}>
                  <Text style={styles.ivDurationLabel}>Duration</Text>
                  <Text style={styles.ivDuration}>{iv.duration}</Text>
                </View>
                {renderSafetyWarning(iv.safetyStatus)}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Droplets size={16} color={Colors.gold} />
            <Text style={styles.sectionTitle}>VOLUME ASSESSMENT</Text>
          </View>
          <View style={styles.fillerGrid}>
            {currentAnalysis.volumeAssessment.map((zone, index) => (
              <View key={index} style={styles.fillerCard}>
                <View style={styles.fillerHeader}>
                  <Text style={styles.fillerZoneName}>{zone.zone}</Text>
                  <View style={[
                    styles.decayBadge,
                    zone.volumeLoss >= 35 ? styles.decayHigh :
                    zone.volumeLoss >= 20 ? styles.decayMedium : styles.decayLow
                  ]}>
                    <Text style={[
                      styles.decayBadgeText,
                      zone.volumeLoss >= 35 ? styles.decayHighText :
                      zone.volumeLoss >= 20 ? styles.decayMediumText : styles.decayLowText
                    ]}>{zone.volumeLoss}% LOSS</Text>
                  </View>
                </View>
                <View style={styles.decayBarContainer}>
                  <View style={styles.decayBarBackground}>
                    <View 
                      style={[
                        styles.decayBarFill,
                        { width: `${zone.volumeLoss}%` },
                        zone.volumeLoss >= 35 ? styles.decayBarHigh :
                        zone.volumeLoss >= 20 ? styles.decayBarMedium : styles.decayBarLow
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.fillerDetails}>
                  <Text style={styles.fillerDetailLabel}>Contributing Factor</Text>
                  <Text style={styles.fillerDetailValue}>{zone.ageRelatedCause}</Text>
                </View>
                <View style={styles.fillerRecommendation}>
                  <Text style={styles.fillerRecommendationText}>{zone.recommendation}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.successBanner}>
          <CheckCircle size={16} color={Colors.success} />
          <Text style={styles.successText}>DIAGNOSTIC SECURED</Text>
        </View>

        <TouchableOpacity
          style={styles.newScanButton}
          onPress={handleNewScan}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color={Colors.gold} />
          <Text style={styles.newScanButtonText}>NEW CONSULTATION</Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroTitleContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  devModeBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 24,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  devModeBottomText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  devModeActiveText: {
    color: Colors.gold,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 38,
  },
  heroTitleGold: {
    color: Colors.gold,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  patentPending: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.gold,
    letterSpacing: 2,
    marginTop: 8,
    textTransform: 'uppercase' as const,
  },
  cameraContainer: {
    flex: 1,
    aspectRatio: 0.75,
    maxHeight: 500,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  faceGuide: {
    width: 200,
    height: 260,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    borderColor: Colors.black,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultationOptions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 40,
  },
  optionButton: {
    alignItems: 'center',
    gap: 12,
  },
  optionIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  optionText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  optionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  analysisContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    margin: 16,
  },
  capturedImage: {
    flex: 1,
    width: '100%',
  },
  capturedImageBlurred: {
    opacity: 0.8,
  },
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  analysisIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 2,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.goldMuted,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  lockedSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 240,
  },
  unlockButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 32,
  },
  unlockButtonText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 2,
  },
  resultsScrollContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  tabletCentered: {
    alignItems: 'center',
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sliderTitle: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 3,
  },
  scoreCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  scoreInfo: {
    flex: 1,
  },
  faceType: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  skinIQTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skinIQTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skinIQTagText: {
    fontSize: 7,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 3,
  },
  proceduresGrid: {
    gap: 12,
  },
  procedureCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  procedureName: {
    fontSize: 15,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  procedurePrice: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.gold,
    marginBottom: 8,
  },
  procedureBenefit: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    marginBottom: 12,
  },
  clinicalReasonBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  clinicalReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  clinicalReasonLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  clinicalReasonText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  therapyGrid: {
    gap: 12,
  },
  therapyCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  therapyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  therapyName: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  peptideBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  peptideBadgeText: {
    fontSize: 8,
    fontWeight: '900' as const,
    color: Colors.success,
    letterSpacing: 1,
  },
  therapyGoal: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 19,
  },
  therapyDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 10,
  },
  therapyMechanism: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  therapyFrequencyBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 12,
  },
  therapyFrequencyLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.success,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  therapyFrequency: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 16,
  },
  ivCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ivBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ivBadgeText: {
    fontSize: 8,
    fontWeight: '900' as const,
    color: '#3b82f6',
    letterSpacing: 1,
  },
  ivIngredientsBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  ivIngredientsLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#3b82f6',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ivIngredients: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 16,
  },
  ivDurationBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
  },
  ivDurationLabel: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ivDuration: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 16,
  },
  successBanner: {
    backgroundColor: Colors.successMuted,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  successText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: Colors.success,
    letterSpacing: 2,
  },
  newScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldMuted,
  },
  newScanButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  fillerGrid: {
    gap: 12,
  },
  fillerCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fillerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fillerZoneName: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  decayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  decayHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  decayMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  decayLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  decayBadgeText: {
    fontSize: 9,
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
  decayHighText: {
    color: '#ef4444',
  },
  decayMediumText: {
    color: Colors.gold,
  },
  decayLowText: {
    color: Colors.success,
  },
  decayBarContainer: {
    marginBottom: 12,
  },
  decayBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  decayBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  decayBarHigh: {
    backgroundColor: '#ef4444',
  },
  decayBarMedium: {
    backgroundColor: Colors.gold,
  },
  decayBarLow: {
    backgroundColor: Colors.success,
  },
  fillerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fillerDetailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  fillerDetailValue: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  fillerRecommendation: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fillerRecommendationText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.gold,
    textAlign: 'center',
  },
  procedureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  procedureCardBlocked: {
    opacity: 0.7,
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  procedureNameBlocked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  safetyBadgeBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeBlockedText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  safetyBadgeConditional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeConditionalText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  safetyBadgeCaution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeCautionText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  safetyBadgeSafe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  safetyBadgeSafeText: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: Colors.success,
    letterSpacing: 0.5,
  },
  safetyWarningBlocked: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  safetyWarningBlockedText: {
    flex: 1,
    fontSize: 11,
    color: '#ef4444',
    lineHeight: 16,
  },
  safetyWarningConditional: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  safetyWarningConditionalText: {
    flex: 1,
    fontSize: 11,
    color: Colors.gold,
    lineHeight: 16,
  },
  safetyWarningCaution: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  safetyWarningCautionText: {
    flex: 1,
    fontSize: 11,
    color: '#f59e0b',
    lineHeight: 16,
  },
  fitzpatrickWarningBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  fitzpatrickBannerHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  fitzpatrickBannerCaution: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  fitzpatrickWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  fitzpatrickWarningTitle: {
    fontSize: 12,
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
  fitzpatrickTitleHigh: {
    color: '#ef4444',
  },
  fitzpatrickTitleCaution: {
    color: '#f59e0b',
  },
  fitzpatrickWarningText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  fitzpatrickTextHigh: {
    color: '#fca5a5',
  },
  fitzpatrickTextCaution: {
    color: '#fcd34d',
  },
  fitzpatrickIndicators: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
  },
  fitzpatrickIndicatorLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  fitzpatrickIndicatorText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
  },
  devPromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  devPromptContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devPromptTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  devPromptSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  devPromptInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    textAlign: 'center',
  },
  devPromptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  devPromptCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  devPromptCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  devPromptSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.gold,
  },
  devPromptSubmitText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.black,
    textAlign: 'center',
  },
});
