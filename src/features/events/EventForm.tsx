import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DateTimeField } from '@/components/DateTimeField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedField } from '@/components/SegmentedField';
import { TextField } from '@/components/TextField';
import { nextRoundHour } from '@/lib/date';
import { pbErrorMessage } from '@/lib/errors';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { EventType } from '@/types/pocketbase';
import type { EventInput } from './api';

interface EventFormProps {
  initial?: EventInput;
  submitLabel: string;
  onSubmit(input: EventInput): Promise<void>;
  onCancel?(): void;
}

const TYPE_OPTIONS: { value: EventType; label: string; hint: string }[] = [
  { value: 'standard', label: 'Simple', hint: 'Visible par tout le groupe, sans inscription.' },
  { value: 'rsvp', label: 'Sur inscription', hint: "Chacun indique s'il vient." },
];

export function EventForm({ initial, submitLabel, onSubmit, onCancel }: EventFormProps) {
  const styles = useThemedStyles(createStyles);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? nextRoundHour());
  const [type, setType] = useState<EventType>(initial?.type ?? 'standard');
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
      await onSubmit({ title, startDate, type });
    } catch (err) {
      setFormError(pbErrorMessage(err, "Impossible d'enregistrer l'événement."));
      setPending(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Titre"
        placeholder="Dîner, week-end à la mer, répétition…"
        value={title}
        onChangeText={setTitle}
        error={titleError ?? undefined}
      />

      <DateTimeField label="Début" value={startDate} onChange={setStartDate} />

      <SegmentedField label="Type" value={type} options={TYPE_OPTIONS} onChange={setType} />

      {!!formError && <Text style={styles.error}>{formError}</Text>}

      <PrimaryButton label={submitLabel} onPress={submit} pending={pending} />

      {onCancel && (
        <Text style={styles.cancel} onPress={onCancel}>
          Annuler
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    form: { gap: theme.space.md + 2 },
    error: { ...theme.text.meta, color: theme.colors.danger },
    cancel: { ...theme.text.meta, textAlign: 'center', paddingVertical: theme.space.sm },
  });
