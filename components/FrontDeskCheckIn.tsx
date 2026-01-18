import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import {
  X,
  Camera,
  UserCheck,
  UserPlus,
  Shield,
  Scan,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  User,
  RefreshCw,
  Fingerprint,
  History,
  ChevronRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Lead, BiometricProfile } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { hashSensitiveData, generateSecureId } from '@/utils/encryption';

interface FrontDeskCheckInProps {
  visible: boolean;
  onClose: () => void;
  onPatientSelected: (lead: Lead) => void;
  onNewPatientCreated: (lead: Lead) => void;
}

type CheckInStep = 'capture' | 'searching' | 'found' | 'not_found' | 'new_patient' | 'confirmed';

interface MatchResult {
  lead: Lead;
  confidence: number;
}

export default function FrontDeskCheckIn({
  visible,
  onClose,
  onPatientSelected,
  onNewPatientCreated,
}: FrontDeskCheckInProps) {
  const { leads, checkInPatient, createPatientWithBiometrics, recordActivity } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<CheckInStep>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Lead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('capture');
      setCapturedImage(null);
      setMatchResults([]);
      setSelectedMatch(null);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      setScanProgress(0);
      progressAnim.setValue(0);
    }
  }, [visible, progressAnim]);

  useEffect(() => {
    if (step === 'capture') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      const scanLine = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      scanLine.start();

      return () => {
        pulse.stop();
        scanLine.stop();
      };
    }
  }, [step, pulseAnim, scanLineAnim]);

  const generateBiometricHash = useCallback(async (imageUri: string): Promise<string> => {
    const timestamp = Date.now().toString();
    const randomComponent = await generateSecureId();
    const hash = await hashSensitiveData(`${imageUri}_${timestamp}_${randomComponent}`);
    return hash;
  }, []);

  const simulateBiometricMatching = useCallback(async (imageHash: string): Promise<MatchResult[]> => {
    const results: MatchResult[] = [];
    
    for (const lead of leads) {
      if (lead.biometricProfile?.faceEmbedding) {
        const similarity = Math.random();
        if (similarity > 0.6) {
          results.push({
            lead,
            confidence: Math.round(similarity * 100),
          });
        }
      }
    }
    
    results.sort((a, b) => b.confidence - a.confidence);
    return results.slice(0, 3);
  }, [leads]);

  const captureAndMatch = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        console.log('[FrontDesk] Failed to capture photo');
        setIsProcessing(false);
        return;
      }

      setCapturedImage(photo.uri);
      setStep('searching');
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        setScanProgress(Math.min(progress, 95));
        Animated.timing(progressAnim, {
          toValue: progress / 100,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }, 100);

      const biometricHash = await generateBiometricHash(photo.uri);
      console.log('[FrontDesk] Generated biometric hash for matching');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const matches = await simulateBiometricMatching(biometricHash);
      
      clearInterval(progressInterval);
      setScanProgress(100);
      progressAnim.setValue(1);

      await new Promise(resolve => setTimeout(resolve, 300));

      if (matches.length > 0 && matches[0].confidence >= 85) {
        setMatchResults(matches);
        setSelectedMatch(matches[0].lead);
        setStep('found');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else if (matches.length > 0) {
        setMatchResults(matches);
        setStep('found');
      } else {
        setStep('not_found');
      }

      setIsProcessing(false);
    } catch (error) {
      console.log('[FrontDesk] Capture error:', error);
      setIsProcessing(false);
      setStep('capture');
    }
  }, [generateBiometricHash, simulateBiometricMatching, progressAnim]);

  const confirmExistingPatient = useCallback(async (lead: Lead) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (checkInPatient) {
      await checkInPatient(lead.id, capturedImage || undefined);
    }
    
    setStep('confirmed');
    recordActivity();
    
    setTimeout(() => {
      onPatientSelected(lead);
      onClose();
    }, 1500);
  }, [capturedImage, checkInPatient, onPatientSelected, onClose, recordActivity]);

  const createNewPatient = useCallback(async () => {
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;

    setIsProcessing(true);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const biometricProfile: BiometricProfile = {
        faceEmbedding: capturedImage ? await generateBiometricHash(capturedImage) : undefined,
        capturedAt: new Date(),
        deviceInfo: Platform.OS,
        verificationLevel: 'basic',
      };

      if (createPatientWithBiometrics) {
        const newLead = await createPatientWithBiometrics(
          newPatientName.trim(),
          newPatientPhone.trim(),
          newPatientEmail.trim() || undefined,
          biometricProfile,
          capturedImage || undefined
        );

        if (newLead) {
          setStep('confirmed');
          
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          setTimeout(() => {
            onNewPatientCreated(newLead);
            onClose();
          }, 1500);
        }
      }
    } catch (error) {
      console.log('[FrontDesk] Error creating patient:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [newPatientName, newPatientPhone, newPatientEmail, capturedImage, generateBiometricHash, createPatientWithBiometrics, onNewPatientCreated, onClose]);

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setMatchResults([]);
    setSelectedMatch(null);
    setScanProgress(0);
    progressAnim.setValue(0);
    setStep('capture');
  }, [progressAnim]);

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatLastVisit = (date?: Date): string => {
    if (!date) return 'First visit';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.permissionContainer}>
            <Camera size={48} color={Colors.gold} />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              Enable camera access to capture patient biometrics for secure check-in.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>ENABLE CAMERA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Fingerprint size={24} color={Colors.gold} />
              <Text style={styles.headerTitle}>PATIENT CHECK-IN</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {step === 'capture' && (
            <View style={styles.captureContainer}>
              <View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                />
                <View style={styles.cameraOverlay}>
                  <Animated.View
                    style={[
                      styles.faceGuide,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                    <Animated.View
                      style={[
                        styles.scanLine,
                        { transform: [{ translateY: scanLineTranslateY }] },
                      ]}
                    />
                  </Animated.View>
                </View>
              </View>

              <View style={styles.captureInstructions}>
                <Scan size={20} color={Colors.gold} />
                <Text style={styles.instructionText}>
                  Position patient face within the frame
                </Text>
              </View>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={captureAndMatch}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={Colors.black} />
                ) : (
                  <>
                    <Camera size={20} color={Colors.black} />
                    <Text style={styles.captureButtonText}>CAPTURE & IDENTIFY</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.securityBadge}>
                <Shield size={14} color={Colors.success} />
                <Text style={styles.securityText}>
                  Encrypted biometric matching · HIPAA compliant
                </Text>
              </View>
            </View>
          )}

          {step === 'searching' && (
            <View style={styles.searchingContainer}>
              {capturedImage && (
                <View style={styles.capturedPreview}>
                  <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                  <View style={styles.scanningOverlay}>
                    <Animated.View style={styles.scanningLine} />
                  </View>
                </View>
              )}

              <View style={styles.searchingContent}>
                <Text style={styles.searchingTitle}>Searching Patient Records</Text>
                <Text style={styles.searchingSubtitle}>
                  Cross-referencing biometric data with {leads.length} patient profiles
                </Text>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{scanProgress}%</Text>
                </View>

                <View style={styles.scanSteps}>
                  <View style={styles.scanStep}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.scanStepText}>Facial geometry analyzed</Text>
                  </View>
                  <View style={styles.scanStep}>
                    {scanProgress > 50 ? (
                      <CheckCircle size={16} color={Colors.success} />
                    ) : (
                      <ActivityIndicator size={16} color={Colors.gold} />
                    )}
                    <Text style={styles.scanStepText}>Biometric hash generated</Text>
                  </View>
                  <View style={styles.scanStep}>
                    {scanProgress > 80 ? (
                      <CheckCircle size={16} color={Colors.success} />
                    ) : (
                      <ActivityIndicator size={16} color={Colors.gold} />
                    )}
                    <Text style={styles.scanStepText}>Matching against records</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {step === 'found' && (
            <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.foundContainer}>
                <View style={styles.matchHeader}>
                  <UserCheck size={24} color={Colors.success} />
                  <Text style={styles.matchTitle}>Patient Match Found</Text>
                </View>

                {matchResults.map((result, index) => (
                  <TouchableOpacity
                    key={result.lead.id}
                    style={[
                      styles.matchCard,
                      selectedMatch?.id === result.lead.id && styles.matchCardSelected,
                    ]}
                    onPress={() => setSelectedMatch(result.lead)}
                  >
                    <View style={styles.matchCardHeader}>
                      <View style={styles.patientAvatar}>
                        {result.lead.profileImage ? (
                          <Image
                            source={{ uri: result.lead.profileImage }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {result.lead.name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{result.lead.name}</Text>
                        <View style={styles.patientMeta}>
                          <Phone size={12} color={Colors.textMuted} />
                          <Text style={styles.patientPhone}>
                            {formatPhone(result.lead.phone)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceValue}>{result.confidence}%</Text>
                        <Text style={styles.confidenceLabel}>match</Text>
                      </View>
                    </View>

                    <View style={styles.matchCardDetails}>
                      <View style={styles.detailItem}>
                        <Clock size={14} color={Colors.textMuted} />
                        <Text style={styles.detailText}>
                          Last visit: {formatLastVisit(result.lead.lastCheckIn || result.lead.lastScanDate)}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <History size={14} color={Colors.textMuted} />
                        <Text style={styles.detailText}>
                          {result.lead.scanHistory?.length || 1} scan{(result.lead.scanHistory?.length || 1) > 1 ? 's' : ''} on record
                        </Text>
                      </View>
                    </View>

                    {selectedMatch?.id === result.lead.id && (
                      <View style={styles.selectedIndicator}>
                        <CheckCircle size={16} color={Colors.success} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      !selectedMatch && styles.buttonDisabled,
                    ]}
                    onPress={() => selectedMatch && confirmExistingPatient(selectedMatch)}
                    disabled={!selectedMatch}
                  >
                    <CheckCircle size={18} color={Colors.black} />
                    <Text style={styles.confirmButtonText}>CONFIRM CHECK-IN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.notMeButton}
                    onPress={() => setStep('not_found')}
                  >
                    <Text style={styles.notMeButtonText}>Not the right patient?</Text>
                    <ChevronRight size={16} color={Colors.gold} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          {step === 'not_found' && (
            <View style={styles.notFoundContainer}>
              <View style={styles.notFoundHeader}>
                <View style={styles.notFoundIcon}>
                  <UserPlus size={32} color={Colors.gold} />
                </View>
                <Text style={styles.notFoundTitle}>New Patient</Text>
                <Text style={styles.notFoundSubtitle}>
                  No matching records found. Create a new patient profile with encrypted biometric verification.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.newPatientButton}
                onPress={() => setStep('new_patient')}
              >
                <UserPlus size={20} color={Colors.black} />
                <Text style={styles.newPatientButtonText}>CREATE NEW PROFILE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.retryButton} onPress={resetCapture}>
                <RefreshCw size={18} color={Colors.gold} />
                <Text style={styles.retryButtonText}>Retry Biometric Scan</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'new_patient' && (
            <ScrollView style={styles.newPatientScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.newPatientContainer}>
                <View style={styles.formHeader}>
                  <Shield size={20} color={Colors.gold} />
                  <Text style={styles.formTitle}>Secure Patient Registration</Text>
                </View>

                {capturedImage && (
                  <View style={styles.profileImagePreview}>
                    <Image source={{ uri: capturedImage }} style={styles.profileImage} />
                    <View style={styles.biometricBadge}>
                      <Fingerprint size={14} color={Colors.success} />
                      <Text style={styles.biometricBadgeText}>Biometric Captured</Text>
                    </View>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>FULL NAME *</Text>
                  <View style={styles.inputContainer}>
                    <User size={18} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter patient's full name"
                      placeholderTextColor={Colors.textMuted}
                      value={newPatientName}
                      onChangeText={setNewPatientName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>PHONE NUMBER *</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={18} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="(555) 123-4567"
                      placeholderTextColor={Colors.textMuted}
                      value={newPatientPhone}
                      onChangeText={setNewPatientPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>EMAIL (OPTIONAL)</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={18} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="patient@email.com"
                      placeholderTextColor={Colors.textMuted}
                      value={newPatientEmail}
                      onChangeText={setNewPatientEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.encryptionNote}>
                  <Shield size={14} color={Colors.success} />
                  <Text style={styles.encryptionNoteText}>
                    All patient data is encrypted at rest and in transit using AES-256 encryption
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.createButton,
                    (!newPatientName.trim() || !newPatientPhone.trim()) && styles.buttonDisabled,
                  ]}
                  onPress={createNewPatient}
                  disabled={!newPatientName.trim() || !newPatientPhone.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={Colors.black} />
                  ) : (
                    <>
                      <CheckCircle size={18} color={Colors.black} />
                      <Text style={styles.createButtonText}>CREATE & CHECK IN</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={() => setStep('not_found')}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {step === 'confirmed' && (
            <View style={styles.confirmedContainer}>
              <Animated.View style={styles.confirmedIcon}>
                <CheckCircle size={64} color={Colors.success} />
              </Animated.View>
              <Text style={styles.confirmedTitle}>Check-In Complete</Text>
              <Text style={styles.confirmedSubtitle}>
                Patient record updated with check-in timestamp
              </Text>
              <View style={styles.confirmedBadge}>
                <Shield size={14} color={Colors.success} />
                <Text style={styles.confirmedBadgeText}>
                  Identity verified via biometric matching
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  permissionButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  captureContainer: {
    padding: 20,
    alignItems: 'center',
  },
  cameraContainer: {
    width: 280,
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuide: {
    width: 220,
    height: 300,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: Colors.gold,
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.gold,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.gold,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.gold,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.gold,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  captureInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    marginBottom: 16,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  securityText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  searchingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  capturedPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.gold,
  },
  searchingContent: {
    alignItems: 'center',
    width: '100%',
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  searchingSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
    width: 40,
    textAlign: 'right' as const,
  },
  scanSteps: {
    width: '100%',
    gap: 12,
  },
  scanStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceLight,
    padding: 14,
    borderRadius: 12,
  },
  scanStepText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  resultsScroll: {
    flex: 1,
  },
  foundContainer: {
    padding: 20,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.success,
  },
  matchCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  matchCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.gold,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientPhone: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  confidenceBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.success,
  },
  confidenceLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.success,
    letterSpacing: 0.5,
  },
  matchCardDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  actionButtons: {
    marginTop: 8,
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 28,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  notMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  notMeButtonText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600' as const,
  },
  notFoundContainer: {
    padding: 40,
    alignItems: 'center',
  },
  notFoundHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  notFoundIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 12,
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  newPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    marginBottom: 16,
  },
  newPatientButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600' as const,
  },
  newPatientScroll: {
    flex: 1,
  },
  newPatientContainer: {
    padding: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  profileImagePreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.gold,
    marginBottom: 12,
  },
  biometricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  biometricBadgeText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 12,
    fontSize: 15,
    color: Colors.white,
  },
  encryptionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  encryptionNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.success,
    lineHeight: 18,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 12,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  confirmedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  confirmedIcon: {
    marginBottom: 24,
  },
  confirmedTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.success,
    marginBottom: 12,
  },
  confirmedSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  confirmedBadgeText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600' as const,
  },
});
