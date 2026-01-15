import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Sparkles, LayoutDashboard, Lock } from 'lucide-react-native';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import ClinicLoginModal from '@/components/ClinicLoginModal';

export default function TabLayout() {
  const { isStaffAuthenticated, authenticateStaff } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = (passcode: string): boolean => {
    const success = authenticateStaff(passcode);
    if (success) {
      setShowLoginModal(false);
    }
    return success;
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.gold,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: Colors.white,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Scan',
            headerTitle: 'AURA AI BIOMETRICS',
            tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerButtonLeft}
                onPress={() => setShowLoginModal(true)}
              >
                <Lock size={18} color={isStaffAuthenticated ? Colors.gold : Colors.textMuted} />
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="clinic"
          options={{
            title: 'Clinic',
            headerTitle: 'ADMIN PORTAL',
            tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
            tabBarBadge: isStaffAuthenticated ? undefined : '🔒',
          }}
        />
      </Tabs>

      <ClinicLoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    height: 88,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  header: {
    backgroundColor: Colors.background,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.white,
    letterSpacing: 2,
  },
  headerButtonLeft: {
    marginLeft: 16,
    padding: 8,
  },
});
