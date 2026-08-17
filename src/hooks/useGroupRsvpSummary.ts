import { useCallback, useEffect, useState } from 'react';
import { ClientResponseError } from 'pocketbase';
import type { RecordSubscription, UnsubscribeFunc } from 'pocketbase';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/providers/AuthProvider';
import type { RsvpRecord } from '@/types/pocketbase';
import { useAppForeground } from './useAppForeground';

export interface EventRsvpSummary {
  count: number;
  attending: boolean;
}

const isAbort = (error: unknown) => error instanceof ClientResponseError && error.isAbort;

/** Inscrits par événement et présence de l'utilisateur, ajustés à la volée. */
export function useGroupRsvpSummary(groupId: string | undefined): Record<string, EventRsvpSummary> {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Record<string, EventRsvpSummary>>({});

  const fetchSummary = useCallback(async () => {
    if (!groupId || !user) return;
    try {
      const list = await pb.collection('event_rsvps').getFullList({
        filter: pb.filter('event.group = {:groupId}', { groupId }),
        fields: 'id,event,user',
        requestKey: `rsvp_summary_${groupId}`,
      });

      const next: Record<string, EventRsvpSummary> = {};
      for (const rsvp of list) {
        const current = next[rsvp.event] ?? { count: 0, attending: false };
        next[rsvp.event] = {
          count: current.count + 1,
          attending: current.attending || rsvp.user === user.id,
        };
      }
      setSummary(next);
    } catch (err) {
      if (!isAbort(err)) console.warn('[useGroupRsvpSummary] fetch KO', err);
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    if (!groupId || !user) {
      setSummary({});
      return;
    }

    let active = true;
    let unsubscribe: UnsubscribeFunc | undefined;

    const apply = (eventId: string, delta: number, isMine: boolean) =>
      setSummary((prev) => {
        const current = prev[eventId] ?? { count: 0, attending: false };
        return {
          ...prev,
          [eventId]: {
            count: Math.max(0, current.count + delta),
            attending: isMine ? delta > 0 : current.attending,
          },
        };
      });

    void (async () => {
      try {
        const unsub = await pb
          .collection('event_rsvps')
          .subscribe('*', (e: RecordSubscription<RsvpRecord>) => {
            if (!active) return;
            const isMine = e.record.user === user.id;
            if (e.action === 'create') apply(e.record.event, 1, isMine);
            if (e.action === 'delete') apply(e.record.event, -1, isMine);
          });

        if (!active) {
          void unsub();
          return;
        }
        unsubscribe = unsub;
      } catch (err) {
        if (active && !isAbort(err)) console.warn('[useGroupRsvpSummary] realtime KO', err);
      }

      if (active) await fetchSummary();
    })();

    return () => {
      active = false;
      void unsubscribe?.();
    };
  }, [groupId, user?.id, fetchSummary]);

  useAppForeground(fetchSummary);

  return summary;
}
