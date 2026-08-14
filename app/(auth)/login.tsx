import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
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
      <Text style={styles.title}>Connexion</Text>

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

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '600', color: colors.text, marginBottom: 4 },
  error: { color: colors.danger },
  link: { color: colors.accent, textAlign: 'center', paddingVertical: 8 },
});
