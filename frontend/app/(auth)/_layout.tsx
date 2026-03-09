import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { NotificationsProvider } from '../contexts/NotificationsContext';

export default function AuthLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <NotificationsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default', // Use default iOS slide animation
        }}
      >
        <Stack.Screen
          name="create-profile"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </NotificationsProvider>
  );
}
