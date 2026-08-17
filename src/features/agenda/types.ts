import type { EventType } from '@/types/pocketbase';

/** Ligne d'agenda, quelle que soit son origine : groupe, personnel ou masquée. */
export interface AgendaEntry {
  id: string;
  title: string;
  /** Format PocketBase, cf. `parsePbDate`. */
  start: string;
  source: 'group' | 'personal';
  /** false : titre remplacé par le serveur, aucun détail consultable. */
  visible: boolean;
  type?: EventType;
  groupId?: string;
  groupName?: string;
  /** Inscription de l'utilisateur courant, sur les événements de type `rsvp`. */
  attending?: boolean;
}
