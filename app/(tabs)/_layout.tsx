import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Sparkles, LayoutDashboard, Lock } from 'lucide-react-native';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import ClinicLoginModal from '@/components/ClinicLoginModal';

/* -----------------------------
   STYLES DEFINED FIRST
   (Prevents TDZ initialization bug)
------------------------------ */

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface || '#1F2937',
    borderTopColor: Colors.border || '#374151',
    borderTopWidth: 1,
    paddingTop: 8,
    height: 88,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    backgroundColor: Colors.background || '#000000',
    borderBottomColor: Colors.border || '#374151',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white || '#FFFFFF',
    letterSpacing: 2,
  },
  headerButtonLeft: {
    marginLeft: 16,
    padding: 8,
  },
});

/* -----------------------------
   COMPONENT
------------------------------ */

export default function TabLayout() {
  const { isStaffAuthenticated, authenticateStaff } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = async (passcode: string): Promise<boolean> => {
    try {
      const success = await authenticateStaff(passcode);
      if (success) {
        setShowLoginModal(false);
      }
      return success;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.gold || '#F59E0B',
          tabBarInactiveTintColor: Colors.textMuted || '#9CA3AF',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: Colors.white || '#FFFFFF',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Scan',
            headerTitle: 'AURA AI BIOMETRICS',
            tabBarIcon: ({ color, size }) => (
              <Sparkles size={size} color={color} />
            ),
            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerButtonLeft}
                onPress={() => setShowLoginModal(true)}
                accessibilityLabel="Open clinic login"
              >
                <Lock
                  size={18}
                  color={
                    isStaffAuthenticated
                      ? Colors.gold || '#F59E0B'
                      : Colors.textMuted || '#9CA3AF'
                  }
                />
              </TouchableOpacity>
            ),
          }}
        />

        <Tabs.Screen
          name="clinic"
          options={{
            title: 'Clinic',
            headerTitle: 'ADMIN PORTAL',
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} />
            ),
            tabBarBadge: isStaffAuthenticated ? undefined : '🔒',
            tabBarBadgeStyle: {
              backgroundColor: Colors.error || '#EF4444',
              color: Colors.white || '#FFFFFF',
            },
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
