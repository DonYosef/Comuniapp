import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import Chatbot from '../src/components/Chatbot';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <Chatbot />
    </AuthProvider>
  );
}
