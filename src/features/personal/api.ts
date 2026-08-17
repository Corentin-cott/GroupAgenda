import { pb } from '@/lib/pocketbase';
import { toPbDate } from '@/lib/date';
import type { PersonalEventRecord } from '@/types/pocketbase';

export interface PersonalEventInput {
  title: string;
  startDate: Date;
}

export function listPersonalEvents(): Promise<PersonalEventRecord[]> {
  return pb.collection('personal_events').getFullList({
    sort: 'start_date',
    requestKey: 'personal_events',
  });
}

export function getPersonalEvent(eventId: string): Promise<PersonalEventRecord> {
  return pb.collection('personal_events').getOne(eventId, { requestKey: `personal_${eventId}` });
}

export function createPersonalEvent(
  ownerId: string,
  input: PersonalEventInput,
): Promise<PersonalEventRecord> {
  return pb.collection('personal_events').create({
    owner: ownerId,
    title: input.title.trim(),
    start_date: toPbDate(input.startDate),
  });
}

export function updatePersonalEvent(
  eventId: string,
  input: PersonalEventInput,
): Promise<PersonalEventRecord> {
  return pb.collection('personal_events').update(eventId, {
    title: input.title.trim(),
    start_date: toPbDate(input.startDate),
  });
}

export function deletePersonalEvent(eventId: string): Promise<boolean> {
  return pb.collection('personal_events').delete(eventId);
}
