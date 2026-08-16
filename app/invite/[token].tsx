import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import {
  InviteError,
  acceptInvite,
  fetchInvitePreview,
  type InvitePreview,
} from '@/features/groups/api';
import { parsePbDate } from '@/lib/date';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

type Status = 'loading' | 'ready' | 'joining' | 'failed';

const ERROR_MESSAGES: Record<string, string> = {
  'not-found': "Ce lien d'invitation n'existe pas ou a été révoqué.",
  expired: "Ce lien d'invitation a expiré. Demande à un membre du groupe d'en générer un nouveau.",
  network: 'Impossible de contacter le serveur. Vérifie ta connexion.',
};

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const styles = useThemedStyles(createStyles);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorReason, setErrorReason] = useState<string>('network');

  // L'aperçu ne demande pas de session : on ne renvoie vers le login qu'une
  // fois le lien reconnu valide. `user` en dépendance -> `alreadyMember` est
  // recalculé au retour de connexion.
  useEffect(() => {
    if (!token || isAuthLoading) return;
    let active = true;
    setStatus('loading');

    void (async () => {
      try {
        const data = await fetchInvitePreview(token);
        if (!active) return;
        setPreview(data);
        setStatus('ready');
      } catch (err) {
        if (!active) return;
        setErrorReason(err instanceof InviteError ? err.reason : 'network');
        setStatus('failed');
      }
    })();

    return () => {
      active = false;
    };
  }, [token, isAuthLoading, user?.id]);

  const onJoin = useCallback(async () => {
    if (!token || !preview) return;
    setStatus('joining');
    try {
      const { groupId } = await acceptInvite(token);
      router.replace(`/group/${groupId}`);
    } catch (err) {
      setErrorReason(err instanceof InviteError ? err.reason : 'network');
      setStatus('failed');
    }
  }, [token, preview]);

  if (status === 'loading' || isAuthLoading) {
    return (
      <Screen centered maxWidth={420}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (status === 'failed') {
    return (
      <Screen centered maxWidth={420}>
        <Text style={styles.error}>{ERROR_MESSAGES[errorReason] ?? ERROR_MESSAGES.network}</Text>
        <Text style={styles.link} onPress={() => router.replace('/')}>
          Retour à l'accueil
        </Text>
      </Screen>
    );
  }

  // Lien valide, visiteur non connecté : passage par l'authentification en
  // conservant l'URL, puis retour ici.
  if (!isAuthenticated || !user) {
    return <Redirect href={{ pathname: '/login', params: { redirect: `/invite/${token}` } }} />;
  }

  if (!preview) return null;

  const expiresAt = parsePbDate(preview.expires);
  const isMember = preview.alreadyMember;

  return (
    <Screen centered maxWidth={420} style={styles.card}>
      <Text style={styles.eyebrow}>Invitation</Text>
      <Text style={styles.title}>{preview.groupName}</Text>
      <Text style={styles.meta}>
        {preview.invitedBy ? `Invité par ${preview.invitedBy}` : 'Invitation partagée'}
        {` · ${preview.memberCount} membre${preview.memberCount > 1 ? 's' : ''}`}
      </Text>
      {expiresAt && (
        <Text style={styles.meta}>Valable jusqu'au {expiresAt.toLocaleDateString()}</Text>
      )}

      <View style={styles.action}>
        <PrimaryButton
          label={isMember ? "Ouvrir l'agenda" : 'Rejoindre le groupe'}
          pending={status === 'joining'}
          onPress={isMember ? () => router.replace(`/group/${preview.groupId}`) : onJoin}
        />
      </View>

      {isMember && <Text style={styles.meta}>Tu fais déjà partie de ce groupe.</Text>}
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { alignItems: 'center' },
    eyebrow: {
      ...theme.text.label,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: theme.colors.accent,
    },
    title: { ...theme.text.title, textAlign: 'center' },
    meta: { ...theme.text.meta, textAlign: 'center' },
    action: { width: '100%', marginTop: theme.space.md },
    link: { ...theme.text.body, color: theme.colors.accent, textAlign: 'center' },
    error: { ...theme.text.body, color: theme.colors.danger, textAlign: 'center' },
  });
