import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DateTimeField } from '@/components/DateTimeField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { nextRoundHour } from '@/lib/date';
import { pbErrorMessage } from '@/lib/errors';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { PersonalEventInput } from './api';

interface PersonalEventFormProps {
  initial?: PersonalEventInput;
  submitLabel: string;
  onSubmit(input: PersonalEventInput): Promise<void>;
  onCancel?(): void;
}

export function PersonalEventForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: PersonalEventFormProps) {
  const styles = useThemedStyles(createStyles);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? nextRoundHour());
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      setTitleError("Donne un titre à l'événement.");
      return;
    }

    setPending(true);
    setTitleError(null);
    setFormError(null);
    try {
      await onSubmit({ title, startDate });
    } catch (err) {
      setFormError(pbErrorMessage(err, "Impossible d'enregistrer l'événement."));
      setPending(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.hint}>
        Visible de toi seul. Les autres verront un créneau occupé, sans le titre.
      </Text>

      <TextField
        label="Titre"
        placeholder="Rendez-vous, cours, déplacement…"
        value={title}
        onChangeText={setTitle}
        error={titleError ?? undefined}
      />

      <DateTimeField label="Début" value={startDate} onChange={setStartDate} />

      {!!formError && <Text style={styles.error}>{formError}</Text>}

      <PrimaryButton label={submitLabel} onPress={submit} pending={pending} />
      {onCancel && <PrimaryButton label="Annuler" variant="outline" onPress={onCancel} />}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    form: { gap: theme.space.md },
    hint: theme.text.meta,
    error: { ...theme.text.meta, color: theme.colors.danger },
  });
