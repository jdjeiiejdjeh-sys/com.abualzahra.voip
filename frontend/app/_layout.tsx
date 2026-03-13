import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, I18nManager } from 'react-native';

// Enable RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1565C0' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8f9fa' },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
