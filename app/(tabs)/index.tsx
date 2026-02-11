import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

// ✅ STEP 1: DEFINE STYLES FIRST (THIS IS CRITICAL!)
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background || '#000',
    borderTopWidth: 0,
    elevation: 0,
    height: 80,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
});

// ✅ STEP 2: NOW USE THE STYLES
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.gold || '#F59E0B',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: styles.tabBar, // ✅ Now this works!
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarLabelStyle: styles.tabLabel, // ✅ This works too!
          tabBarIcon: ({ color }) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
              <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2"/>
            </svg>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color }) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2"/>
              <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={color} strokeWidth="2"/>
            </svg>
          ),
        }}
      />
    </Tabs>
  );
}
