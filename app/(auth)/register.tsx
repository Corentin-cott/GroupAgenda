import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { pbErrorMessage, pbFieldErrors } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

const MIN_PASSWORD_LENGTH = 8;

/** PocketBase répond en anglais : on traduit les cas courants. */
const FIELD_MESSAGES: Record<string, string> = {
  email: 'Cet email est invalide ou déjà utilisé.',
  password: `Mot de passe refusé : ${MIN_PASSWORD_LENGTH} caractères minimum.`,
  name: 'Ce nom est invalide.',
};

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const styles = useThemedStyles(createStyles);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const onSubmit = async () => {
    const localErrors: Record<string, string> = {};
    if (!email.trim()) localErrors.email = 'Email requis.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      localErrors.password = `${MIN_PASSWORD_LENGTH} caractères minimum.`;
    }
    if (password !== confirmation) {
      localErrors.confirmation = 'Les deux mots de passe diffèrent.';
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setPending(true);
    setErrors({});
    try {
      await signUp({ email, password, name });
      router.replace((redirect as Href | undefined) ?? '/');
    } catch (err) {
      const fields = pbFieldErrors(err);
      const translated = Object.fromEntries(
        Object.keys(fields).map((field) => [field, FIELD_MESSAGES[field] ?? fields[field]!]),
      );
      setErrors(Object.keys(translated).length > 0 ? translated : { form: pbErrorMessage(err) });
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen centered maxWidth={420}>
      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>De quoi rejoindre les agendas de tes proches.</Text>

      <TextField
        label="Nom"
        placeholder="Comment on t'appelle"
        autoCapitalize="words"
        autoComplete="name"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
      <TextField
        label="Email"
        placeholder="toi@exemple.fr"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <TextField
        label="Mot de passe"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />
      <TextField
        label="Confirmation"
        secureTextEntry
        autoComplete="new-password"
        value={confirmation}
        onChangeText={setConfirmation}
        onSubmitEditing={onSubmit}
        error={errors.confirmation}
      />

      {!!errors.form && <Text style={styles.error}>{errors.form}</Text>}

      <PrimaryButton label="Créer mon compte" onPress={onSubmit} pending={pending} />

      <Link
        href={{ pathname: '/login', params: redirect ? { redirect } : undefined }}
        style={styles.link}
      >
        J'ai déjà un compte
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
