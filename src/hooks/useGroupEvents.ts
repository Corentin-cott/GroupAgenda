import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientResponseError } from 'pocketbase';
import type { RecordSubscription, UnsubscribeFunc } from 'pocketbase';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/providers/AuthProvider';
import type { EventRecord } from '@/types/pocketbase';

export interface UseGroupEventsResult {
  events: EventRecord[];
  isLoading: boolean;
  error: Error | null;
  /** Re-synchronisation manuelle (pull-to-refresh, retour de background...). */
  refresh(): Promise<void>;
}

const byStartDate = (a: EventRecord, b: EventRecord) =>
  a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id);

const upsert = (list: EventRecord[], record: EventRecord) =>
  [...list.filter((event) => event.id !== record.id), record].sort(byStartDate);

const isAbort = (error: unknown) => error instanceof ClientResponseError && error.isAbort;

/** Événements d'un groupe, synchronisés en temps réel. */
export function useGroupEvents(groupId: string | undefined): UseGroupEventsResult {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Évite d'écrire le résultat d'un fetch obsolète après changement de groupe.
  const activeGroupRef = useRef<string | undefined>(groupId);
  activeGroupRef.current = groupId;

  const fetchEvents = useCallback(async () => {
    if (!groupId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    try {
      const list = await pb.collection('events').getFullList({
        filter: pb.filter('group = {:groupId}', { groupId }),
        sort: 'start_date',
        expand: 'creator',
        requestKey: `group_events_${groupId}`,
      });
      if (activeGroupRef.current !== groupId) return;
      setEvents(list);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      if (isAbort(err) || activeGroupRef.current !== groupId) return;
      setError(err as Error);
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: UnsubscribeFunc | undefined;
    setIsLoading(true);

    void (async () => {
      try {
        // Abonnement avant le fetch : aucune mutation perdue dans l'intervalle.
        const unsub = await pb.collection('events').subscribe(
          '*',
          (e: RecordSubscription<EventRecord>) => {
            if (!active) return;
            // Filet si le filtre serveur n'est pas appliqué.
            if (e.record.group !== groupId) return;

            setEvents((prev) =>
              e.action === 'delete'
                ? prev.filter((event) => event.id !== e.record.id)
                : upsert(prev, e.record),
            );
          },
          {
            filter: pb.filter('group = {:groupId}', { groupId }),
            expand: 'creator',
          },
        );

        if (!active) {
          void unsub();
          return;
        }
        unsubscribe = unsub;
      } catch (err) {
        // Pas de temps réel : on dégrade en snapshot.
        if (active && !isAbort(err)) console.warn('[useGroupEvents] realtime KO', err);
      }

      await fetchEvents();
    })();

    return () => {
      active = false;
      void unsubscribe?.();
    };
  }, [groupId, user?.id, fetchEvents]);

  return { events, isLoading, error, refresh: fetchEvents };
}
