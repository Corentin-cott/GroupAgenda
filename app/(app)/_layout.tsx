import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Non connecté : on mémorise la destination pour y revenir après login.
  if (!isAuthenticated) {
    return <Redirect href={{ pathname: '/login', params: { redirect: pathname } }} />;
  }

  return <Stack screenOptions={{ headerShown: true }} />;
}
