// app/_layout.jsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { initializeConnectivity } from '../services/connectivity';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InterRegular: Inter_400Regular,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });

  // Initialize connectivity monitoring on app start
  useEffect(() => {
    initializeConnectivity();
  }, []);

  // Prevent app from rendering until fonts load
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#FAFAFA' }} />;
  }

  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="index" />
        <Stack.Screen name="results" />
        <Stack.Screen name="login" />
        <Stack.Screen name="history" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="hotlines" />
        <Stack.Screen name="nearby" />
      </Stack>
    </>
  );
}