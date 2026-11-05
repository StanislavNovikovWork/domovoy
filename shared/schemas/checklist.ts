import { z } from 'zod';

export const checklistKindSchema = z.enum(['shopping', 'tasks']);

export const createListSchema = z.object({
  id: z.uuid().optional(),
  householdId: z.uuid(),
  title: z.string().trim().min(1).max(80),
  kind: checklistKindSchema,
});

export const listIdSchema = z.object({
  householdId: z.uuid(),
  listId: z.uuid(),
});

export const renameListSchema = listIdSchema.extend({
  title: z.string().trim().min(1).max(80),
});

export const addItemSchema = z.object({
  id: z.uuid().optional(),
  householdId: z.uuid(),
  listId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  quantity: z.string().trim().max(40).optional(),
  dueDate: z.iso.date().optional(),
});

export const itemIdSchema = z.object({
  householdId: z.uuid(),
  listId: z.uuid(),
  itemId: z.uuid(),
});

export const toggleItemSchema = itemIdSchema.extend({
  done: z.boolean(),
});

export const addPresetSchema = z.object({
  id: z.uuid().optional(),
  householdId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  quantity: z.string().trim().max(40).optional(),
});

export const presetIdSchema = z.object({
  householdId: z.uuid(),
  presetId: z.uuid(),
});
