import { useEffect, useState } from 'react';
import { ClientResponseError } from 'pocketbase';
import type { RecordSubscription, UnsubscribeFunc } from 'pocketbase';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/providers/AuthProvider';
import type { RsvpRecord } from '@/types/pocketbase';

const isAbort = (error: unknown) => error instanceof ClientResponseError && error.isAbort;

/**
 * Nombre d'inscrits par événement, pour la liste d'agenda. Les compteurs sont
 * ajustés à la volée : les règles d'API ne laissent passer que les RSVP des
 * groupes de l'utilisateur, et un id d'événement inconnu ne gêne personne.
 */
export function useGroupRsvpCounts(groupId: string | undefined): Record<string, number> {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!groupId || !user) {
      setCounts({});
      return;
    }

    let active = true;
    let unsubscribe: UnsubscribeFunc | undefined;

    const shift = (eventId: string, delta: number) =>
      setCounts((prev) => ({ ...prev, [eventId]: Math.max(0, (prev[eventId] ?? 0) + delta) }));

    void (async () => {
      try {
        const unsub = await pb
          .collection('event_rsvps')
          .subscribe('*', (e: RecordSubscription<RsvpRecord>) => {
            if (!active) return;
            if (e.action === 'create') shift(e.record.event, 1);
            if (e.action === 'delete') shift(e.record.event, -1);
          });

        if (!active) {
          void unsub();
          return;
        }
        unsubscribe = unsub;
      } catch (err) {
        if (active && !isAbort(err)) console.warn('[useGroupRsvpCounts] realtime KO', err);
      }

      try {
        const list = await pb.collection('event_rsvps').getFullList({
          filter: pb.filter('event.group = {:groupId}', { groupId }),
          fields: 'id,event',
          requestKey: `rsvp_counts_${groupId}`,
        });
        if (!active) return;

        const next: Record<string, number> = {};
        for (const rsvp of list) next[rsvp.event] = (next[rsvp.event] ?? 0) + 1;
        setCounts(next);
      } catch (err) {
        if (!isAbort(err)) console.warn('[useGroupRsvpCounts] fetch KO', err);
      }
    })();

    return () => {
      active = false;
      void unsubscribe?.();
    };
  }, [groupId, user?.id]);

  return counts;
}
