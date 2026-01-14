import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Shield, ChevronRight, ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LeadCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => Promise<void>;
  isSuccess: boolean;
  initialName?: string;
}

export default function LeadCaptureModal({
  visible,
  onClose,
  onSubmit,
  isSuccess,
  initialName = '',
}: LeadCaptureModalProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');

  React.useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit(name.trim(), phone.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.backdrop} />
        <View style={styles.content}>
          <View style={styles.glowEffect} />

          {isSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <ShieldCheck size={40} color={Colors.black} />
              </View>
              <Text style={styles.successTitle}>DIAGNOSTIC UNLOCKED</Text>
              <Text style={styles.successSubtitle}>
                Identity verified. Syncing records...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>SYNC YOUR{'\n'}AURA INDEX</Text>
                <Text style={styles.subtitle}>
                  SECURE CLINICAL ROADMAP & PATIENT PROFILE
                </Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, (!name || !phone) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading || !name || !phone}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.black} />
                ) : (
                  <>
                    <ChevronRight size={20} color={Colors.black} />
                    <Text style={styles.submitButtonText}>SAVE DIAGNOSTIC</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.securityBadge}>
                <Shield size={12} color={Colors.textMuted} />
                <Text style={styles.securityText}>SECURE ENCRYPTION</Text>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 200,
    backgroundColor: Colors.goldMuted,
    borderRadius: 150,
    opacity: 0.3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: 12,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  submitButton: {
    backgroundColor: Colors.gold,
    borderRadius: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    opacity: 0.5,
  },
  securityText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
