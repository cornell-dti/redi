import { Stack } from 'expo-router';
import { NotificationsProvider } from '../contexts/NotificationsContext';

export default function AuthLayout() {
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
