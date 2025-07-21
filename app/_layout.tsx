import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

export default function RootLayout() {
  const [loaded] = useFonts({});

  if (!loaded) {
    return null;
  }

  return (
    <React.Fragment>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </React.Fragment>
  );
}
