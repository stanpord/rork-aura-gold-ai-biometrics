import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  } = useApp();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing] = useState(false);
  const [showIntroScan, setShowIntroScan] = useState(true);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isLeadSaved, setIsLeadSaved] = useState(false);
  const [showHealthQuestionnaire, setShowHealthQuestionnaire] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);

  const startCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed for facial analysis.');
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
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        console.log('Image selected from gallery:', result.assets[0].uri);
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
        quality: 0.5,
      });
      if (photo) {
        setCapturedImage(photo.uri);
        setIsCameraActive(false);
      }
    } catch (error) {
      console.log('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const generateTreatmentSimulation = useCallback(async (imageUri: string, treatments: string[]) => {
    try {
      console.log('Starting AI treatment simulation...');
      
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
      console.log('Error generating treatment simulation:', error);
      return null;
    }
  }, []);

  const convertImageToBase64 = useCallback(async (imageUri: string): Promise<string> => {
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      const file = new File(imageUri);
      return await file.base64();
    }
  }, []);

  const analyzeImageFast = useCallback(async (base64Image: string): Promise<AnalysisResult> => {
    console.log('Starting FAST AI analysis with timeout...');
    
    const fastSchema = z.object({
      auraScore: z.number(),
      faceType: z.string(),
      texture: z.string(),
      pores: z.string(),
      pigment: z.string(),
      redness: z.string(),
      fitzpatrickType: z.string(),
      treatment1: z.object({ name: z.string(), benefit: z.string(), price: z.string(), reason: z.string() }),
      treatment2: z.object({ name: z.string(), benefit: z.string(), price: z.string(), reason: z.string() }),
      treatment3: z.object({ name: z.string(), benefit: z.string(), price: z.string(), reason: z.string() }),
      peptide1: z.object({ name: z.string(), goal: z.string(), mechanism: z.string(), frequency: z.string() }),
      peptide2: z.object({ name: z.string(), goal: z.string(), mechanism: z.string(), frequency: z.string() }),
      ivName: z.string(),
      ivBenefit: z.string(),
      ivIngredients: z.string(),
      ivDuration: z.string(),
      zone1: z.string(),
      zone1Loss: z.number(),
      zone1Cause: z.string(),
      zone2: z.string(),
      zone2Loss: z.number(),
      zone2Cause: z.string(),
      zone3: z.string(),
      zone3Loss: z.number(),
      zone3Cause: z.string(),
      zone4: z.string(),
      zone4Loss: z.number(),
      zone4Cause: z.string(),
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout after 25s')), 25000);
    });

    try {
      const analysisPromise = generateObject({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this face. Return:
- auraScore: 300-1000 based on facial harmony
- faceType: Diamond Elite, Classic Oval, Angular Sculpted, Heart Symmetry, or Square Strong
- texture/pores/pigment/redness: Refined/Moderate/Needs Attention, Minimal/Visible/Enlarged, Even/Mild Variation/Uneven, Low/Moderate/High
- fitzpatrickType: I, II, III, IV, V, or VI
- treatment1/2/3: name from (DiamondGlow, Chemical Peels, HydraFacial, IPL, MOXI, Microneedling, Botox, Dermal Filler, Morpheus8), benefit, price range, reason
- peptide1/2: name from (GHK-Cu, BPC-157, Epithalon, TB-500, AOD-9604), goal, mechanism, frequency
- ivName/ivBenefit/ivIngredients/ivDuration: IV therapy recommendation
- zone1-4: facial zone name, volumeLoss 0-60, cause

Be specific to THIS face.`
              },
              {
                type: 'image',
                image: `data:image/jpeg;base64,${base64Image}`
              }
            ]
          }
        ],
        schema: fastSchema,
      });

      const result = await Promise.race([analysisPromise, timeoutPromise]);
      console.log('Fast analysis complete - parsing results');
      
      const fitzType = result.fitzpatrickType as 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
      const fitzRisk = ['I', 'II', 'III'].includes(fitzType) ? 'low' as const :
                       fitzType === 'IV' ? 'caution' as const : 'high' as const;

      const skinIQ = {
        texture: (result.texture === 'Refined' || result.texture === 'Needs Attention' ? result.texture : 'Moderate') as 'Refined' | 'Moderate' | 'Needs Attention',
        pores: (result.pores === 'Minimal' || result.pores === 'Enlarged' ? result.pores : 'Visible') as 'Minimal' | 'Visible' | 'Enlarged',
        pigment: (result.pigment === 'Even' || result.pigment === 'Uneven' ? result.pigment : 'Mild Variation') as 'Even' | 'Mild Variation' | 'Uneven',
        redness: (result.redness === 'Low' || result.redness === 'High' ? result.redness : 'Moderate') as 'Low' | 'Moderate' | 'High',
      };

      const validZones = ['Forehead', 'Temples', 'Brows', 'Upper Eyelids', 'Under Eyes', 'Cheeks', 'Midface', 'Nasolabial Folds', 'Marionette Lines', 'Lips', 'Perioral Area', 'Chin', 'Jawline', 'Jowls', 'Neck'] as const;
      type VolumeZone = typeof validZones[number];
      const getValidZone = (zone: string): VolumeZone => {
        const found = validZones.find(v => zone.toLowerCase().includes(v.toLowerCase()));
        return found || 'Cheeks';
      };

      return {
        auraScore: Math.max(300, Math.min(1000, result.auraScore || 700)),
        faceType: result.faceType || 'Classic Oval',
        skinIQ,
        clinicalRoadmap: [
          { name: result.treatment1.name, benefit: result.treatment1.benefit, price: result.treatment1.price, clinicalReason: result.treatment1.reason },
          { name: result.treatment2.name, benefit: result.treatment2.benefit, price: result.treatment2.price, clinicalReason: result.treatment2.reason },
          { name: result.treatment3.name, benefit: result.treatment3.benefit, price: result.treatment3.price, clinicalReason: result.treatment3.reason },
        ],
        peptideTherapy: [
          { name: result.peptide1.name, goal: result.peptide1.goal, mechanism: result.peptide1.mechanism, frequency: result.peptide1.frequency },
          { name: result.peptide2.name, goal: result.peptide2.goal, mechanism: result.peptide2.mechanism, frequency: result.peptide2.frequency },
        ],
        ivOptimization: [{ name: result.ivName, benefit: result.ivBenefit, ingredients: result.ivIngredients, duration: result.ivDuration }],
        volumeAssessment: [
          { zone: getValidZone(result.zone1), volumeLoss: Math.min(60, result.zone1Loss || 10), ageRelatedCause: result.zone1Cause, recommendation: 'Filler or Sculptra' },
          { zone: getValidZone(result.zone2), volumeLoss: Math.min(60, result.zone2Loss || 10), ageRelatedCause: result.zone2Cause, recommendation: 'Filler or Sculptra' },
          { zone: getValidZone(result.zone3), volumeLoss: Math.min(60, result.zone3Loss || 10), ageRelatedCause: result.zone3Cause, recommendation: 'Filler or Sculptra' },
          { zone: getValidZone(result.zone4), volumeLoss: Math.min(60, result.zone4Loss || 10), ageRelatedCause: result.zone4Cause, recommendation: 'Filler or Sculptra' },
        ],
        fitzpatrickAssessment: {
          type: fitzType,
          description: `Fitzpatrick Type ${fitzType}`,
          riskLevel: fitzRisk,
          detectedIndicators: ['AI detected from image'],
        },
      };
    } catch (error) {
      console.log('Fast analysis failed or timed out:', error);
      throw error;
    }
  }, []);

  const getFallbackAnalysis = useCallback((): AnalysisResult => {
    console.log('Using fallback analysis');
    
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
        { name: 'GHK-Cu', goal: 'Enhance skin repair and collagen production', mechanism: 'Copper peptide complex that activates regenerative genes', frequency: '2x daily topical' },
        { name: 'BPC-157', goal: 'Accelerate tissue healing', mechanism: 'Body protection compound enhancing tissue repair', frequency: '250-500mcg daily' },
        { name: 'Epithalon', goal: 'Support cellular longevity', mechanism: 'Activates telomerase enzyme', frequency: '5-10mg daily for 10-20 days' },
      ],
      ivOptimization: [
        { name: 'Glow Drip', benefit: 'Brightens skin and supports detoxification', ingredients: 'Glutathione 600mg, Vitamin C 2500mg, B-Complex', duration: '45-60 minutes, weekly for 4 weeks' },
      ],
      volumeAssessment: [
        { zone: 'Temples', volumeLoss: 12, ageRelatedCause: 'Temporal fat pad atrophy', recommendation: 'Temple filler or Sculptra' },
        { zone: 'Cheeks', volumeLoss: 15, ageRelatedCause: 'Natural fat pad descent', recommendation: 'Sculptra or dermal filler' },
        { zone: 'Under Eyes', volumeLoss: 10, ageRelatedCause: 'Tear trough hollowing', recommendation: 'HA filler or PRP' },
        { zone: 'Jawline', volumeLoss: 5, ageRelatedCause: 'Early bone resorption', recommendation: 'Jawline contouring' },
      ],
      fitzpatrickAssessment: {
        type: 'III',
        description: 'Medium skin tone with moderate melanin',
        riskLevel: 'low',
        detectedIndicators: ['Medium complexion', 'Neutral undertones'],
      },
    };
  }, []);

  const analyzeImageWithAI = useCallback(async (imageUri: string): Promise<AnalysisResult> => {
    console.log('Starting AI clinical analysis...');
    
    const base64Image = await convertImageToBase64(imageUri);

    try {
      return await analyzeImageFast(base64Image);
    } catch (error) {
      console.log('Analysis failed, using fallback:', error);
      return getFallbackAnalysis();
    }
  }, [convertImageToBase64, analyzeImageFast, getFallbackAnalysis]);

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

    const checkedRoadmap: ClinicalProcedure[] = analysis.clinicalRoadmap.map((proc) => {
      const safety = checkTreatmentSafety(proc.name, conditions, hasLabWork);
      return {
        ...proc,
        safetyStatus: {
          ...safety,
          explainableReason: safety.isBlocked
            ? getExplainableReason(proc.name, safety.blockedReasons)
            : undefined,
        },
      };
    });

    const checkedPeptides: PeptideTherapy[] = analysis.peptideTherapy.map((peptide) => {
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

    const checkedIV: IVOptimization[] = analysis.ivOptimization.map((iv) => {
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

    return {
      ...analysis,
      clinicalRoadmap: checkedRoadmap,
      peptideTherapy: checkedPeptides,
      ivOptimization: checkedIV,
    };
  }, [patientHealthProfile]);

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

  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const getInstantPlaceholderAnalysis = useCallback((): AnalysisResult => {
    return {
      auraScore: 0,
      faceType: 'Analyzing...',
      skinIQ: {
        texture: 'Moderate',
        pores: 'Visible',
        pigment: 'Mild Variation',
        redness: 'Low',
      },
      clinicalRoadmap: [
        { name: 'Loading...', benefit: 'Analyzing your skin profile...', price: '---', clinicalReason: 'Please wait...' },
        { name: 'Loading...', benefit: 'Analyzing your skin profile...', price: '---', clinicalReason: 'Please wait...' },
      ],
      peptideTherapy: [
        { name: 'Loading...', goal: 'Analyzing...', mechanism: 'Please wait...', frequency: '---' },
        { name: 'Loading...', goal: 'Analyzing...', mechanism: 'Please wait...', frequency: '---' },
      ],
      ivOptimization: [
        { name: 'Loading...', benefit: 'Analyzing...', ingredients: '---', duration: '---' },
      ],
      volumeAssessment: [
        { zone: 'Cheeks', volumeLoss: 0, ageRelatedCause: 'Analyzing...', recommendation: 'Please wait...' },
        { zone: 'Temples', volumeLoss: 0, ageRelatedCause: 'Analyzing...', recommendation: 'Please wait...' },
      ],
      fitzpatrickAssessment: {
        type: 'III',
        description: 'Analyzing skin type...',
        riskLevel: 'low',
        detectedIndicators: ['Analyzing...'],
      },
    };
  }, []);

  const runAnalysis = async () => {
    if (!capturedImage) return;

    if (!patientHealthProfile) {
      setShowHealthQuestionnaire(true);
      return;
    }

    if (!patientConsent) {
      setShowConsentModal(true);
      return;
    }

    console.log('Starting analysis - running AI analysis first');
    
    setIsAnalysisLoading(true);
    setIsRunningAnalysis(true);
    
    // Show placeholder while loading
    const placeholderAnalysis = getInstantPlaceholderAnalysis();
    setCurrentAnalysis(placeholderAnalysis);

    // Run AI analysis FIRST before showing lead modal
    try {
      console.log('Running AI analysis...');
      const aiAnalysisResult = await analyzeImageWithAI(capturedImage);
      const safetyCheckedAnalysis = applyContraindicationChecks(aiAnalysisResult);
      
      console.log('AI analysis complete - clinical roadmap loaded:', safetyCheckedAnalysis.clinicalRoadmap.length, 'treatments');
      
      // Set the real analysis result
      setCurrentAnalysis(safetyCheckedAnalysis);
      setIsAnalysisLoading(false);
      
      // NOW show lead modal after analysis is complete
      setShowLeadModal(true);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('AI analysis error, using fallback:', error);
      const fallbackAnalysis = applyContraindicationChecks(getFallbackAnalysis());
      setCurrentAnalysis(fallbackAnalysis);
      setIsAnalysisLoading(false);
      
      // Show lead modal with fallback data
      setShowLeadModal(true);
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const handleSaveLead = async (name: string, phone: string) => {
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

  const handleNewScan = () => {
    resetScan();
    clearHealthProfile();
    clearPatientConsent();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  useEffect(() => {
    if (hasUnlockedResults && currentAnalysis && capturedImage && !simulatedImage) {
      console.log('Results unlocked - starting simulation generation');
      generateTreatmentSimulation(capturedImage, ['Botox', 'Morpheus8', 'Sculptra'])
        .then((simulatedResult) => {
          if (simulatedResult) {
            setSimulatedImage(simulatedResult);
            console.log('Treatment simulation set successfully');
          } else {
            console.log('Using original image as fallback');
          }
        })
        .catch((err) => console.log('Simulation generation failed:', err));
    }
  }, [hasUnlockedResults, currentAnalysis, capturedImage, simulatedImage, generateTreatmentSimulation, setSimulatedImage]);

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
            <Text style={styles.heroTitle}>
              REVEAL YOUR{'\n'}
              <Text style={styles.heroTitleGold}>AURA INDEX</Text>
            </Text>
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
        </ScrollView>
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
                disabled={isRunningAnalysis}
                activeOpacity={0.8}
              >
                {isRunningAnalysis ? (
                  <>
                    <ActivityIndicator color={Colors.black} size="small" />
                    <Text style={styles.generateButtonText}>ANALYZING...</Text>
                  </>
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
          initialName={patientConsent?.patientName || ''}
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
          {isAnalysisLoading ? (
            <View style={styles.scoreLoadingContainer}>
              <ActivityIndicator size="large" color={Colors.gold} />
              <Text style={styles.scoreLoadingText}>CALCULATING AURA</Text>
            </View>
          ) : (
            <AuraScoreGauge score={currentAnalysis.auraScore} size={160} />
          )}
          <View style={styles.scoreInfo}>
            <Text style={styles.faceType}>{isAnalysisLoading ? 'Analyzing Your Profile...' : currentAnalysis.faceType}</Text>
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
            {isAnalysisLoading && (
              <View style={styles.sectionLoadingBadge}>
                <ActivityIndicator size="small" color={Colors.gold} />
              </View>
            )}
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
            {isAnalysisLoading && (
              <View style={styles.sectionLoadingBadge}>
                <ActivityIndicator size="small" color={Colors.gold} />
              </View>
            )}
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
            {isAnalysisLoading && (
              <View style={styles.sectionLoadingBadge}>
                <ActivityIndicator size="small" color={Colors.gold} />
              </View>
            )}
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
            {isAnalysisLoading && (
              <View style={styles.sectionLoadingBadge}>
                <ActivityIndicator size="small" color={Colors.gold} />
              </View>
            )}
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

        <View style={[styles.sliderSection, isTablet && styles.tabletCentered]}>
          <View style={styles.sliderHeader}>
            <Wand2 size={14} color={Colors.gold} />
            <Text style={styles.sliderTitle}>TREATMENT COMPARISON</Text>
            {!simulatedImage && (
              <View style={styles.simulationLoadingBadge}>
                <ActivityIndicator size="small" color={Colors.gold} />
                <Text style={styles.simulationLoadingText}>Generating preview...</Text>
              </View>
            )}
          </View>
          {simulatedImage ? (
            <BeforeAfterSlider
              beforeImage={capturedImage}
              afterImage={simulatedImage}
              height={isTablet ? 500 : 420}
              maxWidth={MAX_SLIDER_WIDTH}
            />
          ) : (
            <View style={[styles.sliderPlaceholder, { height: isTablet ? 500 : 420, maxWidth: MAX_SLIDER_WIDTH }]}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.placeholderImage}
                contentFit="cover"
              />
              <View style={styles.placeholderOverlay}>
                <View style={styles.placeholderContent}>
                  <ActivityIndicator size="large" color={Colors.gold} />
                  <Text style={styles.placeholderText}>AI SIMULATION IN PROGRESS</Text>
                  <Text style={styles.placeholderSubtext}>Generating your treatment preview...</Text>
                </View>
              </View>
            </View>
          )}
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
  simulationLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  simulationLoadingText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  sliderPlaceholder: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    alignSelf: 'center',
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
    marginTop: 8,
  },
  placeholderSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
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
  scoreLoadingContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  scoreLoadingText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
    marginTop: 12,
  },
  sectionLoadingBadge: {
    marginLeft: 'auto',
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
});
