import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Shield,
  AlertTriangle,
  ChevronRight,
  Check,
  FileText,
  Heart,
  Pill,
  AlertCircle,
  Activity,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { HEALTH_CONDITIONS } from '@/constants/contraindications';
import { PatientHealthProfile } from '@/types';

interface HealthQuestionnaireProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (profile: PatientHealthProfile) => void;
}

const CATEGORIES = [
  { id: 'medical', label: 'Medical Conditions', icon: Heart },
  { id: 'medication', label: 'Current Medications', icon: Pill },
  { id: 'allergy', label: 'Allergies', icon: AlertCircle },
  { id: 'lifestyle', label: 'Recent Treatments', icon: Activity },
];

export default function HealthQuestionnaire({
  visible,
  onClose,
  onComplete,
}: HealthQuestionnaireProps) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [hasLabWork, setHasLabWork] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const toggleCondition = useCallback((conditionId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedConditions((prev) =>
      prev.includes(conditionId)
        ? prev.filter((id) => id !== conditionId)
        : [...prev, conditionId]
    );
  }, []);

  const handleComplete = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const profile: PatientHealthProfile = {
      conditions: selectedConditions,
      hasRecentLabWork: hasLabWork === true,
      completedAt: new Date(),
    };
    onComplete(profile);
  }, [selectedConditions, hasLabWork, onComplete]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < CATEGORIES.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const renderCategoryConditions = (categoryId: string) => {
    const conditions = HEALTH_CONDITIONS.filter((c) => c.category === categoryId);
    
    return (
      <View style={styles.conditionsList}>
        {conditions.map((condition) => (
          <TouchableOpacity
            key={condition.id}
            style={[
              styles.conditionItem,
              selectedConditions.includes(condition.id) && styles.conditionItemSelected,
              condition.severity === 'absolute' && styles.conditionItemAbsolute,
            ]}
            onPress={() => toggleCondition(condition.id)}
            activeOpacity={0.7}
          >
            <View style={styles.conditionContent}>
              {condition.severity === 'absolute' && (
                <AlertTriangle size={14} color="#ef4444" style={styles.warningIcon} />
              )}
              <Text
                style={[
                  styles.conditionLabel,
                  selectedConditions.includes(condition.id) && styles.conditionLabelSelected,
                ]}
              >
                {condition.label}
              </Text>
            </View>
            <View
              style={[
                styles.checkbox,
                selectedConditions.includes(condition.id) && styles.checkboxSelected,
              ]}
            >
              {selectedConditions.includes(condition.id) && (
                <Check size={12} color={Colors.black} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderLabWorkStep = () => (
    <View style={styles.labWorkContainer}>
      <View style={styles.labWorkHeader}>
        <FileText size={32} color={Colors.gold} />
        <Text style={styles.labWorkTitle}>Recent Lab Work</Text>
        <Text style={styles.labWorkSubtitle}>
          Some treatments (Peptides, IV Drips) require recent blood work (CBC/CMP) for safe recommendation.
        </Text>
      </View>

      <View style={styles.labWorkOptions}>
        <TouchableOpacity
          style={[
            styles.labWorkOption,
            hasLabWork === true && styles.labWorkOptionSelected,
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setHasLabWork(true);
          }}
          activeOpacity={0.7}
        >
          <Check size={20} color={hasLabWork === true ? Colors.black : Colors.gold} />
          <Text
            style={[
              styles.labWorkOptionText,
              hasLabWork === true && styles.labWorkOptionTextSelected,
            ]}
          >
            Yes, I have recent lab work (within 6 months)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.labWorkOption,
            hasLabWork === false && styles.labWorkOptionSelected,
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setHasLabWork(false);
          }}
          activeOpacity={0.7}
        >
          <X size={20} color={hasLabWork === false ? Colors.black : Colors.textMuted} />
          <Text
            style={[
              styles.labWorkOptionText,
              hasLabWork === false && styles.labWorkOptionTextSelected,
            ]}
          >
            No, I do not have recent lab work
          </Text>
        </TouchableOpacity>
      </View>

      {hasLabWork === false && (
        <View style={styles.labWorkNotice}>
          <AlertTriangle size={14} color={Colors.gold} />
          <Text style={styles.labWorkNoticeText}>
            Peptide and IV therapy recommendations will be conditional pending lab review.
          </Text>
        </View>
      )}
    </View>
  );

  const currentCategory = CATEGORIES[currentStep];
  const isLastStep = currentStep === CATEGORIES.length;
  const progress = ((currentStep + 1) / (CATEGORIES.length + 1)) * 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Shield size={18} color={Colors.gold} />
            <Text style={styles.headerTitle}>HEALTH SCREENING</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {CATEGORIES.length + 1}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {!isLastStep ? (
            <>
              <View style={styles.categoryHeader}>
                {currentCategory && (
                  <>
                    <View style={styles.categoryIconContainer}>
                      <currentCategory.icon size={24} color={Colors.gold} />
                    </View>
                    <Text style={styles.categoryTitle}>{currentCategory.label}</Text>
                    <Text style={styles.categorySubtitle}>
                      Select any that apply to you
                    </Text>
                  </>
                )}
              </View>
              {currentCategory && renderCategoryConditions(currentCategory.id)}
            </>
          ) : (
            renderLabWorkStep()
          )}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>BACK</Text>
            </TouchableOpacity>
          )}

          {!isLastStep ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.gold, Colors.goldDark]}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>CONTINUE</Text>
                <ChevronRight size={16} color={Colors.black} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, hasLabWork === null && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={hasLabWork === null}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={hasLabWork !== null ? [Colors.gold, Colors.goldDark] : ['#555', '#444']}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>COMPLETE SCREENING</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This screening helps ensure safe treatment recommendations. Always consult with a qualified provider.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: 2,
  },
  placeholder: {
    width: 36,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  categoryHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  conditionsList: {
    gap: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionItemSelected: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  conditionItemAbsolute: {
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  conditionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIcon: {
    marginRight: 4,
  },
  conditionLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  conditionLabelSelected: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  labWorkContainer: {
    alignItems: 'center',
  },
  labWorkHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  labWorkTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 12,
    marginBottom: 8,
  },
  labWorkSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  labWorkOptions: {
    width: '100%',
    gap: 12,
  },
  labWorkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  labWorkOptionSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold,
  },
  labWorkOptionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  labWorkOptionTextSelected: {
    color: Colors.black,
    fontWeight: '600' as const,
  },
  labWorkNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  labWorkNoticeText: {
    fontSize: 12,
    color: Colors.gold,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  nextButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  disclaimer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});
