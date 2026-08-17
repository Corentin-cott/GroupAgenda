import { pb } from '@/lib/pocketbase';
import { listPersonalEvents } from '@/features/personal/api';
import type { AgendaEntry } from './types';

/** Agenda d'un tiers : assemblé et masqué par le serveur. */
export function fetchUserAgenda(userId: string): Promise<AgendaEntry[]> {
  return pb.send<AgendaEntry[]>(`/api/users/${encodeURIComponent(userId)}/agenda`, {
    method: 'GET',
    requestKey: `agenda_${userId}`,
  });
}

/** Lu directement : la règle `list` de `events` ne renvoie déjà que mes groupes, inscrit ou non. */
export async function fetchOwnAgenda(userId: string): Promise<AgendaEntry[]> {
  const [groupEvents, personalEvents, rsvps] = await Promise.all([
    pb.collection('events').getFullList({
      sort: 'start_date',
      expand: 'group',
      requestKey: 'own_agenda_events',
    }),
    listPersonalEvents(),
    pb.collection('event_rsvps').getFullList({
      filter: pb.filter('user = {:userId}', { userId }),
      fields: 'id,event',
      requestKey: 'own_agenda_rsvps',
    }),
  ]);

  const attending = new Set(rsvps.map((rsvp) => rsvp.event));

  const entries: AgendaEntry[] = [
    ...groupEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start_date,
      source: 'group' as const,
      visible: true,
      type: event.type,
      groupId: event.group,
      groupName: event.expand?.group?.name,
      attending: attending.has(event.id),
    })),
    ...personalEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start_date,
      source: 'personal' as const,
      visible: true,
    })),
  ];

  return entries.sort((a, b) => a.start.localeCompare(b.start));
}
