import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Clock, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SessionWarningBannerProps {
  timeRemaining: number | null;
  showWarning: boolean;
  onExtendSession: () => void;
}

export default function SessionWarningBanner({
  timeRemaining,
  showWarning,
  onExtendSession,
}: SessionWarningBannerProps) {
  if (!showWarning || timeRemaining === null) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Animated.View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.warningSection}>
          <View style={styles.iconContainer}>
            <Clock size={16} color={Colors.warning} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.warningTitle}>SESSION EXPIRING</Text>
            <Text style={styles.warningText}>
              Auto-logout in <Text style={styles.timeText}>{timeString}</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.extendButton}
          onPress={onExtendSession}
          activeOpacity={0.8}
        >
          <RefreshCw size={14} color={Colors.black} />
          <Text style={styles.extendButtonText}>EXTEND</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.hipaaNote}>
        <Text style={styles.hipaaText}>
          HIPAA Compliance: Sessions auto-expire after 15 minutes of inactivity
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.warning,
    letterSpacing: 1,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  timeText: {
    fontWeight: '900' as const,
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  extendButtonText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.black,
    letterSpacing: 1,
  },
  hipaaNote: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  hipaaText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
