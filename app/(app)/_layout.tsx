import { Redirect, Stack, router, usePathname } from 'expo-router';
import { BackButton, parentPath } from '@/components/BackButton';
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

  // Sur une URL ouverte directement, la pile est vide et aucun retour ne s'affiche.
  const fallback = parentPath(pathname);
  const needsFallback = !!fallback && !router.canGoBack();

  return (
    <Stack
      screenOptions={{
        ...headerOptions(theme),
        contentStyle: { backgroundColor: theme.colors.background },
        headerLeft: needsFallback ? () => <BackButton fallback={fallback} /> : undefined,
      }}
    />
  );
}
