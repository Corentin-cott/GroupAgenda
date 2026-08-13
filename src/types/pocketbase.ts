import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

export interface BaseRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
}

export interface UserRecord extends BaseRecord {
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  name?: string;
  avatar?: string;
}

export interface GroupRecord extends BaseRecord {
  name: string;
}

export interface GroupMemberRecord extends BaseRecord {
  group: string;
  user: string;
  expand?: { group?: GroupRecord; user?: UserRecord };
}

export type EventType = 'standard' | 'rsvp';

export interface EventRecord extends BaseRecord {
  group: string;
  creator: string;
  title: string;
  /** Format PocketBase : `2026-08-13 18:00:00.000Z` — cf. `parsePbDate`. */
  start_date: string;
  type: EventType;
  expand?: { creator?: UserRecord; group?: GroupRecord };
}

export interface RsvpRecord extends BaseRecord {
  event: string;
  user: string;
  expand?: { event?: EventRecord; user?: UserRecord };
}

export interface GroupInviteRecord extends BaseRecord {
  group: string;
  /** Secret de l'URL d'invitation : la collection n'est jamais listable. */
  token: string;
  expires: string;
  created_by: string;
  expand?: { group?: GroupRecord; created_by?: UserRecord };
}

export interface Schema {
  users: UserRecord;
  groups: GroupRecord;
  group_members: GroupMemberRecord;
  events: EventRecord;
  event_rsvps: RsvpRecord;
  group_invites: GroupInviteRecord;
}

/**
 * `Omit` est indispensable : dans une simple intersection, la signature
 * `collection(idOrName: string)` héritée de la classe gagne la résolution de
 * surcharge et tout retombe en `RecordModel`.
 */
export type TypedPocketBase = Omit<PocketBase, 'collection'> & {
  collection<K extends keyof Schema>(idOrName: K): RecordService<Schema[K]>;
  collection(idOrName: string): RecordService;
};
