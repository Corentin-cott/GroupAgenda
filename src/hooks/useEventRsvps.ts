import { useCallback, useEffect, useState } from 'react';
import { ClientResponseError } from 'pocketbase';
import type { RecordSubscription, UnsubscribeFunc } from 'pocketbase';
import { setRsvp } from '@/features/events/api';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/providers/AuthProvider';
import type { RsvpRecord } from '@/types/pocketbase';

export interface UseEventRsvpsResult {
  participants: RsvpRecord[];
  isAttending: boolean;
  isLoading: boolean;
  isPending: boolean;
  toggle(): Promise<void>;
}

const isAbort = (error: unknown) => error instanceof ClientResponseError && error.isAbort;

/** Participants d'un événement, synchronisés en temps réel. */
export function useEventRsvps(eventId: string | undefined): UseEventRsvpsResult {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<RsvpRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!eventId || !user) {
      setParticipants([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: UnsubscribeFunc | undefined;
    setIsLoading(true);

    void (async () => {
      try {
        const unsub = await pb.collection('event_rsvps').subscribe(
          '*',
          (e: RecordSubscription<RsvpRecord>) => {
            if (!active || e.record.event !== eventId) return;
            setParticipants((prev) =>
              e.action === 'delete'
                ? prev.filter((item) => item.id !== e.record.id)
                : [...prev.filter((item) => item.id !== e.record.id), e.record],
            );
          },
          { filter: pb.filter('event = {:eventId}', { eventId }), expand: 'user' },
        );

        if (!active) {
          void unsub();
          return;
        }
        unsubscribe = unsub;
      } catch (err) {
        if (active && !isAbort(err)) console.warn('[useEventRsvps] realtime KO', err);
      }

      try {
        const list = await pb.collection('event_rsvps').getFullList({
          filter: pb.filter('event = {:eventId}', { eventId }),
          expand: 'user',
          requestKey: `rsvps_${eventId}`,
        });
        if (active) setParticipants(list);
      } catch (err) {
        if (!isAbort(err)) console.warn('[useEventRsvps] fetch KO', err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      void unsubscribe?.();
    };
  }, [eventId, user?.id]);

  const isAttending = !!user && participants.some((item) => item.user === user.id);

  const toggle = useCallback(async () => {
    if (!eventId || !user) return;
    setIsPending(true);
    try {
      await setRsvp(eventId, user.id, !isAttending);
    } finally {
      setIsPending(false);
    }
  }, [eventId, user, isAttending]);

  return { participants, isAttending, isLoading, isPending, toggle };
}
