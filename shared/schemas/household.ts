import { z } from 'zod';
import { SPACE_ICONS } from '@/shared/config/space-icons';

// 32 случайных байта в base64url = 43 символа
export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1).max(40),
  // проект: id родительского пространства; без него создаётся корневое (периодическое) пространство
  parentId: z.uuid().optional(),
});

export const renameHouseholdSchema = z.object({
  householdId: z.uuid(),
  name: z.string().trim().min(1).max(40),
});

export const householdIdSchema = z.object({
  householdId: z.uuid(),
});

// иконка пространства из фиксированного набора; null — без иконки
export const setSpaceIconSchema = z.object({
  householdId: z.uuid(),
  icon: z.enum(SPACE_ICONS).nullable(),
});

export const revokeInviteSchema = z.object({
  householdId: z.uuid(),
  inviteId: z.uuid(),
});

export const removeMemberSchema = z.object({
  householdId: z.uuid(),
  userId: z.string().min(1),
});

export const addTripParticipantSchema = z.object({
  householdId: z.uuid(),
  userId: z.string().min(1),
});

export const addTripGuestSchema = z.object({
  householdId: z.uuid(),
  name: z.string().trim().min(1).max(40),
});

export const addGuestSchema = z.object({
  householdId: z.uuid(),
  name: z.string().trim().min(1).max(40),
});

export const removeGuestSchema = z.object({
  householdId: z.uuid(),
  guestId: z.uuid(),
});

export const acceptInviteSchema = z.object({
  token: inviteTokenSchema,
});
