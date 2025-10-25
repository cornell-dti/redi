import { Stack } from 'expo-router';
import { NotificationsProvider } from '../contexts/NotificationsContext';

export default function AuthLayout() {
  return (
    <NotificationsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="create-profile"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat-detail"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </NotificationsProvider>
  );
}
