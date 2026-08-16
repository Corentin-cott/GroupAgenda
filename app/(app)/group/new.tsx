import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { createGroup } from '@/features/groups/api';
import { pbErrorMessage } from '@/lib/errors';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function NewGroupScreen() {
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Donne un nom au groupe.');
      return;
    }

    setPending(true);
    setError(null);
    try {
      const group = await createGroup(name);
      router.replace(`/group/${group.id}`);
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de créer le groupe.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen centered maxWidth={420}>
      <Stack.Screen options={{ title: 'Nouveau groupe' }} />

      <Text style={styles.title}>Nouveau groupe</Text>
      <Text style={styles.hint}>
        Tu en seras le premier membre. Tout le monde y aura les mêmes droits.
      </Text>

      <TextField
        label="Nom du groupe"
        placeholder="Colocation, Famille Dupont, Rando…"
        autoFocus
        autoCapitalize="sentences"
        value={name}
        onChangeText={setName}
        onSubmitEditing={onSubmit}
        error={error ?? undefined}
      />

      <PrimaryButton label="Créer le groupe" onPress={onSubmit} pending={pending} />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    title: theme.text.title,
    hint: { ...theme.text.meta, marginBottom: theme.space.sm },
  });
