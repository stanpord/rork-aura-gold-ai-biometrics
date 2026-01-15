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
import { Mail, ChevronRight, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface EmailCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  onSkip: () => void;
  isSuccess: boolean;
}

export default function EmailCaptureModal({
  visible,
  onClose,
  onSubmit,
  onSkip,
  isSuccess,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !isValidEmail(email.trim())) return;
    setIsLoading(true);
    try {
      await onSubmit(email.trim());
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
                <CheckCircle size={40} color={Colors.black} />
              </View>
              <Text style={styles.successTitle}>EMAIL SAVED</Text>
              <Text style={styles.successSubtitle}>
                Proceeding to analysis...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Mail size={28} color={Colors.gold} />
                </View>
                <Text style={styles.title}>ADD YOUR EMAIL</Text>
                <Text style={styles.subtitle}>
                  RECEIVE YOUR PERSONALIZED ANALYSIS RESULTS
                </Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, (!email || !isValidEmail(email)) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading || !email || !isValidEmail(email)}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.black} />
                ) : (
                  <>
                    <ChevronRight size={20} color={Colors.black} />
                    <Text style={styles.submitButtonText}>CONTINUE</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>SKIP FOR NOW</Text>
              </TouchableOpacity>
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
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
    textAlign: 'center',
  },
  form: {
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
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
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
