import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ClinicLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (passcode: string) => boolean;
}

export default function ClinicLoginModal({
  visible,
  onClose,
  onLogin,
}: ClinicLoginModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    const success = onLogin(passcode);
    if (!success) {
      setError(true);
      setPasscode('');
      setTimeout(() => setError(false), 2000);
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
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lock size={32} color={Colors.gold} />
          </View>

          <Text style={styles.title}>Clinic Authentication</Text>
          <Text style={styles.subtitle}>STAFF ACCESS ONLY</Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Access Key"
            placeholderTextColor={Colors.textMuted}
            value={passcode}
            onChangeText={setPasscode}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={4}
            textAlign="center"
          />

          {error && (
            <Text style={styles.errorText}>Invalid Access Key</Text>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>AUTHENTICATE</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 32,
    padding: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: 6,
    marginBottom: 8,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: Colors.black,
    letterSpacing: 2,
  },
});
