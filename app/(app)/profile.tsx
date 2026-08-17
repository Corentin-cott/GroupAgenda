import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { removeAvatar, updateAvatar, updateName } from '@/features/account/api';
import { pbErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function ProfileScreen() {
  const { user, reload } = useAuth();
  const styles = useThemedStyles(createStyles);

  const [name, setName] = useState(user?.name ?? '');
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const onSaveName = async () => {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await updateName(user.id, name);
      await reload();
      setNotice('Nom mis à jour.');
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de mettre à jour le nom.'));
    } finally {
      setPending(false);
    }
  };

  const onPickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Accès aux photos refusé. L'autorisation se règle dans les paramètres du système.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      await updateAvatar(user.id, asset);
      await reload();
      setNotice('Photo mise à jour.');
    } catch (err) {
      setError(pbErrorMessage(err, "Impossible d'envoyer la photo."));
    } finally {
      setUploading(false);
    }
  };

  const onRemoveAvatar = async () => {
    setUploading(true);
    setError(null);
    try {
      await removeAvatar(user.id);
      await reload();
      setNotice('Photo retirée.');
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de retirer la photo.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Profil' }} />

      <View style={styles.identity}>
        <Avatar user={user} size={88} />
        <View style={styles.avatarActions}>
          <Pressable onPress={onPickAvatar} disabled={uploading} hitSlop={8}>
            <Text style={styles.action}>{uploading ? 'Envoi…' : 'Changer la photo'}</Text>
          </Pressable>
          {!!user.avatar && (
            <Pressable onPress={onRemoveAvatar} disabled={uploading} hitSlop={8}>
              <Text style={[styles.action, styles.danger]}>Retirer</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.form}>
        <TextField
          label="Nom"
          placeholder="Comment on t'appelle"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          onSubmitEditing={onSaveName}
        />

        <View>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton
          label="Enregistrer"
          onPress={onSaveName}
          pending={pending}
          disabled={name.trim() === (user.name ?? '')}
        />
      </View>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    identity: { alignItems: 'center', gap: theme.space.sm, marginBottom: theme.space.lg },
    avatarActions: { flexDirection: 'row', gap: theme.space.lg },
    action: { ...theme.text.body, color: theme.colors.accent },
    danger: { color: theme.colors.danger },
    form: { gap: theme.space.md },
    label: theme.text.label,
    email: { ...theme.text.body, marginTop: theme.space.xs },
    notice: { ...theme.text.meta, color: theme.colors.accent },
    error: { ...theme.text.meta, color: theme.colors.danger },
  });
