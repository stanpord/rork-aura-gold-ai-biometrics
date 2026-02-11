import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

// ✅ DEFINE STYLES FIRST
const styles = StyleSheet.create({
  tabBar: {
    display: 'none', // Hide tabs for now
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
