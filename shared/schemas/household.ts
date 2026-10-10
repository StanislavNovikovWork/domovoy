import { z } from 'zod';

// 32 случайных байта в base64url = 43 символа
export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const createFamilySchema = z.object({
  name: z.string().trim().min(1).max(40),
  oneTime: z.boolean().optional(),
});

export const renameHouseholdSchema = z.object({
  householdId: z.uuid(),
  name: z.string().trim().min(1).max(40),
});

export const householdIdSchema = z.object({
  householdId: z.uuid(),
});

export const revokeInviteSchema = z.object({
  householdId: z.uuid(),
  inviteId: z.uuid(),
});

export const removeMemberSchema = z.object({
  householdId: z.uuid(),
  userId: z.string().min(1),
});

export const acceptInviteSchema = z.object({
  token: inviteTokenSchema,
});
