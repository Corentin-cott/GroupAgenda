import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';

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
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.action}>
        {pending ? <ActivityIndicator /> : <Button title="Se connecter" onPress={onSubmit} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 8, padding: 12 },
  error: { color: '#c0392b' },
  action: { minHeight: 44, justifyContent: 'center' },
});
