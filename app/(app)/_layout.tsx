import { Redirect, Stack, usePathname } from 'expo-router';
import { headerOptions } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();

  // Non connecté : on mémorise la destination pour y revenir après login.
  if (!isAuthenticated) {
    return <Redirect href={{ pathname: '/login', params: { redirect: pathname } }} />;
  }

  return (
    <Stack
      screenOptions={{
        ...headerOptions(theme),
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
