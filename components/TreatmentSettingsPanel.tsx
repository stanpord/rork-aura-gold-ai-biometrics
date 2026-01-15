import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import {
  Syringe,
  Droplets,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  DollarSign,
  Check,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { TreatmentConfig } from '@/types';

interface TreatmentSettingsPanelProps {
  onClose?: () => void;
}

type CategoryType = 'procedure' | 'peptide' | 'iv';

const CATEGORY_INFO: Record<CategoryType, { label: string; icon: React.ReactNode; color: string }> = {
  procedure: { label: 'Procedures', icon: <Sparkles size={16} color={Colors.gold} />, color: Colors.gold },
  peptide: { label: 'Peptides', icon: <Syringe size={16} color="#8B5CF6" />, color: '#8B5CF6' },
  iv: { label: 'IV Drips', icon: <Droplets size={16} color="#06B6D4" />, color: '#06B6D4' },
};

export default function TreatmentSettingsPanel({ onClose }: TreatmentSettingsPanelProps) {
  const { treatmentConfigs, updateTreatmentConfig, toggleAllTreatments, resetTreatmentConfigs } = useApp();
  const [expandedCategories, setExpandedCategories] = useState<CategoryType[]>(['procedure']);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');

  const toggleCategory = useCallback((category: CategoryType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleToggleTreatment = useCallback((treatmentId: string, enabled: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateTreatmentConfig(treatmentId, { enabled });
  }, [updateTreatmentConfig]);

  const handleToggleAll = useCallback((category: CategoryType, enabled: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleAllTreatments(category, enabled);
  }, [toggleAllTreatments]);

  const handleStartEditPrice = useCallback((treatmentId: string, currentPrice: string) => {
    setEditingPrice(treatmentId);
    setTempPrice(currentPrice);
  }, []);

  const handleSavePrice = useCallback((treatmentId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    updateTreatmentConfig(treatmentId, { customPrice: tempPrice || undefined });
    setEditingPrice(null);
    setTempPrice('');
  }, [tempPrice, updateTreatmentConfig]);

  const handleCancelEditPrice = useCallback(() => {
    setEditingPrice(null);
    setTempPrice('');
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset All Settings',
      'This will reset all treatment toggles and pricing to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            resetTreatmentConfigs();
          },
        },
      ]
    );
  }, [resetTreatmentConfigs]);

  const getCategoryTreatments = useCallback((category: CategoryType): TreatmentConfig[] => {
    return treatmentConfigs.filter(t => t.category === category);
  }, [treatmentConfigs]);

  const getCategoryStats = useCallback((category: CategoryType) => {
    const treatments = getCategoryTreatments(category);
    const enabled = treatments.filter(t => t.enabled).length;
    return { total: treatments.length, enabled };
  }, [getCategoryTreatments]);

  const renderTreatmentRow = (treatment: TreatmentConfig) => {
    const isEditing = editingPrice === treatment.id;
    const displayPrice = treatment.customPrice || treatment.defaultPrice;
    const hasCustomPrice = !!treatment.customPrice;

    return (
      <View key={treatment.id} style={[styles.treatmentRow, !treatment.enabled && styles.treatmentRowDisabled]}>
        <View style={styles.treatmentInfo}>
          <View style={styles.treatmentNameRow}>
            <Text style={[styles.treatmentName, !treatment.enabled && styles.treatmentNameDisabled]}>
              {treatment.name}
            </Text>
            <Switch
              value={treatment.enabled}
              onValueChange={(value) => handleToggleTreatment(treatment.id, value)}
              trackColor={{ false: Colors.border, true: 'rgba(245, 158, 11, 0.4)' }}
              thumbColor={treatment.enabled ? Colors.gold : Colors.textMuted}
              ios_backgroundColor={Colors.border}
            />
          </View>
          
          <View style={styles.priceRow}>
            {isEditing ? (
              <View style={styles.priceEditContainer}>
                <TextInput
                  style={styles.priceInput}
                  value={tempPrice}
                  onChangeText={setTempPrice}
                  placeholder={treatment.defaultPrice}
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.priceActionButton}
                  onPress={() => handleSavePrice(treatment.id)}
                >
                  <Check size={16} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.priceActionButton}
                  onPress={handleCancelEditPrice}
                >
                  <X size={16} color={Colors.error || '#EF4444'} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.priceDisplay}
                onPress={() => handleStartEditPrice(treatment.id, displayPrice)}
                disabled={!treatment.enabled}
              >
                <DollarSign size={12} color={hasCustomPrice ? Colors.gold : Colors.textMuted} />
                <Text style={[
                  styles.priceText,
                  hasCustomPrice && styles.priceTextCustom,
                  !treatment.enabled && styles.priceTextDisabled,
                ]}>
                  {displayPrice}
                </Text>
                {hasCustomPrice && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>CUSTOM</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCategory = (category: CategoryType) => {
    const info = CATEGORY_INFO[category];
    const stats = getCategoryStats(category);
    const isExpanded = expandedCategories.includes(category);
    const treatments = getCategoryTreatments(category);
    const allEnabled = stats.enabled === stats.total;
    const noneEnabled = stats.enabled === 0;

    return (
      <View key={category} style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: `${info.color}15` }]}>
              {info.icon}
            </View>
            <View>
              <Text style={styles.categoryTitle}>{info.label}</Text>
              <Text style={styles.categoryStats}>
                {stats.enabled}/{stats.total} enabled
              </Text>
            </View>
          </View>
          <View style={styles.categoryRight}>
            <TouchableOpacity
              style={[
                styles.toggleAllButton,
                allEnabled ? styles.toggleAllButtonActive : styles.toggleAllButtonInactive,
              ]}
              onPress={() => handleToggleAll(category, !allEnabled)}
            >
              <Text style={[
                styles.toggleAllText,
                allEnabled ? styles.toggleAllTextActive : styles.toggleAllTextInactive,
              ]}>
                {allEnabled ? 'ALL ON' : noneEnabled ? 'ALL OFF' : 'MIXED'}
              </Text>
            </TouchableOpacity>
            {isExpanded ? (
              <ChevronUp size={20} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={20} color={Colors.textMuted} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.treatmentsList}>
            {treatments.map(renderTreatmentRow)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Treatment Settings</Text>
        <Text style={styles.headerSubtitle}>Configure available treatments & pricing</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(['procedure', 'peptide', 'iv'] as CategoryType[]).map(renderCategory)}

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={Colors.textMuted} />
          <Text style={styles.resetButtonText}>Reset All to Defaults</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  categoryStats: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleAllButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  toggleAllButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleAllText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  toggleAllTextActive: {
    color: Colors.gold,
  },
  toggleAllTextInactive: {
    color: Colors.textMuted,
  },
  treatmentsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  treatmentRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  treatmentRowDisabled: {
    opacity: 0.6,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    flex: 1,
    marginRight: 12,
  },
  treatmentNameDisabled: {
    color: Colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  priceText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  priceTextCustom: {
    color: Colors.gold,
  },
  priceTextDisabled: {
    color: Colors.textMuted,
  },
  customBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  customBadgeText: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  priceEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  priceInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.white,
  },
  priceActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
});
