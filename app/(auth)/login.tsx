import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const styles = useThemedStyles(createStyles);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async () => {
    setPending(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace((redirect as Href | undefined) ?? '/');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen centered maxWidth={420}>
      <Text style={styles.title}>Bon retour</Text>
      <Text style={styles.subtitle}>Retrouve les agendas de tes groupes.</Text>

      <TextField
        label="Email"
        placeholder="toi@exemple.fr"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Mot de passe"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Se connecter" onPress={onSubmit} pending={pending} />

      <Link
        href={{ pathname: '/register', params: redirect ? { redirect } : undefined }}
        style={styles.link}
      >
        Créer un compte
      </Link>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    title: theme.text.title,
    subtitle: { ...theme.text.meta, marginBottom: theme.space.sm },
    error: { ...theme.text.meta, color: theme.colors.danger },
    link: {
      ...theme.text.body,
      color: theme.colors.accent,
      textAlign: 'center',
      paddingVertical: theme.space.sm,
    },
  });
