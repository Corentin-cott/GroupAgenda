import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  if (isAuthenticated) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
