import { z } from 'zod';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/shared/config/category-options';

const fields = {
  name: z.string().trim().min(1).max(40),
  icon: z.enum(CATEGORY_ICONS),
  color: z.enum(CATEGORY_COLORS),
  suggestions: z.array(z.string().trim().min(1).max(40)).max(20),
};

export const createCategorySchema = z.object({
  ...fields,
  householdId: z.uuid(),
  type: z.enum(['income', 'expense']),
});

export const updateCategorySchema = z.object({
  ...fields,
  householdId: z.uuid(),
  id: z.uuid(),
});

export const archiveCategorySchema = z.object({
  householdId: z.uuid(),
  id: z.uuid(),
});
