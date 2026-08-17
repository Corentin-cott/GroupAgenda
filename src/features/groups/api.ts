import { ClientResponseError } from 'pocketbase';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { pb } from '@/lib/pocketbase';
import { toPbDate } from '@/lib/date';
import type { GroupInviteRecord, GroupMemberRecord, GroupRecord } from '@/types/pocketbase';

export const INVITE_TTL_DAYS = 7;

export function getGroup(groupId: string): Promise<GroupRecord> {
  return pb.collection('groups').getOne(groupId, { requestKey: `group_${groupId}` });
}

/** Le créateur est inscrit comme premier membre par un hook serveur. */
export function createGroup(name: string): Promise<GroupRecord> {
  return pb.collection('groups').create({ name: name.trim() });
}

export function listGroupMembers(groupId: string): Promise<GroupMemberRecord[]> {
  return pb.collection('group_members').getFullList({
    filter: pb.filter('group = {:groupId}', { groupId }),
    expand: 'user',
    sort: 'created',
    requestKey: `members_${groupId}`,
  });
}

/** Le groupe est supprimé côté serveur si c'était le dernier membre. */
export function leaveGroup(membershipId: string): Promise<boolean> {
  return pb.collection('group_members').delete(membershipId);
}

/** 64 caractères URL-safe : `octet & 63` est non biaisé, 256 étant divisible par 64. */
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** 32 caractères ≈ 192 bits d'entropie. */
export async function generateInviteToken(length = 32): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  let token = '';
  for (const byte of bytes) token += TOKEN_ALPHABET.charAt(byte & 63);
  return token;
}

export function buildInviteUrl(token: string): string {
  const base = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/+$/, '');
  // Sans URL publique configurée, on retombe sur le schéma local (dev, Expo Go).
  return base ? `${base}/invite/${token}` : Linking.createURL(`/invite/${token}`);
}

export interface CreatedInvite {
  invite: GroupInviteRecord;
  url: string;
}

/** La règle `create` de `group_invites` réserve l'appel aux membres du groupe. */
export async function createGroupInvite(
  groupId: string,
  userId: string,
  ttlDays = INVITE_TTL_DAYS,
): Promise<CreatedInvite> {
  const token = await generateInviteToken();
  const expires = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const invite = await pb.collection('group_invites').create({
    group: groupId,
    token,
    expires: toPbDate(expires),
    created_by: userId,
  });

  return { invite, url: buildInviteUrl(token) };
}

export function revokeGroupInvite(inviteId: string): Promise<boolean> {
  return pb.collection('group_invites').delete(inviteId);
}

export interface ActiveInvite {
  id: string;
  token: string;
  expires: string;
  created: string;
  createdBy: string | null;
}

/** Liens actifs, réservés aux membres : `group_invites` n'étant pas listable, ça passe par le serveur. */
export function listGroupInvites(groupId: string): Promise<ActiveInvite[]> {
  return pb.send<ActiveInvite[]>(`/api/groups/${encodeURIComponent(groupId)}/invites`, {
    method: 'GET',
    requestKey: `group_invites_${groupId}`,
  });
}

export interface InvitePreview {
  groupId: string;
  groupName: string;
  /** null si le compte auteur a été supprimé. */
  invitedBy: string | null;
  expires: string;
  memberCount: number;
  /** Renseigné seulement si l'appel est authentifié. */
  alreadyMember: boolean;
}

export type InviteErrorReason = 'not-found' | 'expired' | 'network';

export class InviteError extends Error {
  constructor(readonly reason: InviteErrorReason) {
    super(`invite:${reason}`);
  }
}

function toInviteError(err: unknown): InviteError {
  if (err instanceof ClientResponseError) {
    if (err.status === 404) return new InviteError('not-found');
    if (err.status === 410) return new InviteError('expired');
  }
  return new InviteError('network');
}

/** Aperçu sans session. Endpoint dédié : `group_invites` listable laisserait aspirer tous les tokens. */
export async function fetchInvitePreview(token: string): Promise<InvitePreview> {
  try {
    return await pb.send<InvitePreview>(`/api/invites/${encodeURIComponent(token)}`, {
      method: 'GET',
      requestKey: `invite_${token}`,
    });
  } catch (err) {
    throw toInviteError(err);
  }
}

/** Crée l'entrée `group_members` côté serveur. Idempotent. */
export async function acceptInvite(token: string): Promise<{ groupId: string }> {
  try {
    return await pb.send<{ groupId: string }>('/api/invites/accept', {
      method: 'POST',
      body: { token },
      requestKey: `accept_invite_${token}`,
    });
  } catch (err) {
    throw toInviteError(err);
  }
}
