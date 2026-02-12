import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { X, Sparkles, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import AuraScoreGauge from '@/components/AuraScoreGauge';

interface TreatmentVisualizationModalProps {
  visible: boolean;
  onClose: () => void;
  treatmentName: string;
  originalImage: string;
}

const TREATMENT_PROMPTS: Record<string, string> = {
  'Botox': `Transform this face to show natural Botox results:
- Completely smooth forehead lines - make the forehead appear glass-smooth with zero horizontal lines
- Eliminate frown lines (11s) between the eyebrows completely
- Soften crow's feet around the eyes significantly
- Keep natural facial expressions and movement capability appearance
- Skin should look refreshed but not frozen
- Maintain the exact same person, lighting, background, and hair
- The result should look like a premium aesthetic treatment, natural and refreshed`,

  'Morpheus8': `Transform this face to show Morpheus8 RF microneedling results:
- Dramatically tighten and lift sagging skin, especially along jawline and jowls
- Create a more defined, sculpted jawline contour
- Lift and tighten neck skin, reducing any laxity
- Improve skin texture making it appear smoother and more refined
- Reduce the appearance of fine lines throughout
- Add a healthy, glowing quality to the skin
- Maintain the exact same person, lighting, background, and hair`,

  'Dermal Filler': `Transform this face to show dermal filler results:
- Add natural-looking volume to cheeks, creating fuller, more youthful contours
- Soften nasolabial folds (smile lines) significantly
- Fill in any under-eye hollows or tear troughs
- Enhance lip volume subtly for a more plump, hydrated appearance
- Restore youthful facial proportions with enhanced volume
- Maintain natural appearance - not overfilled
- Keep the exact same person, lighting, background, and hair`,

  'Sculptra': `Transform this face to show Sculptra collagen stimulation results:
- Restore overall facial volume loss for a more youthful appearance
- Fill in temple hollowing
- Enhance cheek volume naturally
- Improve skin quality with a more supple, healthy appearance
- Lift and support sagging areas through volume restoration
- Create a gradual, natural-looking rejuvenation
- Maintain the exact same person, lighting, background, and hair`,

  'DiamondGlow': `Transform this face to show DiamondGlow results:
- Create dramatically glowing, luminous skin
- Refine skin texture to appear poreless and smooth
- Even out skin tone completely
- Remove any dullness - skin should appear radiant
- Enhance skin clarity and brightness
- Give a "glass skin" appearance
- Maintain the exact same person, lighting, background, and hair`,

  'Chemical Peels': `Transform this face to show chemical peel results:
- Dramatically improve skin texture to appear smooth and refined
- Even out skin tone and remove discoloration
- Reduce visible pores significantly
- Remove any rough or dull patches
- Create a fresh, renewed appearance
- Add healthy radiance to the complexion
- Maintain the exact same person, lighting, background, and hair`,

  'Stellar IPL': `Transform this face to show Stellar IPL treatment results:
- Remove all visible sun spots and age spots
- Eliminate any redness, rosacea, or broken capillaries
- Even out skin tone dramatically
- Create a clear, uniform complexion
- Reduce any visible pigmentation issues
- Give skin a clear, bright appearance
- Maintain the exact same person, lighting, background, and hair`,

  'IPL': `Transform this face to show IPL treatment results:
- Clear sun damage and brown spots completely
- Reduce redness and vascular concerns
- Even skin tone throughout the face
- Improve overall skin clarity
- Remove any hyperpigmentation
- Create a more uniform, clear complexion
- Maintain the exact same person, lighting, background, and hair`,

  'Clear + Brilliant': `Transform this face to show Clear + Brilliant laser results:
- Refine skin texture to appear smoother
- Minimize pore appearance
- Create a subtle glow and radiance
- Improve early signs of aging
- Even out minor tone irregularities
- Give skin a refreshed, youthful quality
- Maintain the exact same person, lighting, background, and hair`,

  'MOXI Laser': `Transform this face to show MOXI laser treatment results:
- Dramatically improve skin tone and texture
- Reduce early sun damage and pigmentation
- Create smoother, more refined skin
- Add healthy radiance and glow
- Minimize fine lines
- Give a revitalized, youthful appearance
- Maintain the exact same person, lighting, background, and hair`,

  'Microneedling': `Transform this face to show microneedling results:
- Improve skin texture significantly - smoother and more refined
- Reduce visible pores
- Soften fine lines and wrinkles
- Create a more even skin surface
- Enhance skin's natural collagen appearance
- Add firmness and elasticity to the skin
- Maintain the exact same person, lighting, background, and hair`,

  'HydraFacial': `Transform this face to show HydraFacial results:
- Create deeply hydrated, plump skin
- Add intense glow and radiance
- Clear and refine pores
- Even out skin tone
- Remove any congestion or dullness
- Give skin a healthy, dewy appearance
- Maintain the exact same person, lighting, background, and hair`,

  'Lip Filler': `Transform this face to show lip filler results:
- Enhance lip volume naturally - fuller but not overdone
- Define lip borders and cupid's bow
- Create symmetrical, balanced lips
- Add hydrated, plump appearance to lips
- Reduce any fine lines around the mouth
- Maintain natural lip shape while enhancing
- Keep the exact same person, lighting, background, and hair`,

  'default': `Transform this face to show aesthetic treatment results:
- Improve overall skin quality and texture
- Create a more youthful, refreshed appearance
- Even out skin tone
- Add healthy radiance and glow
- Maintain natural facial features
- The person should look like themselves but refreshed
- Keep the exact same lighting, background, and hair`,
};

export default function TreatmentVisualizationModal({
  visible,
  onClose,
  treatmentName,
  originalImage,
}: TreatmentVisualizationModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
  const [showAfter, setShowAfter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auraScore, setAuraScore] = useState<number | null>(null);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const generateTreatmentVisualization = useCallback(async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setError(null);
    setSimulatedImage(null);
    setAuraScore(null);

    try {
      console.log(`Generating ${treatmentName} visualization...`);
      
      let base64Image = '';
      
      if (Platform.OS === 'web') {
        const response = await fetch(originalImage);
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
        const FileSystem = await import('expo-file-system');
        const fileContent = await FileSystem.readAsStringAsync(originalImage, {
          encoding: 'base64' as any,
        });
        base64Image = fileContent;
      }

      const prompt = TREATMENT_PROMPTS[treatmentName] || TREATMENT_PROMPTS['default'];
      
      console.log(`Using prompt for ${treatmentName}`);
      
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.image?.base64Data) {
        const imageUri = `data:${result.image.mimeType};base64,${result.image.base64Data}`;
        setSimulatedImage(imageUri);
        setShowAfter(true);
        
        // Generate aura score after successful visualization
        const calculatedScore = Math.floor(Math.random() * 400) + 600; // Random score 600-1000 for demo
        setAuraScore(calculatedScore);
        
        console.log(`${treatmentName} visualization generated successfully`);
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error('No image data returned');
      }
    } catch (err) {
      console.log('Visualization generation error:', err);
      setError('Unable to generate preview. Please try again.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [originalImage, treatmentName]);

  useEffect(() => {
    if (visible && originalImage && !simulatedImage && !isGenerating) {
      generateTreatmentVisualization();
    }
  }, [visible, originalImage, simulatedImage, isGenerating, generateTreatmentVisualization]);

  useEffect(() => {
    if (!visible) {
      setSimulatedImage(null);
      setShowAfter(false);
      setError(null);
      setAuraScore(null);
    }
  }, [visible]);

  const toggleView = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setShowAfter(!showAfter);
    }, 150);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [showAfter, fadeAnim]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.surface]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Sparkles size={16} color={Colors.gold} />
              <Text style={styles.headerTitle}>YOUR RESULTS</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.treatmentBadge}>
            <Text style={styles.treatmentBadgeText}>{treatmentName.toUpperCase()}</Text>
          </View>

          {/* Add Aura Score Gauge here - only show when we have a score */}
          {auraScore !== null && (
            <View style={styles.auraScoreContainer}>
              <AuraScoreGauge score={auraScore} />
            </View>
          )}

          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.imageContainer}>
              {isGenerating ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingImageWrapper}>
                    <Image
                      source={{ uri: originalImage }}
                      style={styles.loadingImage}
                      contentFit="cover"
                    />
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color={Colors.gold} />
                      <Text style={styles.loadingText}>Generating your preview...</Text>
                      <Text style={styles.loadingSubtext}>AI is visualizing {treatmentName} results</Text>
                    </View>
                  </View>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Image
                    source={{ uri: originalImage }}
                    style={styles.errorImage}
                    contentFit="cover"
                  />
                  <View style={styles.errorOverlay}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={generateTreatmentVisualization}
                      activeOpacity={0.8}
                    >
                      <RefreshCw size={16} color={Colors.black} />
                      <Text style={styles.retryButtonText}>TRY AGAIN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.comparisonContainer}>
                  <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
                    <Image
                      source={{ uri: showAfter && simulatedImage ? simulatedImage : originalImage }}
                      style={styles.comparisonImage}
                      contentFit="cover"
                    />
                    <View style={styles.labelBadge}>
                      <Text style={styles.labelText}>{showAfter ? 'AFTER' : 'BEFORE'}</Text>
                    </View>
                  </Animated.View>

                  {simulatedImage && (
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[styles.toggleButton, !showAfter && styles.toggleButtonActive]}
                        onPress={() => !showAfter || toggleView()}
                        activeOpacity={0.8}
                      >
                        <ChevronLeft size={16} color={!showAfter ? Colors.black : Colors.gold} />
                        <Text style={[styles.toggleButtonText, !showAfter && styles.toggleButtonTextActive]}>
                          BEFORE
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.toggleButton, showAfter && styles.toggleButtonActive]}
                        onPress={() => showAfter || toggleView()}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toggleButtonText, showAfter && styles.toggleButtonTextActive]}>
                          AFTER
                        </Text>
                        <ChevronRight size={16} color={showAfter ? Colors.black : Colors.gold} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                AI-generated visualization for illustrative purposes only. Actual results may vary based on individual factors.
              </Text>
            </View>

            {simulatedImage && (
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={generateTreatmentVisualization}
                activeOpacity={0.8}
              >
                <RefreshCw size={16} color={Colors.gold} />
                <Text style={styles.regenerateButtonText}>REGENERATE PREVIEW</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 3,
  },
  placeholder: {
    width: 44,
  },
  treatmentBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 24,
  },
  treatmentBadgeText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  auraScoreContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  loadingImage: {
    flex: 1,
    opacity: 0.4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    position: 'relative',
  },
  errorImage: {
    flex: 1,
    opacity: 0.3,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  comparisonContainer: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  comparisonImage: {
    flex: 1,
  },
  labelBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  toggleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  toggleButtonActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  toggleButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  toggleButtonTextActive: {
    color: Colors.black,
  },
  disclaimerContainer: {
    marginTop: 20,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    marginBottom: 20,
  },
  regenerateButtonText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
  },
});
