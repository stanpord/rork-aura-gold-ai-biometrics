import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  tabBar: {
    display: 'none',
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
      <Tabs.Screen name="clinic" />
    </Tabs>
  );
}
