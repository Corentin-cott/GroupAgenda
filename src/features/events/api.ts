import { ClientResponseError } from 'pocketbase';
import { pb } from '@/lib/pocketbase';
import { toPbDate } from '@/lib/date';
import type { EventRecord, EventType, RsvpRecord } from '@/types/pocketbase';

export interface EventInput {
  title: string;
  startDate: Date;
  type: EventType;
}

export function getEvent(eventId: string): Promise<EventRecord> {
  return pb.collection('events').getOne(eventId, {
    expand: 'creator',
    requestKey: `event_${eventId}`,
  });
}

export function createEvent(
  groupId: string,
  creatorId: string,
  input: EventInput,
): Promise<EventRecord> {
  return pb.collection('events').create({
    group: groupId,
    creator: creatorId,
    title: input.title.trim(),
    start_date: toPbDate(input.startDate),
    type: input.type,
  });
}

/**
 * `group` est renvoyé dans le corps alors qu'il ne change jamais : la règle
 * `update` compare `@request.body.group`, qui est vide si le champ est absent.
 */
export function updateEvent(
  eventId: string,
  groupId: string,
  input: EventInput,
): Promise<EventRecord> {
  return pb.collection('events').update(eventId, {
    group: groupId,
    title: input.title.trim(),
    start_date: toPbDate(input.startDate),
    type: input.type,
  });
}

export function deleteEvent(eventId: string): Promise<boolean> {
  return pb.collection('events').delete(eventId);
}

export async function findRsvp(eventId: string, userId: string): Promise<RsvpRecord | null> {
  try {
    return await pb
      .collection('event_rsvps')
      .getFirstListItem(pb.filter('event = {:eventId} && user = {:userId}', { eventId, userId }), {
        requestKey: `rsvp_${eventId}`,
      });
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) return null;
    throw err;
  }
}

export async function setRsvp(eventId: string, userId: string, attending: boolean): Promise<void> {
  const existing = await findRsvp(eventId, userId);

  if (attending && !existing) {
    await pb.collection('event_rsvps').create({ event: eventId, user: userId });
  } else if (!attending && existing) {
    await pb.collection('event_rsvps').delete(existing.id);
  }
}
